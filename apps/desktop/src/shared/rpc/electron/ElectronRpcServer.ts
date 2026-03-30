import type { IpcMain } from 'electron'

import { RpcError } from '../RpcError'
import type { RpcServer, RpcRouter, Rpc, IWindowRegistry } from '../types'
import { ElectronRpcRouter } from './ElectronRpcRouter'

export class ElectronRpcServer implements RpcServer {
	readonly #registry: IWindowRegistry
	readonly #ipcMain: IpcMain

	constructor(registry: IWindowRegistry, ipcMain: IpcMain) {
		this.#registry = registry
		this.#ipcMain = ipcMain
	}

	router(namespace: string): RpcRouter {
		const prefix = this.#normalizeEvent(namespace)
		return new ElectronRpcRouter(this, prefix)
	}

	handle(event: string, handler: Rpc.HandlerFn): void
	handle(
		event: string,
		options: Rpc.HandleOptions,
		handler: Rpc.HandlerFn
	): void
	handle(
		event: string,
		optionsOrHandler: Rpc.HandleOptions | Rpc.HandlerFn,
		maybeHandler?: Rpc.HandlerFn
	): void {
		const eventPath = this.#normalizeEvent(event)
		const handlerFn =
			typeof optionsOrHandler === 'function'
				? optionsOrHandler
				: maybeHandler!

		// Listen on invoke:xxx channel for client calls
		this.#ipcMain.on(
			`rpc:invoke:${eventPath}`,
			async (e, payload: { invokeId: string; args: unknown[] }) => {
				const { invokeId, args } = payload
				// Get clientId by WebContents
				const clientId = this.#registry.getClientIdByWebContents(
					e.sender
				)
				if (!clientId) {
					// Original response (for ElectronRpcClient via webContents)
					e.sender.send(`rpc:response:${invokeId}`, {
						error: new RpcError(
							RpcError.UNAUTHORIZED,
							'Unknown client'
						).toJSON(),
					})
					// Generic channel response (for IpcRendererRpcClient via ipcRenderer)
					e.sender.send('rpc:response', {
						channel: `rpc:response:${invokeId}`,
						error: new RpcError(
							RpcError.UNAUTHORIZED,
							'Unknown client'
						).toJSON(),
					})
					return
				}

				try {
					const result = await handlerFn({ clientId }, ...args)

					// Handle async iterator (streaming)
					if (result && typeof result === 'object') {
						const asyncIterator = (result as any)[
							Symbol.asyncIterator
						]
						if (typeof asyncIterator === 'function') {
							const iterator = asyncIterator.call(result)
							const streamChannel = `rpc:stream:${eventPath}:${invokeId}`

							for await (const chunk of iterator) {
								// Send streaming chunk back
								e.sender.send(streamChannel, {
									chunk,
									done: false,
								})
								// Also send via generic channel for IpcRendererRpcClient
								e.sender.send('rpc:stream', {
									channel: streamChannel,
									chunk,
									done: false,
								})
							}

							// Streaming completion
							e.sender.send(streamChannel, {
								chunk: null,
								done: true,
							})
							e.sender.send('rpc:stream', {
								channel: streamChannel,
								chunk: null,
								done: true,
							})
							return
						}
					}

					// Original response (for ElectronRpcClient via webContents)
					e.sender.send(`rpc:response:${invokeId}`, { result })
					// Generic channel response (for IpcRendererRpcClient via ipcRenderer)
					e.sender.send('rpc:response', {
						channel: `rpc:response:${invokeId}`,
						result,
					})
				} catch (err) {
					const rpcError = RpcError.from(err)
					// Original error response
					e.sender.send(`rpc:response:${invokeId}`, {
						error: rpcError.toJSON(),
					})
					// Generic channel error (for IpcRendererRpcClient)
					e.sender.send('rpc:response', {
						channel: `rpc:response:${invokeId}`,
						error: rpcError.toJSON(),
					})
				}
			}
		)
	}

	push(event: string, target: Rpc.Target, ...args: unknown[]): void {
		const channel = `rpc:event:${this.#normalizeEvent(event)}`

		if (target.type === 'broadcast') {
			this.#registry.sendToAll(channel, ...args)
		} else if (target.type === 'client' && target.clientId) {
			this.#registry.sendToClient(target.clientId, channel, ...args)
		} else if (target.type === 'group' && target.groupId) {
			this.#registry.sendToGroup(target.groupId, channel, ...args)
		}
	}

	#normalizeEvent(event: string): string {
		return event.replaceAll(/\/+/g, '/').replaceAll(/^\/|\/$/g, '')
	}
}
