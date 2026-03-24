import { createServer as createHttpServer, IncomingMessage, ServerResponse } from 'http'
import { RpcServer } from '../RpcServer'
import { RpcClient } from '../RpcClient'
import { RpcError } from '../RpcError'
import type { Target, RpcRequest, RpcResponse } from '../types'

interface ServerOptions {
  port: number
  hostname?: string
}

type Handler = (args: unknown) => unknown | AsyncIterator

export class HttpRpcServer extends RpcServer {
  private handlers = new Map<string, Handler>()
  private clients = new Set<HttpRpcClientConnection>()
  private eventListeners = new Set<(client: RpcClient, event: string, ...args: unknown[]) => void>()
  private server: ReturnType<typeof createHttpServer> | null = null

  constructor(private options: ServerOptions) {
    super()
  }

  async start(): Promise<void> {
    this.server = createHttpServer(this.handleRequest.bind(this))
    await new Promise<void>((resolve) => {
      this.server!.listen(this.options.port, this.options.hostname, resolve)
    })
  }

  handle(event: string, handler: Handler): void {
    this.handlers.set(event, handler)
  }

  push(event: string, target: Target, ...args: unknown[]): void {
    const message = JSON.stringify({ event, args })

    if (target.type === 'broadcast') {
      this.clients.forEach((client) => {
        client.sendEvent(message)
      })
    } else if (target.type === 'group') {
      this.clients.forEach((client) => {
        if (client.groupId === target.groupId) {
          client.sendEvent(message)
        }
      })
    }
  }

  onEvent(listener: (client: RpcClient, event: string, ...args: unknown[]) => void): void {
    this.eventListeners.add(listener)
  }

  [Symbol.dispose](): void {
    this.server?.close()
  }

  private async handleRequest(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    const url = new URL(req.url, `http://${req.headers.host}`)

    if (req.method === 'POST' && url.pathname === '/rpc') {
      await this.handleRpcCall(req, res)
    } else if (req.method === 'GET' && url.pathname === '/rpc/events') {
      await this.handleSSE(req, res)
    } else {
      res.writeHead(404)
      res.end()
    }
  }

  private async handleRpcCall(req: IncomingMessage, res: ServerResponse): Promise<void> {
    let body = ''
    for await (const chunk of req) {
      body += chunk
    }

    let request: RpcRequest
    try {
      request = JSON.parse(body)
    } catch {
      res.writeHead(400)
      res.end(JSON.stringify({ error: { code: 'INVALID_REQUEST', message: 'Invalid JSON' } }))
      return
    }

    const handler = this.handlers.get(request.method)
    if (!handler) {
      const response: RpcResponse = {
        id: request.id,
        error: { code: 'NOT_FOUND', message: `Method ${request.method} not found` },
      }
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(response))
      return
    }

    try {
      const result = await handler(request.args)

      if (result && typeof result === 'object' && Symbol.asyncIterator in result) {
        // Streaming response via SSE
        res.writeHead(200)
        const iterator = result as AsyncIterator<unknown>
        for await (const chunk of iterator) {
          res.write(`data: ${JSON.stringify({ id: request.id, chunk, done: false })}\n\n`)
        }
        res.write(`data: ${JSON.stringify({ id: request.id, chunk: null, done: true })}\n\n`)
        res.end()
      } else {
        const response: RpcResponse = { id: request.id, result }
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(response))
      }
    } catch (err) {
      const error = RpcError.from(err)
      const response: RpcResponse = { id: request.id, error: error.toJSON() }
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(response))
    }
  }

  private async handleSSE(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const groupId = new URL(req.url, `http://${req.headers.host}`).searchParams.get('groupId')

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    })

    const connection: HttpRpcClientConnection = {
      groupId: groupId || 'default',
      sendEvent: (data) => {
        res.write(`data: ${data}\n\n`)
      },
    }

    this.clients.add(connection)

    req.on('close', () => {
      this.clients.delete(connection)
    })
  }
}

interface HttpRpcClientConnection {
  groupId: string
  sendEvent: (data: string) => void
}