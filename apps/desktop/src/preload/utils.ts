import type {
	CallMethodNames,
	RpcClient,
	StreamMethodNames,
} from '@/shared/rpc'

/**
 * Helper type to build a typed API object from a handler and method names.
 */
export type HandlerMethods<
	Handler extends object,
	Methods extends ReadonlyArray<keyof Handler>,
> = {
	[K in Methods[number]]: K extends keyof Handler ? Handler[K] : never
}

export function createRpc(client: RpcClient): RpcClient {
	return {
		clientId: client.clientId,
		groupId: client.groupId,
		call: (event: string, ...args: any[]) => client.call(event, ...args),
		stream: (event: string, ...args: any[]) =>
			client.stream(event, ...args),
		onEvent: (event: string, listener: any) =>
			client.onEvent(event, listener),
	} as any satisfies RpcClient
}

/**
 * Builds a typed API facade for call-only methods (rpc.call).
 *
 * @example
 * ```typescript
 * const files = buildCallApi<FilesHandler>('files', ['list', 'search'], rpc)
 * await files.list(dirPath)  // uses rpc.call
 * await files.search(query, rootPath)  // uses rpc.call
 * ```
 */
export function buildCallApi<Handler extends object>(
	namespace: string,
	methods: ReadonlyArray<CallMethodNames<Handler>>,
	rpc: RpcClient
): HandlerMethods<Handler, typeof methods> {
	const api = {} as Record<string, (...args: unknown[]) => unknown>
	for (const method of methods) {
		const methodPath = `/${namespace}/${String(method)}`
		api[String(method)] = (...args: unknown[]) =>
			rpc.call(methodPath, ...args)
	}
	return api as HandlerMethods<Handler, typeof methods>
}

/**
 * Builds a typed API facade for stream-only methods (rpc.stream).
 *
 * @example
 * ```typescript
 * const chat = buildStreamApi<ChatHandler>('chat', ['query'], rpc)
 * for await (const chunk of chat.query(msg)) {  // uses rpc.stream
 *   // ...
 * }
 * ```
 */
export function buildStreamApi<Handler extends object>(
	namespace: string,
	methods: ReadonlyArray<StreamMethodNames<Handler>>,
	rpc: RpcClient
): HandlerMethods<Handler, typeof methods> {
	const api = {} as Record<string, (...args: unknown[]) => unknown>
	for (const method of methods) {
		const methodPath = `/${namespace}/${String(method)}`
		api[String(method)] = (...args: unknown[]) =>
			rpc.stream(methodPath, ...args)
	}
	return api as HandlerMethods<Handler, typeof methods>
}
