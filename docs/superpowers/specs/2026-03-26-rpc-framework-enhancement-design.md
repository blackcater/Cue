# RPC 框架增强设计

## 1. 概述

本文档描述 `desktop/src/shared/rpc` 模块的增强功能，包括：

1. **WindowRegistry 接口**：替代 `WebContentsManager`，由应用层提供，实现窗口消息发送
2. **HTTP SSE 支持**：`HttpRpcServer` 和 `HttpRpcClient` 支持 SSE 推送和流式调用
3. **Schema 数据校验**：使用 `@standard-schema/spec` 对 handler 参数进行校验
4. **超时机制**：客户端支持 `AbortController`/`AbortSignal` 控制超时和取消

## 2. WindowRegistry 接口

### 2.1 设计背景

原设计使用 `WebContentsManager` 接口，但存在以下问题：
- `getWebContents` 方法未被使用
- `send` 方法职责不清晰（需根据 target 类型判断如何发送）

### 2.2 接口定义

```typescript
export interface WindowRegistry {
  sendToClient(clientId: string, channel: string, ...args: unknown[]): void
  sendToGroup(groupId: string, channel: string, ...args: unknown[]): void
  sendToAll(channel: string, ...args: unknown[]): void
}
```

**职责划分**：
- `sendToClient`：向指定 clientId 的窗口发送消息
- `sendToGroup`：向指定群组的所有窗口发送消息
- `sendToAll`：向所有窗口广播消息

### 2.3 ElectronRpcServer 改造

```typescript
export class ElectronRpcServer implements RpcServer {
  constructor(
    private readonly _registry: WindowRegistry,
    private readonly _ipcMain: IpcMain
  ) {}

  push(event: string, target: Rpc.Target, ...args: unknown[]): void {
    const channel = `rpc:event:${this._normalizeEvent(event)}`

    if (target.type === 'broadcast') {
      this._registry.sendToAll(channel, ...args)
    } else if (target.type === 'client' && target.clientId) {
      this._registry.sendToClient(target.clientId, channel, ...args)
    } else if (target.type === 'group' && target.groupId) {
      this._registry.sendToGroup(target.groupId, channel, ...args)
    }
  }
}
```

## 3. HTTP SSE 支持

### 3.1 背景

原 `HttpRpcServer.push()` 和 `HttpRpcClient.stream()`/`onEvent()` 均未实现。HTTP 协议本身不支持服务端推送，需要借助 SSE（Server-Sent Events）实现。

### 3.2 服务端实现（HttpRpcServer）

#### SSE 端点

```typescript
private _sseClients = new Map<string, Set<ReadableStreamController>>()

private _setupSSERoutes() {
  // GET /rpc/events - SSE 事件流
  this.app.get('/rpc/events', async (c: Context) => {
    const clientId = this._getClientId(c)

    return c.streamSSE(async (stream) => {
      const controller = { stream, clientId }
      this._addSSEClient(clientId, controller)

      stream.writeSSE({ event: 'connected', data: JSON.stringify({ clientId }) })

      stream.onAbort(() => {
        this._removeSSEClient(clientId)
      })
    })
  })
}
```

#### push() 实现

```typescript
push(event: string, target: Rpc.Target, ...args: unknown[]): void {
  const eventData = JSON.stringify({ event, args })

  if (target.type === 'broadcast') {
    this._broadcastSSE('push', eventData)
  } else if (target.type === 'client' && target.clientId) {
    this._sendSSEToClient(target.clientId, 'push', eventData)
  } else if (target.type === 'group' && target.groupId) {
    this._sendSSEToGroup(target.groupId, 'push', eventData)
  }
}
```

### 3.3 客户端实现（HttpRpcClient）

#### stream() - SSE 流式调用

```typescript
async *stream<T>(event: string, ...args: unknown[]): AsyncIterable<T> {
  const response = await fetch(
    `${this._baseUrl}/rpc/${event.replace(/^\/|\/$/g, '')}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rpc-client-id': this.clientId,
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(args),
      signal: this._signal,
    }
  )

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()!

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          yield JSON.parse(line.slice(6)) as T
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
```

#### onEvent() - SSE 事件订阅

```typescript
private _eventSource: EventSource | null = null
private _eventListeners = new Map<string, Set<(...args: unknown[]) => void>>()

onEvent(event: string, listener: (...args: unknown[]) => void): CancelFn {
  if (!this._eventSource) {
    this._eventSource = new EventSource(`${this._baseUrl}/rpc/events`)

    this._eventSource.addEventListener('push', (e: MessageEvent) => {
      const { event: eventName, args } = JSON.parse(e.data)
      const listeners = this._eventListeners.get(eventName)
      if (listeners) {
        for (const l of listeners) {
          l(...args)
        }
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
  }
}
```

## 4. Schema 数据校验

### 4.1 背景

原 `HandleOptions` 已引用 `@standard-schema/spec`，但未实现具体校验逻辑。

### 4.2 实现

```typescript
import type { StandardSchemaV1 } from '@standard-schema/spec'

export interface HandleOptions {
  schema?: StandardSchemaV1
}

// HttpRpcServer 中的调用校验
private async _handleRPC(path: string, args: unknown[], ctx: Rpc.RequestContext) {
  const handler = this._handlers.get(path)

  if (!handler) {
    throw new RpcError('NOT_FOUND', `Handler not found: ${path}`)
  }

  // Schema 校验
  if (handler.options?.schema) {
    const validated = handler.options.schema.parse(args)
    return handler.handler(ctx, ...validated)
  }

  return handler.handler(ctx, ...args)
}
```

### 4.3 使用示例

```typescript
import { z } from 'zod'
import { StandardSchemaV1 } from '@standard-schema/spec'

// Zod schema 转 StandardSchemaV1
const createConversationSchema: StandardSchemaV1 = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    title: { type: 'string' },
    mode: { type: 'string', enum: ['chat', 'agent'] },
  },
  required: ['title'],
  additionalProperties: false,
}

server.handle('conversation/create', { schema: createConversationSchema }, async (ctx, ...args) => {
  // args 已通过 schema 校验
  const { title, mode } = args[0]
  // ...
})
```

## 5. 超时机制

### 5.1 背景

原 `ElectronRpcClient.call()` 有 30 秒硬编码超时，无法自定义。`HttpRpcClient` 无超时机制。

### 5.2 AbortController 模式

```typescript
export interface RpcCallOptions {
  signal?: AbortSignal
}

export interface RpcClient {
  call<T>(event: string, options?: RpcCallOptions, ...args: unknown[]): Promise<T>
  stream<T>(event: string, options?: RpcCallOptions, ...args: unknown[]): Rpc.StreamResult<T>
}
```

### 5.3 ElectronRpcClient 实现

```typescript
async call<T>(
  event: string,
  options: RpcCallOptions = {},
  ...args: unknown[]
): Promise<T> {
  const { signal } = options
  const invokeId = `invoke-${++this._invokeCounter}`
  const eventPath = event.replaceAll(/^\/|\/$/g, '')

  return new Promise((resolve, reject) => {
    // AbortSignal 处理
    if (signal?.aborted) {
      reject(new RpcError('ABORTED', 'Request was aborted'))
      return
    }

    const rejectWithTimeout = () => {
      reject(new RpcError('TIMEOUT', `RPC call ${event} timed out`))
    }

    let timeoutId: NodeJS.Timeout | undefined
    if (signal?.timeout) {
      timeoutId = setTimeout(rejectWithTimeout, signal.timeout)
    }

    const abortHandler = () => {
      clearTimeout(timeoutId)
      this._pendingCalls.delete(invokeId)
      reject(new RpcError('ABORTED', 'Request was aborted'))
    }

    signal?.addEventListener('abort', abortHandler)

    this._pendingCalls.set(invokeId, {
      resolve: (...args) => {
        clearTimeout(timeoutId)
        signal?.removeEventListener('abort', abortHandler)
        resolve(args[0] as T)
      },
      reject: (...args) => {
        clearTimeout(timeoutId)
        signal?.removeEventListener('abort', abortHandler)
        reject(args[0])
      },
    })

    this._webContents.send(`rpc:invoke:${eventPath}`, { invokeId, args })
  })
}
```

### 5.4 使用示例

```typescript
// 超时控制
const controller = new AbortController()
setTimeout(() => controller.abort(), 5000)

try {
  const result = await client.call('event', { signal: controller.signal }, ...args)
} catch (err) {
  if (err instanceof RpcError && err.code === 'TIMEOUT') {
    // 处理超时
  }
}

// 手动取消
const controller = new AbortController()
const result = await client.call('event', { signal: controller.signal }, ...args)
controller.abort() // 取消进行中的请求
```

## 6. 目录结构

```
apps/desktop/src/shared/rpc/
├── types.ts           # 新增 WindowRegistry、RpcCallOptions
├── RpcError.ts
├── utils.ts
├── electron/
│   ├── ElectronRpcServer.ts   # 改造：使用 WindowRegistry
│   ├── ElectronRpcClient.ts   # 新增 AbortSignal 支持
│   └── index.ts
├── http/
│   ├── HttpRpcServer.ts       # 新增 SSE push + schema 校验
│   ├── HttpRpcClient.ts       # 新增 SSE stream + onEvent + AbortSignal
│   └── index.ts
└── index.ts
```

## 7. 依赖变更

```diff
# packages/desktop/package.json
+ "@standard-schema/spec": "^1.0.0"
```

## 8. 向后兼容性

- `RpcClient.call()` 的 `options` 参数是可选的，不传则使用默认行为（30 秒超时，无取消信号）
- `RpcServer.handle()` 的 `schema` 属性是可选的，不提供则跳过校验
- `WindowRegistry` 是新增接口，原 `WebContentsManager` 接口废弃
