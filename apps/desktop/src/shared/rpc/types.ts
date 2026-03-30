import type { BrowserWindow, WebContents } from 'electron'

import type { StandardSchemaV1 } from '@standard-schema/spec'

export namespace Rpc {
	export type HandlerFn<T = any> = (
		ctx: RequestContext,
		...args: any[]
	) => T | Promise<T> | AsyncIterator<T>

	export interface HandleOptions {
		schema?: StandardSchemaV1
	}

	export type CancelFn = () => void

	export type Target =
		| { type: 'broadcast' }
		| { type: 'group'; groupId: string }
		| { type: 'client'; clientId: string }

	export interface RequestContext {
		readonly clientId: string
		readonly vaultId?: string
	}

	export type StreamResult<T> = {
		[Symbol.asyncIterator](): AsyncIterator<T>
		cancel(): void
	}
}

export interface RpcServer {
	router(namespace: string): RpcRouter

	handle(event: string, handler: Rpc.HandlerFn): void
	handle(
		event: string,
		options: Rpc.HandleOptions,
		handler: Rpc.HandlerFn
	): void

	push(event: string, target: Rpc.Target, ...args: any[]): void
}

export interface RpcRouter {
	group(namespace: string): RpcRouter

	handle(event: string, handler: Rpc.HandlerFn): void
	handle(
		event: string,
		options: Rpc.HandleOptions,
		handler: Rpc.HandlerFn
	): void
}

export interface RpcClient {
	readonly clientId: string
	readonly groupId?: string

	call<T>(event: string, ...args: any[]): Promise<T>
	stream<T>(event: string, ...args: any[]): Rpc.StreamResult<T>
	onEvent(event: string, listener: (...args: any[]) => void): Rpc.CancelFn
}

export interface IWindowRegistry {
	registerWindow(window: BrowserWindow, group?: string): string
	unregisterWindow(window: BrowserWindow): void

	joinGroup(clientId: string, groupId: string): void
	leaveGroup(clientId: string, groupId: string): void

	sendToClient(clientId: string, channel: string, ...args: any[]): void
	sendToGroup(groupId: string, channel: string, ...args: any[]): void
	sendToAll(channel: string, ...args: any[]): void

	getWebContentsByClientId(clientId: string): WebContents | null
	getClientIdByWebContents(webContents: WebContents): string | null
	getGroupsByClientId(clientId: string): string[]
}
