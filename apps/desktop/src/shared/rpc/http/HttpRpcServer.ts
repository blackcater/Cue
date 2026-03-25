import type { Context } from 'hono'
import type { RpcServer, RpcRouter, Rpc, HandleOptions } from '../types'
import { RpcError } from '../RpcError'

interface RegisteredHandler {
    handler: Rpc.HandlerFn
    options?: HandleOptions
}

export class HttpRpcServer implements RpcServer {
    private handlers = new Map<string, RegisteredHandler>()
    private app: any

    constructor(app: any) {
        this.app = app
        this.setupRoutes()
    }

    private setupRoutes() {
        // POST /rpc/** - RPC invocation (wildcard catches all paths under /rpc/)
        const self = this
        this.app.post('/rpc/**', async (c: Context) => {
            // Extract path after /rpc/ using the full path
            const fullPath = c.req.path
            const rpcIndex = fullPath.indexOf('/rpc/')
            const path = rpcIndex >= 0 ? fullPath.slice(rpcIndex + 5) : fullPath
            const args = await c.req.json().catch(() => [])

            const handler = self.handlers.get(path)
            if (!handler) {
                return c.json(
                    { error: { code: 'NOT_FOUND', message: `Handler not found: ${path}` } },
                    404
                )
            }

            const ctx: Rpc.RequestContext = {
                clientId: self.getClientId(c),
            }

            try {
                const result = await handler.handler(ctx, ...args)

                // Handle async iterator (streaming) - collect all chunks
                if (result && typeof result === 'object' && Symbol.asyncIterator in result) {
                    const chunks: unknown[] = []
                    for await (const chunk of (result as AsyncIterator<unknown>)) {
                        chunks.push(chunk)
                    }
                    return c.json({ result: chunks })
                }

                return c.json({ result })
            } catch (err) {
                const rpcError = RpcError.from(err)
                return c.json({ error: rpcError.toJSON() }, 500)
            }
        })
    }

    handle(event: string, handler: Rpc.HandlerFn): void
    handle(event: string, options: HandleOptions, handler: Rpc.HandlerFn): void
    handle(
        event: string,
        optionsOrHandler: HandleOptions | Rpc.HandlerFn,
        maybeHandler?: Rpc.HandlerFn
    ): void {
        const eventPath = this.normalizeEvent(event)
        const { handler, options } =
            typeof optionsOrHandler === 'function'
                ? { handler: optionsOrHandler, options: undefined }
                : { handler: maybeHandler!, options: optionsOrHandler }

        this.handlers.set(eventPath, { handler, options })
    }

    router(namespace: string): RpcRouter {
        const prefix = this.normalizeEvent(namespace)
        return {
            handle: (event: string, handler: Rpc.HandlerFn) => {
                this.handle(`${prefix}/${event}`, handler)
            },
            handle: (
                event: string,
                options: HandleOptions,
                handler: Rpc.HandlerFn
            ) => {
                this.handle(`${prefix}/${event}`, options, handler)
            },
            router: (ns: string) => {
                return this.router(`${prefix}/${ns}`)
            },
        }
    }

    push(event: string, target: Rpc.Target, ...args: unknown[]): void {
        // HTTP push is deferred - would require SSE or WebSocket
        console.warn('HttpRpcServer: push() is not implemented (deferred)')
    }

    private normalizeEvent(event: string): string {
        return event.replace(/\/+/g, '/').replace(/^\/|\/$/g, '')
    }

    private getClientId(c: Context): string {
        return c.req.header('x-rpc-client-id') || 'anonymous'
    }
}