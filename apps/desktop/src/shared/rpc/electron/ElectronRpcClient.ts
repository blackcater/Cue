import type { WebContents } from 'electron'

import { RpcError, type IRpcErrorDefinition } from '../RpcError'
import type { RpcClient, Rpc } from '../types'

export class ElectronRpcClient implements RpcClient {
	readonly clientId: string
	readonly groupId?: string

	private readonly _webContents: WebContents
	private readonly _pendingCalls = new Map<
		string,
		{ resolve: Function; reject: Function }
	>()
	private readonly _eventListeners = new Map<
		string,
		Set<(...args: unknown[]) => void>
	>()
	private readonly _streamHandlers = new Map<
		string,
		{ onChunk: Function; onDone: Function; cancel: Function }
	>()
	private _invokeCounter = 0

	constructor(webContents: WebContents, groupId?: string) {
		this._webContents = webContents
		this.clientId = `client-${webContents.id}`

		if (groupId !== undefined) {
			this.groupId = groupId
		}

		// Listen for RPC responses
		webContents.on('ipc-message', ((
			channel: string,
			...args: unknown[]
		) => {
			if (channel.startsWith('rpc:response:')) {
				const invokeId = channel.replace('rpc:response:', '')
				const pending = this._pendingCalls.get(invokeId)
				if (pending) {
					const payload = args[0] as {
						result?: unknown
						error?: IRpcErrorDefinition
					}
					if (payload.error) {
						pending.reject(RpcError.fromJSON(payload.error))
					} else {
						pending.resolve(payload.result)
					}
					this._pendingCalls.delete(invokeId)
				}
			} else if (channel.startsWith('rpc:event:')) {
				const eventName = channel.replace('rpc:event:', '')
				const listeners = this._eventListeners.get(eventName)
				if (listeners) {
					for (const listener of listeners) {
						listener(...args)
					}
				}
			} else if (channel.startsWith('rpc:stream:')) {
				// Format: rpc:stream:eventPath:invokeId
				const parts = channel.split(':')
				const invokeId = parts.at(-1)!
				const payload = args[0] as { chunk: unknown; done: boolean }
				const handler = this._streamHandlers.get(invokeId)
				if (handler) {
					if (payload.done) {
						handler.onDone()
					} else {
						handler.onChunk(payload.chunk)
					}
				}
			}
		}) as any)
	}

	async call<T>(event: string, ...args: unknown[]): Promise<T> {
		const invokeId = `invoke-${++this._invokeCounter}`
		const eventPath = event.replaceAll(/^\/|\/$/g, '')

		return new Promise((resolve, reject) => {
			this._pendingCalls.set(invokeId, {
				resolve: (...resolveArgs: unknown[]) => {
					resolve(resolveArgs[0] as T)
				},
				reject: (...rejectArgs: unknown[]) => {
					reject(rejectArgs[0])
				},
			})

			this._webContents.send(`rpc:invoke:${eventPath}`, {
				invokeId,
				args,
			})
		})
	}

	stream<T>(event: string, ...args: unknown[]): Rpc.StreamResult<T> {
		const invokeId = `invoke-${++this._invokeCounter}`
		const eventPath = event.replaceAll(/^\/|\/$/g, '')
		const chunks: T[] = []

		const cancelStream = () => {
			this._webContents.send(`rpc:cancel:${eventPath}:${invokeId}`)
		}

		// Set up stream handlers before sending
		this._streamHandlers.set(invokeId, {
			onChunk: (chunk: unknown) => {
				chunks.push(chunk as T)
			},
			onDone: () => {
				this._streamHandlers.delete(invokeId)
			},
			cancel: cancelStream,
		})

		// Send invoke message
		this._webContents.send(`rpc:invoke:${eventPath}`, { invokeId, args })

		const iterator: AsyncIterator<T> = {
			next: async () => {
				if (chunks.length > 0) {
					return { done: false, value: chunks.shift()! }
				}
				// Wait for more chunks
				await new Promise<void>((resolve) => {
					const check = () => {
						if (chunks.length > 0) {
							resolve()
						} else if (this._streamHandlers.has(invokeId)) {
							setTimeout(check, 10)
						} else {
							resolve() // Stream ended
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
				const handler = this._streamHandlers.get(invokeId)
				if (handler?.cancel) {
					handler.cancel()
				}
				this._streamHandlers.delete(invokeId)
			},
		}
	}

	onEvent(
		event: string,
		listener: (...args: unknown[]) => void
	): Rpc.CancelFn {
		const channel = `rpc:event:${event}`

		if (!this._eventListeners.has(event)) {
			this._eventListeners.set(event, new Set())
			this._webContents.on(
				channel as any,
				((...listenerArgs: unknown[]) => {
					const listeners = this._eventListeners.get(event)
					if (listeners) {
						for (const l of listeners) {
							l(...listenerArgs)
						}
					}
				}) as any
			)
		}

		this._eventListeners.get(event)!.add(listener)

		return () => {
			const listeners = this._eventListeners.get(event)
			if (listeners) {
				listeners.delete(listener)
			}
		}
	}
}
