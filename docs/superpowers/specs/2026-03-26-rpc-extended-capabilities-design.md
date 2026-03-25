# RPC 框架扩展能力设计

## 1. 概述

本文档描述 RPC 框架的扩展能力设计，包括：

1. `ElectronWindowManager` 基类 - 多窗口 RPC 协调能力
2. HTTP SSE 支持 - 事件订阅与流式 RPC 响应
3. Schema 参数校验 - 使用 `StandardSchemaV1` 接口
4. 超时机制 - 客户端级别超时控制
5. 请求中断机制 - `AbortSignal` + 清理回调

## 2. 设计决策

| 功能 | 方案 |
|------|------|
| ElectronWindowManager | 多窗口协调器，维护 clientId → WebContents 映射，push 能力 |
| HTTP SSE | 直接在 `HttpRpcServer` 实现，支持事件订阅 + 流式 RPC |
| Schema 校验 | 仅请求参数校验，`StandardSchemaV1` 接口，中间件模式 |
| 超时机制 | 客户端级别配置，全局默认 + 请求级别覆盖 |
| 中断机制 | `AbortSignal` 凭证 + 清理回调 |
| 自动重连 | 暂不实现 |

## 3. 类型定义

### 3.1 新增类型

```typescript
// types.ts - 客户端选项
interface RpcClientOptions {
    timeout?: number    // 全局默认超时 (ms)，未设置则用内置默认值
}

interface RpcCallOptions {
    signal?: AbortSignal   // 中断凭证
    timeout?: number       // 本次请求超时，覆盖全局默认值
}
```

### 3.2 RpcClient 接口更新

```typescript
export interface RpcClient {
    readonly clientId: string
    readonly groupId?: string

    // call 支持 RpcCallOptions
    call<T>(event: string, options?: RpcCallOptions, ...args: unknown[]): Promise<T>

    // stream 支持 RpcCallOptions
    stream<T>(event: string, options?: RpcCallOptions, ...args: unknown[]): Rpc.StreamResult<T>

    // 事件监听
    onEvent(event: string, listener: (...args: unknown[]) => void): Rpc.CancelFn

    // 新增：中断清理回调
    onAbort(callback: () => void): void
}
```

### 3.3 RpcServer 接口保持不变

`RpcServer.push()` 接口保持不变，由具体实现类提供能力。

## 4. ElectronRpcClient 变更

### 4.1 构造函数新增选项

```typescript
export class ElectronRpcClient implements RpcClient {
    constructor(webContents: WebContents, options?: RpcClientOptions)
}
```

### 4.2 call 方法支持 signal + timeout

```typescript
async call<T>(
    event: string,
    options?: RpcCallOptions,
    ...args: unknown[]
): Promise<T> {
    const timeout = options?.timeout ?? this._defaultTimeout
    const signal = options?.signal

    // 使用 AbortController 实现超时
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    // 如果外部传入 signal，监听其中断
    signal?.addEventListener('abort', () => controller.abort())

    try {
        const result = await fetch(`${this._baseUrl}/rpc/${event}`, {
            method: 'POST',
            signal: controller.signal,
            body: JSON.stringify(args)
        })
        return result.json()
    } finally {
        clearTimeout(timeoutId)
    }
}
```

### 4.3 stream 方法支持 signal

```typescript
stream<T>(
    event: string,
    options?: RpcCallOptions,
    ...args: unknown[]
): Rpc.StreamResult<T> {
    const signal = options?.signal
    const controller = new AbortController()

    signal?.addEventListener('abort', () => controller.abort())

    // 返回异步迭代器
    return {
        [Symbol.asyncIterator]: () => this._createStreamIterator(event, args, controller),
        cancel: () => {
            controller.abort()
            this._runAbortCallbacks()
        }
    }
}
```

### 4.4 中断清理回调

```typescript
private readonly _abortCallbacks: Array<() => void> = []

onAbort(callback: () => void): void {
    this._abortCallbacks.push(callback)
}

private _runAbortCallbacks(): void {
    for (const cb of this._abortCallbacks) {
        cb()
    }
    this._abortCallbacks.clear()
}
```

## 5. ElectronWindowManager

### 5.1 WebContentsManager 接口

```typescript
export interface WebContentsManager {
    // 向指定 client 发送消息，'*' 表示广播
    send(clientId: string, channel: string, ...args: unknown[]): void

    // 获取指定 client 的 WebContents
    getWebContents(clientId: string): WebContents | null

    // 获取所有 client IDs
    getClientIds(): string[]

    // 获取指定 group 的所有 client IDs
    getClientsByGroup(groupId: string): string[]
}
```

### 5.2 ElectronWindowManager 实现

```typescript
export class ElectronWindowManager implements WebContentsManager {
    private readonly _clients = new Map<string, {
        webContents: WebContents
        groupId?: string
    }>()

    // 注册窗口，返回分配的 clientId
    registerWindow(webContents: WebContents, groupId?: string): string {
        const clientId = `client-${webContents.id}`
        this._clients.set(clientId, { webContents, groupId })

        // 监听窗口关闭，自动注销
        webContents.on('closed', () => {
            this._clients.delete(clientId)
        })

        return clientId
    }

    // 注销窗口
    unregisterWindow(webContents: WebContents): void {
        const clientId = `client-${webContents.id}`
        this._clients.delete(clientId)
    }

    send(clientId: string, channel: string, ...args: unknown[]): void {
        if (clientId === '*') {
            // 广播给所有窗口
            for (const { webContents } of this._clients.values()) {
                webContents.send(channel, ...args)
            }
        } else if (clientId.startsWith('group:')) {
            // 群组广播
            const groupId = clientId.replace('group:', '')
            for (const [id, { webContents, groupId: g }] of this._clients) {
                if (g === groupId) {
                    webContents.send(channel, ...args)
                }
            }
        } else {
            // 单客户端
            const client = this._clients.get(clientId)
            client?.webContents.send(channel, ...args)
        }
    }

    getWebContents(clientId: string): WebContents | null {
        return this._clients.get(clientId)?.webContents ?? null
    }

    getClientIds(): string[] {
        return Array.from(this._clients.keys())
    }

    getClientsByGroup(groupId: string): string[] {
        return Array.from(this._clients.entries())
            .filter(([_, { groupId: g }]) => g === groupId)
            .map(([id]) => id)
    }
}
```

### 5.3 与 ElectronRpcServer 的关系

```typescript
// ElectronRpcServer 依赖 WebContentsManager 接口
export class ElectronRpcServer implements RpcServer {
    constructor(
        private readonly _webContentsManager: WebContentsManager,
        private readonly _ipcMain: IpcMain
    ) {}

    push(event: string, target: Rpc.Target, ...args: unknown[]): void {
        const eventPath = this._normalizeEvent(event)
        const channel = `rpc:event:${eventPath}`

        if (target.type === 'broadcast') {
            this._webContentsManager.send('*', channel, ...args)
        } else if (target.type === 'client') {
            this._webContentsManager.send(target.clientId, channel, ...args)
        } else if (target.type === 'group') {
            this._webContentsManager.send(`group:${target.groupId}`, channel, ...args)
        }
    }
}

// 使用示例
const windowManager = new ElectronWindowManager()
const server = new ElectronRpcServer(windowManager, ipcMain)
```

## 6. HttpRpcServer SSE 支持

### 6.1 SSE 端点

```typescript
export class HttpRpcServer implements RpcServer {
    private readonly _sseClients = new Map<string, Set<ReadableStreamDefaultController>>()

    constructor(private readonly app: Hono) {
        this._setupSseRoutes()
    }

    private _setupSseRoutes() {
        // GET /rpc/events/:event - SSE 事件订阅
        this.app.get('/rpc/events/:event', async (c) => {
            const event = c.req.param('event')

            return new Response(
                new ReadableStream({
                    start(controller) {
                        // 注册到订阅者列表
                        if (!this._sseClients.has(event)) {
                            this._sseClients.set(event, new Set())
                        }
                        this._sseClients.get(event)!.add(controller)

                        // 发送初始连接事件
                        controller.enqueue(`event: connected\ndata: {}\n\n`)
                    },
                    cancel() {
                        // 取消时移除
                        this._sseClients.get(event)?.delete(controller)
                    }
                }),
                {
                    headers: {
                        'Content-Type': 'text/event-stream',
                        'Cache-Control': 'no-cache',
                        'Connection': 'keep-alive'
                    }
                }
            )
        })

        // GET /rpc/stream/:event - SSE 流式 RPC 响应
        this.app.get('/rpc/stream/:event', async (c) => {
            // 实现流式响应
        })
    }

    push(event: string, target: Rpc.Target, ...args: unknown[]): void {
        const eventPath = this._normalizeEvent(event)

        if (target.type === 'broadcast') {
            this._broadcastSse(eventPath, ...args)
        } else if (target.type === 'client') {
            // 发送给特定客户端（通过 clientId 关联的 SSE 连接）
            this._sendToClient(target.clientId, eventPath, ...args)
        } else if (target.type === 'group') {
            this._broadcastSse(`group:${target.groupId}:${eventPath}`, ...args)
        }
    }

    private _broadcastSse(event: string, ...args: unknown[]): void {
        const subscribers = this._sseClients.get(event)
        if (subscribers) {
            const data = JSON.stringify(args)
            for (const controller of subscribers) {
                controller.enqueue(`event: ${event}\ndata: ${data}\n\n`)
            }
        }
    }
}
```

### 6.2 push 方法实现

```typescript
push(event: string, target: Rpc.Target, ...args: unknown[]): void {
    const eventPath = this._normalizeEvent(event)

    switch (target.type) {
        case 'broadcast':
            // 广播给所有订阅者
            this._broadcastSse(eventPath, ...args)
            break
        case 'client':
            // 查找该 client 的 SSE 连接并发送
            this._sendToClient(target.clientId, eventPath, ...args)
            break
        case 'group':
            // 群组广播
            this._broadcastSse(`group:${target.groupId}:${eventPath}`, ...args)
            break
    }
}
```

## 7. Schema 校验

### 7.1 中间件模式

```typescript
export class HttpRpcServer implements RpcServer {
    handle(event: string, options: Rpc.HandleOptions, handler: Rpc.HandlerFn): void
    handle(event: string, handler: Rpc.HandlerFn): void
    handle(
        event: string,
        optionsOrHandler: Rpc.HandleOptions | Rpc.HandlerFn,
        maybeHandler?: Rpc.HandlerFn
    ): void {
        const eventPath = this._normalizeEvent(event)
        let handlerFn: Rpc.HandlerFn
        let schema: Rpc.HandleOptions['schema']

        if (typeof optionsOrHandler === 'function') {
            handlerFn = optionsOrHandler
        } else {
            handlerFn = maybeHandler!
            schema = optionsOrHandler.schema
        }

        // 注册包装后的 handler
        this._handlers.set(eventPath, {
            handler: this._wrapWithSchema(handlerFn, schema),
            options: schema ? { schema } : undefined
        })
    }

    private _wrapWithSchema(handler: Rpc.HandlerFn, schema?: StandardSchemaV1): Rpc.HandlerFn {
        return async (ctx, ...args) => {
            // 如果没有 schema，直接执行
            if (!schema) {
                return handler(ctx, ...args)
            }

            // 使用 StandardSchemaV1 接口校验
            const rawArgs = args[0]
            const validated = schema['~standard'].validate(rawArgs)

            if (validated.errors) {
                throw new RpcError(
                    RpcError.INVALID_PARAMS,
                    'Invalid parameters',
                    validated.errors
                )
            }

            return handler(ctx, validated.value)
        }
    }
}
```

### 7.2 使用示例

```typescript
import { z } from 'zod'

// 用户定义 schema
const schema = {
    '~standard': {
        validate: (value: unknown) => {
            const result = z.object({
                name: z.string(),
                age: z.number()
            }).safeParse(value)
            if (result.success) {
                return { value: result.data, errors: undefined }
            } else {
                return { value: undefined, errors: result.error.errors }
            }
        }
    }
} as StandardSchemaV1

server.handle('user/create', { schema }, async (ctx, params) => {
    // params 已经是校验后的类型
    return { id: '1' }
})
```

## 8. HttpRpcClient 变更

### 8.1 构造函数更新

```typescript
export class HttpRpcClient implements RpcClient {
    constructor(
        baseUrl: string,
        clientId?: string,
        groupId?: string,
        options?: RpcClientOptions
    )
}
```

### 8.2 call 方法支持 RpcCallOptions

```typescript
async call<T>(
    event: string,
    options: RpcCallOptions = {},
    ...args: unknown[]
): Promise<T> {
    const timeout = options.timeout ?? this._defaultTimeout ?? 30000
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    if (options.signal) {
        options.signal.addEventListener('abort', () => controller.abort())
    }

    try {
        const response = await fetch(`${this._baseUrl}/rpc/${event}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-rpc-client-id': this.clientId,
                ...(this.groupId && { 'x-rpc-group-id': this.groupId })
            },
            body: JSON.stringify(args),
            signal: controller.signal
        })

        if (!response.ok) {
            throw new RpcError('HTTP_ERROR', `HTTP ${response.status}`)
        }

        const payload = await response.json()
        if (payload.error) {
            throw RpcError.fromJSON(payload.error)
        }
        return payload.result as T
    } finally {
        clearTimeout(timeoutId)
    }
}
```

### 8.3 stream 方法支持 SSE

```typescript
stream<T>(
    event: string,
    options: RpcCallOptions = {},
    ...args: unknown[]
): Rpc.StreamResult<T> {
    const eventSource = new EventSource(
        `${this._baseUrl}/rpc/stream/${event}?args=${encodeURIComponent(JSON.stringify(args))}`
    )

    const chunks: T[] = []
    let resolveNext: (value: IteratorResult<T>) => void
    let rejectNext: (error: Error) => void

    return {
        [Symbol.asyncIterator]: () => ({
            next: async () => {
                if (chunks.length > 0) {
                    return { done: false, value: chunks.shift()! }
                }
                return new Promise((resolve, reject) => {
                    resolveNext = resolve
                    rejectNext = reject
                })
            }
        }),
        cancel: () => {
            eventSource.close()
            options.signal?.addEventListener('abort', () => eventSource.close())
        }
    }
}
```

## 9. 目录结构

```
apps/desktop/src/shared/rpc/
├── types.ts                      # 新增 RpcClientOptions, RpcCallOptions
├── RpcError.ts
├── utils.ts
├── electron/
│   ├── ElectronRpcServer.ts     # 依赖 WebContentsManager 接口
│   ├── ElectronRpcClient.ts     # 支持 RpcCallOptions + signal + 清理回调
│   ├── ElectronRpcRouter.ts
│   ├── ElectronWindowManager.ts  # 新增：窗口管理器基类
│   └── index.ts
└── http/
    ├── HttpRpcServer.ts         # 新增 SSE 端点 + push 实现 + Schema 中间件
    ├── HttpRpcClient.ts         # 支持 RpcCallOptions + signal + SSE 流式响应
    ├── HttpRpcRouter.ts
    └── index.ts
```

## 10. 未解决问题

| 问题 | 状态 |
|------|------|
| 客户端自动重连 | 暂不实现 |
| 流式响应背压机制 | 暂不实现 |
| 协议格式（JSON-RPC 2.0） | 由实现方决定 |
| 认证机制 | 暂不设计 |
