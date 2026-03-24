# RPC Framework Design

## Overview

A unified RPC framework for desktop applications with two transport implementations:
- **Electron IPC** - For communication between main and renderer processes
- **HTTP + SSE** - For communication between processes on different machines

## Directory Structure

```
desktop/src/shared/rpc/
├── types.ts           # Core type definitions
├── RpcError.ts        # Unified error structure
├── RpcServer.ts       # Server class
├── RpcClient.ts       # Client class
├── transports/        # Transport implementations
│   ├── electron/      # Electron IPC transport
│   │   └── ElectronIpcTransport.ts
│   └── http/          # HTTP + SSE transport
│       ├── HttpRpcTransport.ts
│       └── sse.ts
└── index.ts          # Unified exports
```

## Core Interfaces

### RpcServer

```typescript
interface RpcServer {
  // Register event handler (supports sync and streaming responses)
  handle(event: string, handler: (args: unknown) => unknown | AsyncIterator): void

  // Push event to clients
  push(event: string, target: Target, ...args: unknown[]): void

  // Listen for client events
  onEvent(listener: (client: RpcClient, event: string, ...args: unknown[]) => void): void
}
```

### RpcClient

```typescript
interface RpcClient {
  readonly groupId: string

  // Request-response call
  call(method: string, args: unknown): Promise<unknown>

  // Streaming call (returns AsyncIterator)
  stream(method: string, args: unknown): AsyncIterator

  // Listen for server pushes
  onEvent(listener: (event: string, ...args: unknown[]) => void): void
}
```

### Target

```typescript
type Target =
  | { type: 'broadcast' }              // Push to all connected clients
  | { type: 'group'; groupId: string } // Push to clients in the same group
```

### RpcError

```typescript
interface RpcError {
  code: string      // Error code, e.g., 'NOT_FOUND', 'INTERNAL_ERROR'
  message: string    // Human-readable message
  data?: unknown     // Optional additional data
}
```

## Design Decisions

### 1. Unified Error Structure

Electron IPC does not automatically propagate errors across process boundaries. Therefore, the framework defines a unified `RpcError` structure that all transports must use to serialize and transmit errors back to the client.

### 2. Transport-Agnostic API

Users explicitly create transport instances and pass them to `RpcServer`/`RpcClient`:

```typescript
// Electron scenario
const ipcTransport = new ElectronIpcTransport()
const server = new RpcServer(ipcTransport)

// HTTP scenario
const httpTransport = new HttpRpcTransport('http://server/rpc')
const client = new RpcClient(httpTransport, { groupId: 'agents' })
```

### 3. Streaming with AsyncIterator

For streaming responses, server handlers return an `AsyncIterator`. This is the modern JavaScript standard for streaming and works well in both Node.js and browser environments.

Server:
```typescript
server.handle('streamOutput', async function* (args) {
  while (hasData) {
    yield { chunk: data }
    await delay(100)
  }
})
```

Client:
```typescript
for await (const chunk of client.stream('streamOutput', { taskId })) {
  console.log(chunk)
}
```

### 4. Separate HTTP and SSE

- **HTTP POST** - For request-response calls (`call`)
- **SSE (Server-Sent Events)** - For server-to-client pushes (`push`) and streaming responses (`stream`)
- **WebSocket** - Not used; SSE is sufficient for unidirectional streaming

### 5. Client Identity via groupId

Clients identify themselves by `groupId` during construction. This allows the server to route pushes to specific groups without requiring explicit window IDs.

```typescript
const client = new RpcClient(transport, { groupId: 'agents' })
```

### 6. Multi-Window Support

For Electron multi-window scenarios:
- **Broadcast** - `push(event, { type: 'broadcast' }, ...args)` notifies all windows
- **Group multicast** - `push(event, { type: 'group', groupId: 'agents' }, ...args)` notifies windows in the same group

## Implementation Details

### Electron Transport

- Uses Electron's built-in `ipcMain`/`ipcRenderer` for communication
- Main process acts as the message broker
- Windows communicate via the main process

### HTTP + SSE Transport

- HTTP POST endpoint `/rpc` for incoming calls
- SSE endpoint `/rpc/events` for server pushes and streaming responses
- Manual WebSocket connection management (user provides the connection)

## Testing Strategy (TDD)

1. Write interface tests first
2. Implement `ElectronRpcServer` and `ElectronRpcClient` with mock IPC
3. Implement `HttpRpcServer` and `HttpRpcClient` with mock HTTP/SSE
4. All tests run with `bun test`

## Usage Examples

### Electron Main Process

```typescript
const ipcTransport = new ElectronIpcTransport()
const server = new RpcServer(ipcTransport)

server.handle('getStatus', async () => {
  return { status: 'ok' }
})

server.handle('streamLogs', async function* (args) {
  for await (const log of logStream) {
    yield { log }
  }
})

server.onEvent((client, event, ...args) => {
  console.log('Client event:', event, args)
})
```

### Electron Renderer Process

```typescript
const ipcTransport = new ElectronIpcTransport()
const client = new RpcClient(ipcTransport, { groupId: 'renderer' })

const status = await client.call('getStatus', {})
console.log(status) // { status: 'ok' }

for await (const { log } of client.stream('streamLogs', {})) {
  console.log(log)
}

client.onEvent((event, ...args) => {
  console.log('Server push:', event, args)
})
```

### Cross-Machine HTTP Client

```typescript
const httpTransport = new HttpRpcTransport('http://192.168.1.100:4096')
const client = new RpcClient(httpTransport, { groupId: 'remote-agent' })

const result = await client.call('someMethod', { arg: 'value' })
```
