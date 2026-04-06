# Desktop Renderer 重构设计方案

## 概述

对 `apps/desktop/src/renderer` 进行分层和模块化重构，建立清晰的技术架构边界，支持未来的功能扩展。

## 目标

- 组件职责清晰，UI 与业务逻辑分离
- 支持多聊天页面并发流式处理
- 为未来功能（HTTP、SSE、WebSocket）预留扩展空间
- 支持按路由页面逐步迁移

---

## 1. 目录结构

```
src/renderer/src/
├── features/                    # 功能域，按业务划分
│   ├── chat/                   # 会话、消息
│   ├── browser/                # Webview 浏览器
│   ├── git/                   # Git 面板
│   ├── file/                  # 文件预览和处理
│   ├── settings/              # 设置页面
│   ├── onboarding/            # 初始化向导
│   ├── vault/                 # 工作区/项目目录管理
│   ├── mcp/                  # MCP 服务器和工具
│   ├── tools/                 # 工具选择器
│   └── skills/                # 技能
│
├── components/                 # 共享的基础 UI 组件
│   └── base/                  # 纯 UI 组件，无业务逻辑
│       ├── Button/
│       ├── Input/
│       └── Modal/
│
├── hooks/                      # 共享的 React hooks
│   ├── useTheme.ts
│   ├── useDebounce.ts
│   └── ...
│
├── services/                   # 外部通信服务（类型安全的方法式 API）
│   ├── ipc.ts                 # Electron IPC 封装
│   ├── http.ts                # HTTP 请求
│   ├── sse.ts                # SSE 连接
│   └── websocket.ts           # WebSocket 连接
│
├── stores/                     # 全局状态（jotai atoms）
│   ├── atoms/
│   │   ├── project.ts
│   │   ├── sidebar.ts
│   │   └── thread.ts
│   └── index.ts
│
└── routes/                     # 路由页面（按需引用 features）
    ├── chat-popup/
    ├── vault/
    └── welcome/
```

### Features 内部结构

每个 feature 内部自行组织：

```
features/chat/
├── components/                # feature 私有的组合组件
│   ├── ChatHeader/
│   └── MessageList/
├── hooks/                     # feature 私有的 hooks
│   ├── useChatStream.ts
│   └── useSendMessage.ts
├── services/                  # feature 私有的服务（如有）
├── types.ts                   # 类型定义
└── index.ts                   # 公开导出
```

### 组件命名规范

- **目录**: CamelCase（PascalCase）
- **文件**: CamelCase.tsx
- **组件名**: 与文件名相同
- 每个组件文件只导出一个组件

---

## 2. 组件分层

### 三层架构

| 层级              | 说明                          | 示例                                     |
| ----------------- | ----------------------------- | ---------------------------------------- |
| **UI Layer**      | 纯展示组件，无业务逻辑        | `Button`, `Input`, `Modal`               |
| **Feature Layer** | 组合 UI + hooks，承载业务逻辑 | `ChatInput`, `ThreadList`                |
| **Service Layer** | 外部通信（IPC/HTTP/SSE/WS）   | `ipc.sendMessage()`, `http.uploadFile()` |

### 分层原则

- **UI Layer** 位于 `components/base/`，被 Feature Layer 引用
- **Feature Layer** 位于 `features/<name>/components/`，引用 UI Layer + hooks
- **业务逻辑** 在 hooks 中，调用 Service Layer
- **组件只调用 hooks**，不直接调用 services

### 示例

```typescript
// components/base/Button.tsx (UI Layer - 纯展示)
export function Button({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick}>{children}</button>
}

// features/chat/components/ChatInput.tsx (Feature Layer)
import { Button } from '@/components/base/Button'
import { useSendMessage } from '../hooks/useSendMessage'

export function ChatInput() {
  const { send, isSending } = useSendMessage()
  return <Button onClick={() => send('hello')}>{isSending ? 'Sending...' : 'Send'}</Button>
}

// features/chat/hooks/useSendMessage.ts (Service Layer 调用)
import { ipc } from '@/services/ipc'

export function useSendMessage() {
  const send = async (content: string) => {
    await ipc.sendMessage({ sessionId: 'current', content })
  }
  return { send }
}
```

---

## 3. 状态管理

### 状态分层

| 范围                 | 方案               | 示例                        |
| -------------------- | ------------------ | --------------------------- |
| 单组件内部           | `useState`         | 弹窗开关、临时输入          |
| 多组件共享（不全局） | `useState` + props | 父组件传子组件              |
| 跨多层组件共享       | **Context**        | 主题、语言设置              |
| **全局持久化状态**   | **jotai atom**     | 用户项目列表、侧边栏宽度    |
| **派生状态**         | **atom**           | `isAllProjectsExpandedAtom` |
| **多会话隔离状态**   | **atomFamily**     | 每个 session 独立状态       |

### Atom vs State 区分原则

**使用 atom**：

- 需要持久化到 localStorage
- 跨页面共享
- 组件间需要同步
- 多会话独立状态（用 `atomFamily`）

**使用 state**：

- 组件内部使用
- 不需要跨组件共享
- 临时 UI 状态

### atomFamily 用于多会话

```typescript
// stores/atoms/session.ts
import { atom } from 'jotai'
import { atomFamily } from 'jotai/utils'

// 每个 session 独立的 atom
const sessionAtomFamily = atomFamily((sessionId: string) =>
  atom<Session | null>(null)
)

// 流式状态更新
export const appendMessageAtom = atom(
  null,
  (get, set, sessionId: string, message: Message) => {
    const sessionAtom = sessionAtomFamily(sessionId)
    const session = get(sessionAtom)
    if (session) {
      set(sessionAtom, {
        ...session,
        messages: [...session.messages, message],
      })
    }
  }
)
```

---

## 4. 多会话流式处理

### 架构

```
┌─────────────────────────────────────────────────────────┐
│  Main Process                                            │
│  所有 AI 流式连接在此管理                                  │
│  Session A ──→ Stream ──→                                │
│  Session B ──→ Stream ──→ IPC ──→ Renderer                │
│  Session C ──→ Stream ──→                                │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Renderer Process                                        │
│  每个 session 有独立的 atom + 独立的 stream 处理           │
│                                                          │
│  sessionAtomFamily('A') ──→ 更新 Session A 的 UI          │
│  sessionAtomFamily('B') ──→ 更新 Session B 的 UI          │
│  sessionAtomFamily('C') ──→ 更新 Session C 的 UI          │
└─────────────────────────────────────────────────────────┘
```

### 实现方式

使用 `stream()` + atomFamily，每个 session 独立异步处理：

```typescript
// hooks/useSessionStreams.ts
export function useSessionStreams() {
  const streamsRef = useRef(new Map<string, Rpc.StreamResult<SessionEvent>>())

  const startStream = useCallback((sessionId: string) => {
    if (streamsRef.current.has(sessionId)) return

    const stream = ipc.streamSession(sessionId)
    streamsRef.current.set(sessionId, stream)

    // 独立异步处理，不阻塞其他 session
    ;(async () => {
      try {
        for await (const event of stream) {
          processSessionEvent(sessionId, event) // 更新对应 atom
        }
      } finally {
        streamsRef.current.delete(sessionId)
      }
    })()
  }, [])

  const stopStream = useCallback((sessionId: string) => {
    streamsRef.current.get(sessionId)?.cancel()
    streamsRef.current.delete(sessionId)
  }, [])

  return { startStream, stopStream }
}
```

### 特点

- **隔离更新**: Session A 的更新不会触发 Session B 重新渲染
- **独立处理**: 每个 stream 在独立 async 上下文中运行
- **切换不丢失**: 切换视图时，其他 session 的 stream 继续运行
- **按需加载**: 可以为活跃 session 启动 stream，非活跃 session 暂不启动

---

## 5. Services 层设计

### 设计原则

- **类型安全**: 每个方法有明确的输入输出类型
- **方法式 API**: `ipc.findFiles()` 而非 `ipc.call('findFiles')`
- **单一职责**: 一个方法对应一个操作

### services/ipc.ts

```typescript
export const ipc = {
  // 文件操作
  findFiles: (params: { vaultId: string; pattern: string }) =>
    windowApi.rpc.call<File[]>('/files/find', params),

  readFile: (params: { vaultId: string; path: string }) =>
    windowApi.rpc.call<string>('/files/read', params),

  // Session 操作
  streamSession: (sessionId: string) =>
    windowApi.rpc.stream<SessionEvent>('/session/stream', sessionId),

  sendMessage: (params: {
    sessionId: string
    content: string
    attachments?: FileAttachment[]
  }) => windowApi.rpc.call<void>('/session/send', params),

  // Vault 操作
  createVault: (params: { name: string }) =>
    windowApi.rpc.call<Vault>('/vault/create', params),

  getVaults: () => windowApi.rpc.call<Vault[]>('/vault/list'),
}
```

### services/http.ts

```typescript
export const http = {
  getUsers: (params?: { page?: number; limit?: number }) =>
    request<User[]>('/api/users', { params }),

  getUser: (id: string) => request<User>(`/api/users/${id}`),

  createUser: (data: CreateUserInput) =>
    request<User>('/api/users', { method: 'POST', body: data }),

  uploadFile: (file: File, onProgress?: (percent: number) => void) =>
    request<{ path: string }>('/api/upload', {
      method: 'POST',
      body: file,
      onProgress,
    }),
}
```

### services/sse.ts

```typescript
export function createSSEConnection(params: { url: string; topics: string[] }) {
  const listeners = new Map<string, Set<(data: unknown) => void>>()

  const connect = () => {
    const es = new EventSource(params.url)
    es.onmessage = (e) => {
      const event = JSON.parse(e.data)
      listeners.get(event.topic)?.forEach((fn) => fn(event.data))
    }
    return { disconnect: () => es.close() }
  }

  return {
    connect,
    on<T>(topic: string, handler: (data: T) => void) {
      if (!listeners.has(topic)) listeners.set(topic, new Set())
      listeners.get(topic)!.add(handler as (data: unknown) => void)
    },
    off: (topic: string) => listeners.delete(topic),
  }
}
```

### services/websocket.ts

```typescript
export function createWebSocketConnection(params: { url: string }) {
  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout>

  const connect = () => {
    ws = new WebSocket(params.url)
    ws.onmessage = (e) => handleMessage(JSON.parse(e.data))
    ws.onclose = () => scheduleReconnect()
  }

  const send = (data: unknown) => ws?.send(JSON.stringify(data))
  const disconnect = () => {
    clearTimeout(reconnectTimer)
    ws?.close()
  }

  return { connect, send, disconnect }
}
```

---

## 6. 迁移策略

### 原则

- 按路由页面逐步迁移
- 一次迁移一个页面或一个 feature
- 保持现有功能正常运作

### 迁移步骤

1. **创建目录结构**
   - 建立 `features/`、`services/`、`stores/` 目录
   - 迁移现有 atoms 到 `stores/atoms/`

2. **抽取 Services 层**
   - 分析当前 IPC 调用
   - 封装为 `services/ipc.ts`
   - 后续添加 `http.ts`、`sse.ts`、`websocket.ts`

3. **重构组件**
   - 识别 base UI 组件，移入 `components/base/`
   - 识别业务逻辑，移入 hooks
   - 按 feature 组织组件

4. **实现多会话流式**
   - 使用 atomFamily 重构 session 状态
   - 实现 `useSessionStreams` hook
   - 验证多会话切换不丢失状态

### 优先级

1. **Phase 1**: 目录结构 + Services 层（ipc.ts）
2. **Phase 2**: 抽取 base UI 组件 + 组件分层
3. **Phase 3**: 状态管理重构（atomFamily）
4. **Phase 4**: 多会话流式支持
5. **Phase 5**: 添加 http/sse/websocket services

---

## 7. 命名规范

| 类型     | 规范            | 示例                           |
| -------- | --------------- | ------------------------------ |
| 目录     | kebab-case      | `chat-popup`, `vault-settings` |
| 组件文件 | CamelCase.tsx   | `ChatHeader.tsx`               |
| 组件名   | PascalCase      | `ChatHeader`                   |
| hooks    | useCamelCase.ts | `useChatStream.ts`             |
| services | camelCase.ts    | `ipc.ts`, `http.ts`            |
| atoms    | camelCase.ts    | `project.ts`, `sidebar.ts`     |
| 类型     | PascalCase      | `Session`, `Vault`, `Message`  |

---

## 8. 未解决问题

以下问题在实施过程中需要进一步确认：

1. **Context 使用场景**: 具体哪些配置适合用 Context 共享
2. **hooks 划分**: 共享 hooks 和 feature hooks 的边界
3. **Service 层实现**: `http.ts` 等的具体实现细节（使用 axios 还是 fetch）
4. **Tanstack Query 集成**: 是否引入以及在哪些场景使用
