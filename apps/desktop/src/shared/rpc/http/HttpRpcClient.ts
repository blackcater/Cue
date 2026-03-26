import { RpcError, type IRpcErrorDefinition } from '../RpcError'
import type { RpcCallOptions, RpcClient, Rpc } from '../types'

export class HttpRpcClient implements RpcClient {
	readonly clientId: string
	readonly groupId?: string

	private readonly _baseUrl: string
	private _eventSource: EventSource | null = null
	private _eventListeners = new Map<
		string,
		Set<(...args: unknown[]) => void>
	>()

	constructor(baseUrl: string, clientId?: string, groupId?: string) {
		this._baseUrl = baseUrl.replace(/\/$/, '')
		this.clientId = clientId || `http-client-${Date.now()}`

		if (groupId !== undefined) {
			this.groupId = groupId
		}
	}

	async call<T>(
		event: string,
		options: RpcCallOptions = {},
		...args: unknown[]
	): Promise<T> {
		const normalizedEvent = event.replace(/^\/|\/$/g, '')

		const response = await fetch(
			`${this._baseUrl}/rpc/${normalizedEvent}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-rpc-client-id': this.clientId,
					...(this.groupId && { 'x-rpc-group-id': this.groupId }),
				},
				body: JSON.stringify(args),
				signal: options.signal ?? null,
			}
		)

		if (!response.ok) {
			throw new RpcError(
				'HTTP_ERROR',
				`HTTP ${response.status}: ${response.statusText}`
			)
		}

		const payload = await response.json()

		if (payload.error) {
			throw RpcError.fromJSON(payload.error as IRpcErrorDefinition)
		}

		return payload.result as T
	}

	stream<T>(
		event: string,
		options: RpcCallOptions = {},
		...args: unknown[]
	): Rpc.StreamResult<T> {
		const normalizedEvent = event.replace(/^\/|\/$/g, '')

		let reader: ReadableStreamDefaultReader<Uint8Array> | null = null
		let decoder: TextDecoder | null = null
		let buffer = ''

		const iterator: AsyncIterator<T> = {
			next: async () => {
				if (!reader) {
					const response = await fetch(
						`${this._baseUrl}/rpc/${normalizedEvent}`,
						{
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								'x-rpc-client-id': this.clientId,
								Accept: 'text/event-stream',
							},
							body: JSON.stringify(args),
							signal: options.signal ?? null,
						}
					)

					if (!response.ok) {
						throw new RpcError(
							'HTTP_ERROR',
							`HTTP ${response.status}: ${response.statusText}`
						)
					}

					reader = response.body!.getReader()
					decoder = new TextDecoder()
				}

				const { done, value } = await reader.read()
				if (done) {
					return { done: true, value: undefined }
				}

				buffer += decoder!.decode(value, { stream: true })
				const lines = buffer.split('\n')
				buffer = lines.pop()!

				for (const line of lines) {
					if (line.startsWith('data: ')) {
						return {
							done: false,
							value: JSON.parse(line.slice(6)) as T,
						}
					}
				}

				return iterator.next()
			},
		}

		return {
			[Symbol.asyncIterator]: () => iterator,
			cancel: () => {
				if (reader) {
					reader.releaseLock()
				}
			},
		}
	}

	onEvent(
		event: string,
		listener: (...args: unknown[]) => void
	): Rpc.CancelFn {
		if (!this._eventSource) {
			this._eventSource = new EventSource(`${this._baseUrl}/rpc/events`)

			this._eventSource.addEventListener('push', (e: MessageEvent) => {
				try {
					const { event: eventName, args } = JSON.parse(e.data)
					const listeners = this._eventListeners.get(eventName)
					if (listeners) {
						for (const l of listeners) {
							l(...args)
						}
					}
				} catch {
					// Ignore parse errors
				}
			})
		}

		if (!this._eventListeners.has(event)) {
			this._eventListeners.set(event, new Set())
		}
		this._eventListeners.get(event)!.add(listener)

		return () => {
			const listeners = this._eventListeners.get(event)
			if (listeners) {
				listeners.delete(listener)
				if (listeners.size === 0) {
					this._eventListeners.delete(event)
				}
			}
			// Close EventSource if no listeners
			if (this._eventListeners.size === 0 && this._eventSource) {
				this._eventSource.close()
				this._eventSource = null
			}
		}
	}
}
