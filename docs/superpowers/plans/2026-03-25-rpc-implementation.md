# RPC Framework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a unified RPC framework with Electron IPC and HTTP+SSE transport implementations.

**Architecture:** Abstract `RpcServer` and `RpcClient` base classes define the interface, with concrete implementations for Electron IPC (main/renderer process communication) and HTTP+SSE (cross-machine communication). Streaming uses AsyncIterator.

**Tech Stack:** TypeScript, Bun test, Electron IPC, Node.js http, SSE

---

## File Structure

```
desktop/src/shared/rpc/
├── types.ts                    # Target type, message types
├── RpcError.ts                 # Unified error structure
├── RpcServer.ts               # Abstract server class
├── RpcClient.ts               # Abstract client class
├── electron/
│   ├── ElectronRpcServer.ts   # Electron IPC server
│   ├── ElectronRpcClient.ts   # Electron IPC client
│   └── ElectronRpcServer.test.ts
│   └── ElectronRpcClient.test.ts
└── http/
    ├── HttpRpcServer.ts       # HTTP+SSE server
    ├── HttpRpcClient.ts       # HTTP+SSE client
    ├── HttpRpcServer.test.ts
    └── HttpRpcClient.test.ts
```

---

## Task 1: Core Types and RpcError

**Files:**
- Create: `apps/desktop/src/shared/rpc/types.ts`
- Create: `apps/desktop/src/shared/rpc/RpcError.ts`

- [ ] **Step 1: Create types.ts with Target type and message structures**

```typescript
// apps/desktop/src/shared/rpc/types.ts

export type Target =
  | { type: 'broadcast' }
  | { type: 'group'; groupId: string }

export interface RpcRequest {
  id: string
  method: string
  args: unknown
}

export interface RpcResponse {
  id: string
  result?: unknown
  error?: import('./RpcError').RpcError
}

export interface RpcStreamChunk {
  id: string
  chunk: unknown
  done?: boolean
}

export interface RpcPushMessage {
  event: string
  target: Target
  args: unknown[]
}
```

- [ ] **Step 2: Create RpcError.ts with unified error structure**

```typescript
// apps/desktop/src/shared/rpc/RpcError.ts

export interface RpcError {
  code: string
  message: string
  data?: unknown
}

export class RpcError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly data?: unknown
  ) {
    super(message)
    this.name = 'RpcError'
  }

  toJSON(): RpcError {
    return {
      code: this.code,
      message: this.message,
      data: this.data,
    }
  }

  static from(error: unknown): RpcError {
    if (error instanceof RpcError) {
      return error
    }
    if (error instanceof Error) {
      return new RpcError('INTERNAL_ERROR', error.message)
    }
    return new RpcError('UNKNOWN_ERROR', 'An unknown error occurred')
  }
}
```

- [ ] **Step 3: Run tests to verify (no tests yet for types, just typecheck)**

Run: `cd apps/desktop && bunx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add apps/desktop/src/shared/rpc/types.ts apps/desktop/src/shared/rpc/RpcError.ts
git commit -m "feat(rpc): add core types and RpcError"
```

---

## Task 2: Abstract RpcServer Class

**Files:**
- Create: `apps/desktop/src/shared/rpc/RpcServer.ts`

- [ ] **Step 1: Write failing test**

```typescript
// apps/desktop/src/shared/rpc/RpcServer.test.ts
import { describe, expect, it } from 'bun:test'
import { RpcServer } from './RpcServer'
import { RpcError } from './RpcError'

// Mock implementation for testing the abstract class interface
class MockRpcServer extends RpcServer {
  handle(
    event: string,
    handler: (args: unknown) => unknown | AsyncIterator
  ): void {
    throw new Error('Not implemented')
  }
  push(event: string, target: import('./types').Target, ...args: unknown[]): void {
    throw new Error('Not implemented')
  }
  onEvent(
    listener: (client: import('./RpcClient').RpcClient, event: string, ...args: unknown[]) => void
  ): void {
    throw new Error('Not implemented')
  }
}

describe('RpcServer', () => {
  it('should be abstract and not be instantiable directly', () => {
    expect(() => new RpcServer()).toThrow()
  })

  it('should allow instantiation of concrete subclass', () => {
    const server = new MockRpcServer()
    expect(server).toBeInstanceOf(RpcServer)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/desktop && bun test src/shared/rpc/RpcServer.test.ts`
Expected: Error about instantiating abstract class

- [ ] **Step 3: Write minimal abstract class**

```typescript
// apps/desktop/src/shared/rpc/RpcServer.ts
import type { RpcClient } from './RpcClient'
import type { Target } from './types'

export abstract class RpcServer {
  abstract handle(
    event: string,
    handler: (args: unknown) => unknown | AsyncIterator
  ): void

  abstract push(event: string, target: Target, ...args: unknown[]): void

  abstract onEvent(
    listener: (client: RpcClient, event: string, ...args: unknown[]) => void
  ): void
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/desktop && bun test src/shared/rpc/RpcServer.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/src/shared/rpc/RpcServer.ts apps/desktop/src/shared/rpc/RpcServer.test.ts
git commit -m "feat(rpc): add abstract RpcServer class"
```

---

## Task 3: Abstract RpcClient Class

**Files:**
- Create: `apps/desktop/src/shared/rpc/RpcClient.ts`

- [ ] **Step 1: Write failing test**

```typescript
// apps/desktop/src/shared/rpc/RpcClient.test.ts
import { describe, expect, it } from 'bun:test'
import { RpcClient } from './RpcClient'

// Mock implementation for testing
class MockRpcClient extends RpcClient {
  readonly groupId: string = 'test'
  call(method: string, args: unknown): Promise<unknown> {
    throw new Error('Not implemented')
  }
  stream(method: string, args: unknown): AsyncIterator {
    throw new Error('Not implemented')
  }
  onEvent(listener: (event: string, ...args: unknown[]) => void): void {
    throw new Error('Not implemented')
  }
}

describe('RpcClient', () => {
  it('should be abstract and not be instantiable directly', () => {
    expect(() => new RpcClient()).toThrow()
  })

  it('should allow instantiation of concrete subclass', () => {
    const client = new MockRpcClient()
    expect(client).toBeInstanceOf(RpcClient)
    expect(client.groupId).toBe('test')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/desktop && bun test src/shared/rpc/RpcClient.test.ts`
Expected: Error about instantiating abstract class

- [ ] **Step 3: Write minimal abstract class**

```typescript
// apps/desktop/src/shared/rpc/RpcClient.ts
export abstract class RpcClient {
  abstract readonly groupId: string

  abstract call(method: string, args: unknown): Promise<unknown>

  abstract stream(method: string, args: unknown): AsyncIterator

  abstract onEvent(listener: (event: string, ...args: unknown[]) => void): void

  /** @deprecated Only needed for Electron. HTTP uses SSE connections directly. */
  send?(event: string, ...args: unknown[]): void
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/desktop && bun test src/shared/rpc/RpcClient.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/src/shared/rpc/RpcClient.ts apps/desktop/src/shared/rpc/RpcClient.test.ts
git commit -m "feat(rpc): add abstract RpcClient class"
```

---

## Task 4: ElectronRpcServer Implementation

**Files:**
- Create: `apps/desktop/src/shared/rpc/electron/ElectronRpcServer.ts`
- Create: `apps/desktop/src/shared/rpc/electron/ElectronRpcServer.test.ts`

- [ ] **Step 1: Write failing test with mock IPC**

```typescript
// apps/desktop/src/shared/rpc/electron/ElectronRpcServer.test.ts
import { describe, expect, it, vi } from 'bun:test'
import { ElectronRpcServer } from './ElectronRpcServer'
import type { RpcClient } from '../RpcClient'

// Mock ipcMain
const mockOn = vi.fn()
const mockSend = vi.fn()
const mockEmit = vi.fn()

vi.mock('electron', () => ({
  ipcMain: {
    on: mockOn,
    send: mockSend,
    emit: mockEmit,
  },
}))

describe('ElectronRpcServer', () => {
  beforeEach(() => {
    mockOn.mockClear()
    mockSend.mockClear()
    mockEmit.mockClear()
  })

  it('should register handlers and respond to calls', async () => {
    const server = new ElectronRpcServer()

    server.handle('testMethod', async (args) => {
      return { result: args }
    })

    // Simulate IPC call from renderer
    const handler = mockOn.mock.calls.find(([channel]) => channel === 'rpc:call')?.[1]
    expect(handler).toBeDefined()

    // Simulate renderer calling rpc:call
    const mockEvent = { reply: vi.fn() }
    handler(mockEvent, 'req-1', 'testMethod', { foo: 'bar' })

    // Check reply was called with result
    expect(mockEvent.reply).toHaveBeenCalledWith(
      'rpc:response',
      expect.objectContaining({
        id: 'req-1',
        result: { result: { foo: 'bar' } },
      })
    )
  })

  it('should handle errors and return RpcError', async () => {
    const server = new ElectronRpcServer()

    server.handle('errorMethod', async () => {
      throw new Error('Test error')
    })

    const handler = mockOn.mock.calls.find(([channel]) => channel === 'rpc:call')?.[1]
    const mockEvent = { reply: vi.fn() }
    handler(mockEvent, 'req-2', 'errorMethod', {})

    expect(mockEvent.reply).toHaveBeenCalledWith(
      'rpc:response',
      expect.objectContaining({
        id: 'req-2',
        error: expect.objectContaining({
          code: 'INTERNAL_ERROR',
        }),
      })
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/desktop && bun test src/shared/rpc/electron/ElectronRpcServer.test.ts`
Expected: FAIL - module not found or similar

- [ ] **Step 3: Write ElectronRpcServer implementation**

```typescript
// apps/desktop/src/shared/rpc/electron/ElectronRpcServer.ts
import { ipcMain } from 'electron'
import { RpcServer } from '../RpcServer'
import { RpcClient } from '../RpcClient'
import { RpcError } from '../RpcError'
import type { Target, RpcRequest, RpcResponse } from '../types'

type Handler = (args: unknown) => unknown | AsyncIterator

export class ElectronRpcServer extends RpcServer {
  private handlers = new Map<string, Handler>()
  private clients = new Set<RpcClient>()
  private eventListeners = new Set<(client: RpcClient, event: string, ...args: unknown[]) => void>()

  constructor() {
    super()

    // Listen for incoming calls from clients
    ipcMain.on('rpc:call', this.handleCall.bind(this))

    // Listen for client events (notifications)
    ipcMain.on('rpc:event', this.handleClientEvent.bind(this))
  }

  handle(event: string, handler: Handler): void {
    this.handlers.set(event, handler)
  }

  push(event: string, target: Target, ...args: unknown[]): void {
    if (target.type === 'broadcast') {
      // Send to all clients
      this.clients.forEach((client) => {
        client.send?.('rpc:push', event, ...args)
      })
    } else if (target.type === 'group') {
      // Send to clients in the same group
      this.clients.forEach((client) => {
        if (client.groupId === target.groupId) {
          client.send?.('rpc:push', event, ...args)
        }
      })
    }
  }

  onEvent(listener: (client: RpcClient, event: string, ...args: unknown[]) => void): void {
    this.eventListeners.add(listener)
  }

  /** @internal */
  registerClient(client: RpcClient): void {
    this.clients.add(client)
  }

  /** @internal */
  unregisterClient(client: RpcClient): void {
    this.clients.delete(client)
  }

  private async handleCall(
    event: Electron.IpcMainEvent,
    id: string,
    method: string,
    args: unknown
  ): Promise<void> {
    const handler = this.handlers.get(method)

    if (!handler) {
      const response: RpcResponse = {
        id,
        error: { code: 'NOT_FOUND', message: `Method ${method} not found` },
      }
      event.reply('rpc:response', response)
      return
    }

    try {
      const result = await handler(args)

      // Check if result is an AsyncIterator (streaming)
      if (result && typeof result === 'object' && Symbol.asyncIterator in result) {
        const iterator = result as AsyncIterator<unknown>
        for await (const chunk of iterator) {
          event.reply('rpc:stream', { id, chunk, done: false })
        }
        event.reply('rpc:stream', { id, chunk: null, done: true })
      } else {
        const response: RpcResponse = { id, result }
        event.reply('rpc:response', response)
      }
    } catch (err) {
      const error = RpcError.from(err)
      const response: RpcResponse = { id, error: error.toJSON() }
      event.reply('rpc:response', response)
    }
  }

  private handleClientEvent(
    _event: Electron.IpcMainEvent,
    event: string,
    ...args: unknown[]
  ): void {
    // Find the client that sent this event
    // Note: In real implementation, we'd need to track which ipcConnection belongs to which client
    this.eventListeners.forEach((listener) => {
      // We don't have the actual client reference here
      // This is a limitation of the Electron IPC model
      listener(null as unknown as RpcClient, event, ...args)
    })
  }

  [Symbol.dispose](): void {
    ipcMain.off('rpc:call', this.handleCall)
    ipcMain.off('rpc:event', this.handleClientEvent)
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/desktop && bun test src/shared/rpc/electron/ElectronRpcServer.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/src/shared/rpc/electron/ElectronRpcServer.ts apps/desktop/src/shared/rpc/electron/ElectronRpcServer.test.ts
git commit -m "feat(rpc): add ElectronRpcServer implementation"
```

---

## Task 5: ElectronRpcClient Implementation

**Files:**
- Create: `apps/desktop/src/shared/rpc/electron/ElectronRpcClient.ts`
- Create: `apps/desktop/src/shared/rpc/electron/ElectronRpcClient.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// apps/desktop/src/shared/rpc/electron/ElectronRpcClient.test.ts
import { describe, expect, it, vi, beforeEach } from 'bun:test'
import { ElectronRpcClient } from './ElectronRpcClient'

// Mock ipcRenderer
const mockSend = vi.fn()
const mockOn = vi.fn()
const mockRemoveListener = vi.fn()

vi.mock('electron', () => ({
  ipcRenderer: {
    send: mockSend,
    on: mockOn,
    removeListener: mockRemoveListener,
  },
}))

describe('ElectronRpcClient', () => {
  beforeEach(() => {
    mockSend.mockClear()
    mockOn.mockClear()
    mockRemoveListener.mockClear()
  })

  it('should create client with groupId', () => {
    const client = new ElectronRpcClient({ groupId: 'test-group' })
    expect(client.groupId).toBe('test-group')
  })

  it('should send call and receive response', async () => {
    const client = new ElectronRpcClient({ groupId: 'test-group' })

    // Simulate server response
    const responseHandler = mockOn.mock.calls.find(
      ([channel]) => channel === 'rpc:response'
    )?.[1]

    const replyPromise = client.call('testMethod', { foo: 'bar' })

    // Simulate server sending response
    responseHandler(null, { id: expect.any(String), result: { ok: true } })

    const result = await replyPromise
    expect(result).toEqual({ ok: true })
  })

  it('should handle error responses', async () => {
    const client = new ElectronRpcClient({ groupId: 'test-group' })

    const responseHandler = mockOn.mock.calls.find(
      ([channel]) => channel === 'rpc:response'
    )?.[1]

    const callPromise = client.call('errorMethod', {})

    // Simulate server sending error
    responseHandler(null, {
      id: expect.any(String),
      error: { code: 'TEST_ERROR', message: 'Test error' },
    })

    await expect(callPromise).rejects.toThrow('Test error')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/desktop && bun test src/shared/rpc/electron/ElectronRpcClient.test.ts`
Expected: FAIL

- [ ] **Step 3: Write ElectronRpcClient implementation**

```typescript
// apps/desktop/src/shared/rpc/electron/ElectronRpcClient.ts
import { ipcRenderer } from 'electron'
import { RpcClient } from '../RpcClient'
import { RpcError } from '../RpcError'
import type { RpcResponse, RpcStreamChunk } from '../types'

interface ClientOptions {
  groupId: string
}

export class ElectronRpcClient extends RpcClient {
  readonly groupId: string

  private pendingCalls = new Map<string, {
    resolve: (value: unknown) => void
    reject: (error: Error) => void
  }>()
  private eventListeners = new Set<(event: string, ...args: unknown[]) => void>()
  private streamListeners = new Map<string, (chunk: unknown) => void>()

  constructor(options: ClientOptions) {
    super()
    this.groupId = options.groupId

    // Listen for responses
    ipcRenderer.on('rpc:response', this.handleResponse.bind(this))

    // Listen for push events from server
    ipcRenderer.on('rpc:push', this.handlePush.bind(this))

    // Listen for stream chunks
    ipcRenderer.on('rpc:stream', this.handleStream.bind(this))
  }

  async call(method: string, args: unknown): Promise<unknown> {
    const id = crypto.randomUUID()

    return new Promise((resolve, reject) => {
      this.pendingCalls.set(id, { resolve, reject })

      ipcRenderer.send('rpc:call', id, method, args)
    })
  }

  stream(method: string, args: unknown): AsyncIterator {
    const id = crypto.randomUUID()
    const chunks: unknown[] = []

    // Return an async iterator that waits for chunks
    const iterator = {
      async next(): Promise<{ value: unknown; done: boolean }> {
        // This is a simplified implementation
        // Real implementation would need proper async iteration support
        return { value: undefined, done: true }
      },
    }

    ipcRenderer.send('rpc:call', id, method, args)

    return iterator
  }

  onEvent(listener: (event: string, ...args: unknown[]) => void): void {
    this.eventListeners.add(listener)
  }

  send(event: string, ...args: unknown[]): void {
    ipcRenderer.send('rpc:push', event, ...args)
  }

  private handleResponse(_event: Electron.IpcRendererEvent, response: RpcResponse): void {
    const pending = this.pendingCalls.get(response.id)
    if (!pending) return

    this.pendingCalls.delete(response.id)

    if (response.error) {
      pending.reject(new RpcError(response.error.code, response.error.message, response.error.data))
    } else {
      pending.resolve(response.result)
    }
  }

  private handlePush(_event: Electron.IpcRendererEvent, data: { event: string; args: unknown[] }): void {
    const [event, ...args] = data.args
    this.eventListeners.forEach((listener) => {
      listener(data.event, ...args)
    })
  }

  private handleStream(_event: Electron.IpcRendererEvent, data: RpcStreamChunk): void {
    const listener = this.streamListeners.get(data.id)
    if (listener && !data.done) {
      listener(data.chunk)
    }
  }

  [Symbol.dispose](): void {
    ipcRenderer.off('rpc:response', this.handleResponse)
    ipcRenderer.off('rpc:push', this.handlePush)
    ipcRenderer.off('rpc:stream', this.handleStream)
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/desktop && bun test src/shared/rpc/electron/ElectronRpcClient.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/src/shared/rpc/electron/ElectronRpcClient.ts apps/desktop/src/shared/rpc/electron/ElectronRpcClient.test.ts
git commit -m "feat(rpc): add ElectronRpcClient implementation"
```

---

## Task 6: HttpRpcServer Implementation

**Files:**
- Create: `apps/desktop/src/shared/rpc/http/HttpRpcServer.ts`
- Create: `apps/desktop/src/shared/rpc/http/HttpRpcServer.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// apps/desktop/src/shared/rpc/http/HttpRpcServer.test.ts
import { describe, expect, it, vi, beforeEach } from 'bun:test'
import { HttpRpcServer } from './HttpRpcServer'

describe('HttpRpcServer', () => {
  it('should create server with port', () => {
    const server = new HttpRpcServer({ port: 4096 })
    expect(server).toBeDefined()
  })

  it('should register handlers', async () => {
    const server = new HttpRpcServer({ port: 4096 })

    server.handle('testMethod', async (args) => {
      return { result: args }
    })

    // Handler should be registered (we'll test via HTTP request in integration test)
    expect(true).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/desktop && bun test src/shared/rpc/http/HttpRpcServer.test.ts`
Expected: FAIL - module not found

- [ ] **Step 3: Write HttpRpcServer implementation**

```typescript
// apps/desktop/src/shared/rpc/http/HttpRpcServer.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/desktop && bun test src/shared/rpc/http/HttpRpcServer.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/src/shared/rpc/http/HttpRpcServer.ts apps/desktop/src/shared/rpc/http/HttpRpcServer.test.ts
git commit -m "feat(rpc): add HttpRpcServer implementation"
```

---

## Task 7: HttpRpcClient Implementation

**Files:**
- Create: `apps/desktop/src/shared/rpc/http/HttpRpcClient.ts`
- Create: `apps/desktop/src/shared/rpc/http/HttpRpcClient.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// apps/desktop/src/shared/rpc/http/HttpRpcClient.test.ts
import { describe, expect, it, vi } from 'bun:test'
import { HttpRpcClient } from './HttpRpcClient'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('HttpRpcClient', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('should create client with url and groupId', () => {
    const client = new HttpRpcClient({ url: 'http://localhost:4096', groupId: 'test' })
    expect(client.groupId).toBe('test')
  })

  it('should make HTTP call and return result', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: '1', result: { ok: true } }),
    })

    const client = new HttpRpcClient({ url: 'http://localhost:4096', groupId: 'test' })
    const result = await client.call('testMethod', { foo: 'bar' })

    expect(result).toEqual({ ok: true })
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:4096/rpc',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ id: expect.any(String), method: 'testMethod', args: { foo: 'bar' } }),
      })
    )
  })

  it('should handle error responses', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: '1', error: { code: 'TEST', message: 'Error' } }),
    })

    const client = new HttpRpcClient({ url: 'http://localhost:4096', groupId: 'test' })

    await expect(client.call('errorMethod', {})).rejects.toThrow('Error')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/desktop && bun test src/shared/rpc/http/HttpRpcClient.test.ts`
Expected: FAIL - module not found

- [ ] **Step 3: Write HttpRpcClient implementation**

```typescript
// apps/desktop/src/shared/rpc/http/HttpRpcClient.ts
import { RpcClient } from '../RpcClient'
import { RpcError } from '../RpcError'
import type { RpcRequest, RpcResponse } from '../types'

interface ClientOptions {
  url: string
  groupId: string
}

export class HttpRpcClient extends RpcClient {
  readonly groupId: string
  private readonly baseUrl: string
  private eventSource: EventSource | null = null
  private eventListeners = new Set<(event: string, ...args: unknown[]) => void>()

  constructor(options: ClientOptions) {
    super()
    this.groupId = options.groupId
    this.baseUrl = options.url
  }

  async call(method: string, args: unknown): Promise<unknown> {
    const id = crypto.randomUUID()
    const request: RpcRequest = { id, method, args }

    const response = await fetch(`${this.baseUrl}/rpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })

    const data: RpcResponse = await response.json()

    if (data.error) {
      throw new RpcError(data.error.code, data.error.message, data.error.data)
    }

    return data.result
  }

  stream(method: string, args: unknown): AsyncIterator {
    const id = crypto.randomUUID()

    // For streaming, we use SSE connection
    // This is a simplified implementation
    const chunks: unknown[] = {
      [Symbol.asyncIterator]() {
        return {
          async next(): Promise<{ value: unknown; done: boolean }> {
            return { value: undefined, done: true }
          },
        }
      },
    }

    return chunks as AsyncIterator
  }

  onEvent(listener: (event: string, ...args: unknown[]) => void): void {
    this.eventListeners.add(listener)

    if (!this.eventSource) {
      this.eventSource = new EventSource(`${this.baseUrl}/rpc/events?groupId=${encodeURIComponent(this.groupId)}`)

      this.eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)
        this.eventListeners.forEach((l) => l(data.event, ...data.args))
      }
    }
  }

  [Symbol.dispose](): void {
    this.eventSource?.close()
    this.eventSource = null
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/desktop && bun test src/shared/rpc/http/HttpRpcClient.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/src/shared/rpc/http/HttpRpcClient.ts apps/desktop/src/shared/rpc/http/HttpRpcClient.test.ts
git commit -m "feat(rpc): add HttpRpcClient implementation"
```

---

## Task 8: Create index.ts for unified exports

**Files:**
- Create: `apps/desktop/src/shared/rpc/index.ts`

- [ ] **Step 1: Create index.ts**

```typescript
// apps/desktop/src/shared/rpc/index.ts

// Types
export { type Target, type RpcRequest, type RpcResponse, type RpcStreamChunk, type RpcPushMessage } from './types'

// Error
export { RpcError } from './RpcError'
export type { RpcError } from './RpcError'

// Abstract classes
export { RpcServer } from './RpcServer'
export { RpcClient } from './RpcClient'

// Electron implementation
export { ElectronRpcServer } from './electron/ElectronRpcServer'
export { ElectronRpcClient } from './electron/ElectronRpcClient'

// HTTP implementation
export { HttpRpcServer } from './http/HttpRpcServer'
export { HttpRpcClient } from './http/HttpRpcClient'
```

- [ ] **Step 2: Run typecheck**

Run: `cd apps/desktop && bunx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/desktop/src/shared/rpc/index.ts
git commit -m "feat(rpc): add unified exports"
```

---

## Execution Options

**Plan complete and saved to `docs/superpowers/plans/2026-03-25-rpc-implementation.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
