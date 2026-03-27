import type { IpcRenderer } from 'electron'

import { RpcError, type IRpcErrorDefinition } from '../RpcError'
import type { Rpc, RpcClient } from '../types'

export class IpcRendererRpcClient implements RpcClient {
	readonly clientId: string
	readonly groupId?: string

	readonly #ipcRenderer: IpcRenderer
	readonly #pendingCalls = new Map<
		string,
		{ resolve: Function; reject: Function }
	>()
	readonly #eventListeners = new Map<
		string,
		Set<(...args: unknown[]) => void>
	>()
	readonly #streamHandlers = new Map<
		string,
		{ onChunk: Function; onDone: Function; cancel: Function }
	>()
	#invokeCounter = 0

	constructor(ipcRenderer: IpcRenderer, groupId?: string) {
		this.#ipcRenderer = ipcRenderer
		this.clientId = 'ipc-renderer-client'
		if (groupId !== undefined) {
			this.groupId = groupId
		}

		// Listen for generic rpc:response channel
		// Server sends to this channel with full channel info in payload
		ipcRenderer.on('rpc:response', (...args: unknown[]) => {
			// args[0] is the event (unused), args[1] is the payload
			const payload = args[1] as {
				channel: string
				result?: unknown
				error?: IRpcErrorDefinition
			}
			if (!payload?.channel) return

			// Extract invokeId from channel like "rpc:response:invoke-1"
			const invokeId = payload.channel.split(':').slice(2).join(':')
			const pending = this.#pendingCalls.get(invokeId)
			if (pending) {
				if (payload.error) {
					pending.reject(RpcError.fromJSON(payload.error))
				} else {
					pending.resolve(payload.result)
				}
				this.#pendingCalls.delete(invokeId)
			}
		})

		// Listen for generic rpc:event channel
		ipcRenderer.on('rpc:event', (...args: unknown[]) => {
			const payload = args[1] as { channel: string; data?: unknown[] }
			if (!payload?.channel) return
			// channel format: "rpc:event:eventName"
			const eventName = payload.channel.split(':').slice(2).join(':')
			const listeners = this.#eventListeners.get(eventName)
			if (listeners) {
				for (const listener of listeners) {
					listener(...(payload.data || []))
				}
			}
		})

		// Listen for generic rpc:stream channel
		ipcRenderer.on('rpc:stream', (...args: unknown[]) => {
			const payload = args[1] as {
				channel: string
				chunk?: unknown
				done?: boolean
			}
			if (!payload?.channel) return
			// channel format: "rpc:stream:eventPath:invokeId"
			const parts = payload.channel.split(':')
			const invokeId = parts.at(-1)!
			const handler = this.#streamHandlers.get(invokeId)
			if (handler) {
				if (payload.done) {
					handler.onDone()
				} else {
					handler.onChunk(payload.chunk)
				}
			}
		})
	}

	async call<T>(event: string, ...args: unknown[]): Promise<T> {
		const invokeId = `invoke-${++this.#invokeCounter}`
		const eventPath = event.replaceAll(/^\/|\/$/g, '')

		return new Promise((resolve, reject) => {
			this.#pendingCalls.set(invokeId, {
				resolve: (...resolveArgs: unknown[]) => {
					resolve(resolveArgs[0] as T)
				},
				reject: (...rejectArgs: unknown[]) => {
					reject(rejectArgs[0])
				},
			})

			this.#ipcRenderer.send(`rpc:invoke:${eventPath}`, {
				invokeId,
				args,
			})
		})
	}

	stream<T>(event: string, ...args: unknown[]): Rpc.StreamResult<T> {
		const invokeId = `invoke-${++this.#invokeCounter}`
		const eventPath = event.replaceAll(/^\/|\/$/g, '')
		const chunks: T[] = []

		const cancelStream = () => {
			this.#ipcRenderer.send(`rpc:cancel:${eventPath}:${invokeId}`)
		}

		this.#streamHandlers.set(invokeId, {
			onChunk: (chunk: unknown) => {
				chunks.push(chunk as T)
			},
			onDone: () => {
				this.#streamHandlers.delete(invokeId)
			},
			cancel: cancelStream,
		})

		this.#ipcRenderer.send(`rpc:invoke:${eventPath}`, { invokeId, args })

		const iterator: AsyncIterator<T> = {
			next: async () => {
				if (chunks.length > 0) {
					return { done: false, value: chunks.shift()! }
				}
				await new Promise<void>((resolve) => {
					const check = () => {
						if (chunks.length > 0) {
							resolve()
						} else if (this.#streamHandlers.has(invokeId)) {
							setTimeout(check, 10)
						} else {
							resolve()
						}
					}
					check()
				})
				if (chunks.length > 0) {
					return { done: false, value: chunks.shift()! }
				}
				return { done: true, value: undefined }
			},
		}

		return {
			[Symbol.asyncIterator]: () => iterator,
			cancel: () => {
				const handler = this.#streamHandlers.get(invokeId)
				if (handler?.cancel) {
					handler.cancel()
				}
				this.#streamHandlers.delete(invokeId)
			},
		}
	}

	onEvent(
		event: string,
		listener: (...args: unknown[]) => void
	): Rpc.CancelFn {
		if (!this.#eventListeners.has(event)) {
			this.#eventListeners.set(event, new Set())
		}
		this.#eventListeners.get(event)!.add(listener)

		return () => {
			const listeners = this.#eventListeners.get(event)
			if (listeners) {
				listeners.delete(listener)
				if (listeners.size === 0) {
					this.#eventListeners.delete(event)
				}
			}
		}
	}
}
