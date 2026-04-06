# Desktop Renderer 重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构 `apps/desktop/src/renderer`，建立清晰的组件分层、Services 层、多会话流式支持

**Architecture:**

- 目录结构：`features/` + `components/base/` + `hooks/` + `services/` + `stores/` + `routes/`
- 组件分层：UI Layer (base) → Feature Layer (composed) → Service Layer (hooks + services)
- 多会话流式：使用 `stream()` + atomFamily，每 session 独立异步处理

**Tech Stack:**

- React + TypeScript
- Jotai (状态管理)
- TanStack Router
- RPC (Electron IPC)

---

## 概述：实施阶段

| Phase       | 内容                                 | 优先级 |
| ----------- | ------------------------------------ | ------ |
| **Phase 1** | 目录结构 + Services 层基础（ipc.ts） | P0     |
| **Phase 2** | Base UI 组件抽取 + 组件分层          | P1     |
| **Phase 3** | 状态管理重构（atomFamily）           | P1     |
| **Phase 4** | 多会话流式支持                       | P1     |
| **Phase 5** | features 目录建立                    | P2     |
| **Phase 6** | http/sse/websocket services          | P2     |

---

## Phase 1: 目录结构 + Services 层基础

### Task 1: 创建目录结构

**Files:**

- Create: `apps/desktop/src/renderer/src/services/` (directory)
- Create: `apps/desktop/src/renderer/src/stores/` (directory)
- Create: `apps/desktop/src/renderer/src/stores/atoms/` (directory)
- Create: `apps/desktop/src/renderer/src/features/` (directory)

- [ ] **Step 1: 创建 services、stores、stores/atoms、features 目录**

```bash
mkdir -p apps/desktop/src/renderer/src/services
mkdir -p apps/desktop/src/renderer/src/stores/atoms
mkdir -p apps/desktop/src/renderer/src/features
```

- [ ] **Step 2: 创建空 index.ts 文件作为导出入口**

Create: `apps/desktop/src/renderer/src/services/index.ts`

```typescript
// Services 层导出
export * from './ipc'
```

Create: `apps/desktop/src/renderer/src/stores/index.ts`

```typescript
// Stores 层导出
export * from './atoms'
```

### Task 2: 实现 services/ipc.ts

**Files:**

- Create: `apps/desktop/src/renderer/src/services/ipc.ts`

- [ ] **Step 1: 创建 ipc.ts 文件**

```typescript
import type { RpcClient } from '@/shared/rpc'

// IPC 服务封装 - 类型安全的方法式 API
export const ipc = {
  // ========== 文件操作 ==========

  /**
   * 查找文件
   */
  findFiles: (params: { vaultId: string; pattern: string }) =>
    windowApi.rpc.call<File[]>('/files/find', params),

  /**
   * 读取文件内容
   */
  readFile: (params: { vaultId: string; path: string }) =>
    windowApi.rpc.call<string>('/files/read', params),

  /**
   * 写入文件
   */
  writeFile: (params: { vaultId: string; path: string; content: string }) =>
    windowApi.rpc.call<void>('/files/write', params),

  // ========== Session 操作 ==========

  /**
   * 获取流式 Session 事件
   */
  streamSession: (sessionId: string) =>
    windowApi.rpc.stream<SessionEvent>('/session/stream', sessionId),

  /**
   * 发送消息
   */
  sendMessage: (params: {
    sessionId: string
    content: string
    attachments?: FileAttachment[]
  }) => windowApi.rpc.call<void>('/session/send', params),

  /**
   * 获取 Session 列表
   */
  getSessions: (vaultId?: string) =>
    windowApi.rpc.call<Session[]>('/session/list', vaultId),

  /**
   * 获取单个 Session
   */
  getSession: (sessionId: string) =>
    windowApi.rpc.call<Session>('/session/get', sessionId),

  /**
   * 创建 Session
   */
  createSession: (params: { vaultId: string; name?: string }) =>
    windowApi.rpc.call<Session>('/session/create', params),

  /**
   * 删除 Session
   */
  deleteSession: (sessionId: string) =>
    windowApi.rpc.call<void>('/session/delete', sessionId),

  // ========== Vault 操作 ==========

  /**
   * 获取 Vault 列表
   */
  getVaults: () => windowApi.rpc.call<Vault[]>('/vault/list'),

  /**
   * 创建 Vault
   */
  createVault: (params: { name: string }) =>
    windowApi.rpc.call<Vault>('/vault/create', params),

  /**
   * 获取 Vault 设置
   */
  getVaultSettings: (vaultId: string) =>
    windowApi.rpc.call<VaultSettings>('/vault/settings/get', vaultId),

  // ========== Store 操作 ==========

  /**
   * 获取存储值
   */
  getStore: <T>(key: string) => windowApi.rpc.call<T>('/system/store/get', key),

  /**
   * 设置存储值
   */
  setStore: <T>(key: string, value: T) =>
    windowApi.rpc.call<void>('/system/store/set', key, value),
}
```

- [ ] **Step 2: 补充 TypeScript 类型定义**

需要在 `apps/desktop/src/renderer/src/types/` 下添加：

- `session.ts` - Session、SessionEvent 类型
- `vault.ts` - Vault 类型
- `file.ts` - File 类型

Create: `apps/desktop/src/renderer/src/types/session.ts`

```typescript
export interface Session {
  id: string
  name?: string
  vaultId: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  attachments?: FileAttachment[]
  timestamp: number
}

export type SessionEvent =
  | { type: 'text_delta'; sessionId: string; content: string; turnId?: string }
  | {
      type: 'text_complete'
      sessionId: string
      content: string
      turnId?: string
    }
  | { type: 'complete'; sessionId: string }
  | { type: 'error'; sessionId: string; message: string }
```

Create: `apps/desktop/src/renderer/src/types/vault.ts`

```typescript
export interface Vault {
  id: string
  name: string
  path: string
}

export interface VaultSettings {
  vaultId: string
  // ... 其他设置字段
}
```

Create: `apps/desktop/src/renderer/src/types/file.ts`

```typescript
export interface File {
  path: string
  name: string
  isDirectory: boolean
}
```

- [ ] **Step 3: 更新 services/index.ts 导出**

Modify: `apps/desktop/src/renderer/src/services/index.ts`

```typescript
export * from './ipc'
export * from './http' // Phase 6
export * from './sse' // Phase 6
export * from './websocket' // Phase 6
```

- [ ] **Step 4: 提交**

```bash
git add apps/desktop/src/renderer/src/services/
git add apps/desktop/src/renderer/src/types/
git commit -m "feat(renderer): create services layer with ipc.ts"
```

---

### Task 3: 迁移现有 atoms 到 stores/atoms/

**Files:**

- Create: `apps/desktop/src/renderer/src/stores/atoms/project.ts`
- Create: `apps/desktop/src/renderer/src/stores/atoms/sidebar.ts`
- Create: `apps/desktop/src/renderer/src/stores/atoms/thread.ts`
- Modify: `apps/desktop/src/renderer/src/stores/index.ts`

**当前 atoms 位置:**

- `apps/desktop/src/renderer/src/atoms/project.ts`
- `apps/desktop/src/renderer/src/atoms/sidebar.ts`
- `apps/desktop/src/renderer/src/atoms/thread.ts`

- [ ] **Step 1: 迁移 project.ts**

Create: `apps/desktop/src/renderer/src/stores/atoms/project.ts`

```typescript
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { Project } from '@/types/project'
import { mockProjects } from './mock-data'

export const projectsAtom = atomWithStorage<Project[]>('projects', mockProjects)

export const openedProjectIdsAtom = atom<Set<string>>(new Set<string>())

export const isAllProjectsExpandedAtom = atom((get) => {
  const projects = get(projectsAtom)
  const openedProjectIds = get(openedProjectIdsAtom)
  return (
    projects.length > 0 && projects.every((p) => openedProjectIds.has(p.id))
  )
})

export const isAllProjectsCollapsedAtom = atom((get) => {
  const openedProjectIds = get(openedProjectIdsAtom)
  return openedProjectIds.size === 0
})
```

- [ ] **Step 2: 迁移 sidebar.ts**

Create: `apps/desktop/src/renderer/src/stores/atoms/sidebar.ts`

```typescript
import { atomWithStorage } from 'jotai/utils'
import type { SidebarState } from '@/types/sidebar'

export const sidebarAtom = atomWithStorage<SidebarState>('sidebar-state', {
  collapsed: false,
  width: 256,
  organizeMode: 'folder',
  sortBy: 'updatedAt',
  showMode: 'all',
})
```

- [ ] **Step 3: 迁移 thread.ts**

Create: `apps/desktop/src/renderer/src/stores/atoms/thread.ts`

```typescript
import { atom } from 'jotai'

export interface Thread {
  id: string
  projectId: string
  name: string
  createdAt: number
  updatedAt: number
}

export const threadsAtom = atom<Thread[]>([])

export const activeThreadIdAtom = atom<string | null>(null)
```

- [ ] **Step 4: 创建 stores/index.ts**

Create: `apps/desktop/src/renderer/src/stores/index.ts`

```typescript
export * from './atoms/project'
export * from './atoms/sidebar'
export * from './atoms/thread'
```

- [ ] **Step 5: 移动 mock-data.ts**

Move: `apps/desktop/src/renderer/src/atoms/mock-data.ts` → `apps/desktop/src/renderer/src/stores/atoms/mock-data.ts`

- [ ] **Step 6: 移动 types/**

Move: `apps/desktop/src/renderer/src/types/project.ts` → `apps/desktop/src/renderer/src/types/project.ts`（已在正确位置）
Move: `apps/desktop/src/renderer/src/types/sidebar.ts` → `apps/desktop/src/renderer/src/types/sidebar.ts`（已在正确位置）
Move: `apps/desktop/src/renderer/src/types/thread.ts` → `apps/desktop/src/renderer/src/types/thread.ts`（已在正确位置）

- [ ] **Step 7: 更新导入路径**

在所有使用 atoms 的文件中，更新导入路径：

- 从 `@renderer/atoms` → `@renderer/stores`
- 从 `@renderer/atoms/project` → `@renderer/stores/atoms/project`

需要更新的文件（待验证）：

- `apps/desktop/src/renderer/src/components/app-shell/sidebar/ProjectSection.tsx`

- [ ] **Step 8: 提交**

```bash
git add apps/desktop/src/renderer/src/stores/
git add apps/desktop/src/renderer/src/types/
git rm apps/desktop/src/renderer/src/atoms/mock-data.ts 2>/dev/null || true
git commit -m "refactor(renderer): move atoms to stores/atoms/"
```

---

## Phase 2: Base UI 组件抽取 + 组件分层

### Task 4: 识别并抽取 Base UI 组件

**当前组件位置:** `apps/desktop/src/renderer/src/components/app-shell/sidebar/cell/`

**Files:**

- Create: `apps/desktop/src/renderer/src/components/base/Cell/` (directory)
- Modify: `apps/desktop/src/renderer/src/components/app-shell/sidebar/cell/Cell.tsx`

- [ ] **Step 1: 分析 Cell.tsx，识别 Base UI 部分**

当前 `Cell.tsx` 包含：

- `Cell` - 基础容器组件（可抽取为 base）
- `CellIcon` - 图标容器（可抽取为 base）
- `CellName` - 名称展示（可抽取为 base）
- `CellActions` - 操作按钮容器（可抽取为 base）

- [ ] **Step 2: 创建 base/Cell 组件**

Create: `apps/desktop/src/renderer/src/components/base/Cell/index.tsx`

```typescript
import React from 'react'
import { cn } from '@acme-ai/ui'

export interface CellProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Cell({ className, children, ...props }: Readonly<CellProps>) {
  return (
    <div
      className={cn(
        'group text-secondary-foreground flex h-8 items-center gap-1 overflow-hidden rounded-md px-2.5 text-sm transition-colors',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export interface CellIconProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CellIcon({ className, children, ...props }: Readonly<CellIconProps>) {
  return (
    <div
      className={cn(
        'relative mr-1.5 flex shrink-0 items-center justify-start',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export interface CellNameProps extends React.HTMLAttributes<HTMLSpanElement> {}

export function CellName({ className, children, ...props }: Readonly<CellNameProps>) {
  return (
    <span className={cn('flex-1 truncate text-xs', className)} {...props}>
      {children}
    </span>
  )
}

export interface CellActionsProps extends React.HTMLAttributes<HTMLDivElement> {}

export function CellActions({ className, children, ...props }: Readonly<CellActionsProps>) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-1 transition-opacity',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 3: 创建 components/base/index.ts**

Create: `apps/desktop/src/renderer/src/components/base/index.ts`

```typescript
export * from './Cell'
```

- [ ] **Step 4: 更新 Cell.tsx 使用 base 组件**

Modify: `apps/desktop/src/renderer/src/components/app-shell/sidebar/cell/Cell.tsx`

```typescript
// 重新导出，保持向后兼容
export { Cell, CellIcon, CellName, CellActions } from '@/components/base/Cell'
```

- [ ] **Step 5: 提交**

```bash
git add apps/desktop/src/renderer/src/components/base/
git commit -m "feat(renderer): add base Cell components"
```

---

## Phase 3: 状态管理重构（atomFamily）

### Task 5: 实现 session atomFamily

**Files:**

- Create: `apps/desktop/src/renderer/src/stores/atoms/session.ts`

- [ ] **Step 1: 创建 session atoms with atomFamily**

Create: `apps/desktop/src/renderer/src/stores/atoms/session.ts`

```typescript
import { atom } from 'jotai'
import { atomFamily } from 'jotai/utils'
import type { Session, Message } from '@/types/session'

/**
 * Session 原子家族 - 每个 session 独立的 atom
 * 使用 atomFamily 实现，隔离更新
 */
export const sessionAtomFamily = atomFamily(
  (sessionId: string) => atom<Session | null>(null),
  (a, b) => a === b
)

/**
 * Session 元数据映射 - 用于列表展示
 */
export const sessionMetaMapAtom = atom<Map<string, SessionMeta>>(new Map())

/**
 * Session ID 列表 - 用于排序
 */
export const sessionIdsAtom = atom<string[]>([])

/**
 * 当前活跃的 Session ID
 */
export const activeSessionIdAtom = atom<string | null>(null)

/**
 * 已加载的 Session 集合 - 用于延迟加载
 */
export const loadedSessionsAtom = atom<Set<string>>(new Set())

/**
 * Session 元数据接口
 */
export interface SessionMeta {
  id: string
  name?: string
  preview?: string
  vaultId: string
  lastMessageAt?: number
  isProcessing?: boolean
  isFlagged?: boolean
  hasUnread?: boolean
}

/**
 * 更新 Session
 */
export const updateSessionAtom = atom(
  null,
  (
    get,
    set,
    sessionId: string,
    updater: (prev: Session | null) => Session | null
  ) => {
    const sessionAtom = sessionAtomFamily(sessionId)
    const currentSession = get(sessionAtom)
    const newSession = updater(currentSession)
    set(sessionAtom, newSession)
  }
)

/**
 * 追加消息到 Session
 */
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

/**
 * 更新流式内容
 */
export const updateStreamingContentAtom = atom(
  null,
  (get, set, sessionId: string, content: string) => {
    const sessionAtom = sessionAtomFamily(sessionId)
    const session = get(sessionAtom)
    if (!session) return

    const messages = [...session.messages]
    const lastMsg = messages[messages.length - 1]

    if (lastMsg?.role === 'assistant' && lastMsg.isStreaming) {
      messages[messages.length - 1] = {
        ...lastMsg,
        content: lastMsg.content + content,
      }
      set(sessionAtom, { ...session, messages })
    }
  }
)
```

- [ ] **Step 2: 更新 stores/index.ts**

Modify: `apps/desktop/src/renderer/src/stores/index.ts`

```typescript
export * from './atoms/project'
export * from './atoms/sidebar'
export * from './atoms/thread'
export * from './atoms/session'
```

- [ ] **Step 3: 提交**

```bash
git add apps/desktop/src/renderer/src/stores/atoms/session.ts
git commit -m "feat(renderer): add session atomFamily for multi-session support"
```

---

## Phase 4: 多会话流式支持

### Task 6: 实现 useSessionStreams hook

**Files:**

- Create: `apps/desktop/src/renderer/src/hooks/useSessionStreams.ts`

- [ ] **Step 1: 创建 useSessionStreams hook**

Create: `apps/desktop/src/renderer/src/hooks/useSessionStreams.ts`

```typescript
import { useCallback, useRef } from 'react'
import { useStore } from 'jotai'
import { ipc } from '@/services/ipc'
import {
  sessionAtomFamily,
  sessionMetaMapAtom,
  appendMessageAtom,
  updateStreamingContentAtom,
  sessionIdsAtom,
  extractSessionMeta,
} from '@/stores/atoms/session'
import type { SessionEvent } from '@/types/session'

/**
 * 管理多个 Session 流式连接的 Hook
 * 每个 Session 的流在独立异步上下文中处理
 */
export function useSessionStreams() {
  const store = useStore()
  const streamsRef = useRef<Map<string, Rpc.StreamResult<SessionEvent>>>(
    new Map()
  )

  /**
   * 启动某个 Session 的流
   */
  const startStream = useCallback(
    (sessionId: string) => {
      // 避免重复启动
      if (streamsRef.current.has(sessionId)) return

      const stream = ipc.streamSession(sessionId)
      streamsRef.current.set(sessionId, stream)

      // 独立异步处理，不阻塞其他 Session
      ;(async () => {
        try {
          for await (const event of stream) {
            handleSessionEvent(store, sessionId, event)
          }
        } catch (error) {
          console.error(`Stream error for session ${sessionId}:`, error)
        } finally {
          streamsRef.current.delete(sessionId)
        }
      })()
    },
    [store]
  )

  /**
   * 停止某个 Session 的流
   */
  const stopStream = useCallback((sessionId: string) => {
    const stream = streamsRef.current.get(sessionId)
    if (stream) {
      stream.cancel()
      streamsRef.current.delete(sessionId)
    }
  }, [])

  /**
   * 停止所有流
   */
  const stopAllStreams = useCallback(() => {
    streamsRef.current.forEach((stream) => stream.cancel())
    streamsRef.current.clear()
  }, [])

  return {
    startStream,
    stopStream,
    stopAllStreams,
  }
}

/**
 * 处理 Session 事件，更新对应 atom
 */
function handleSessionEvent(
  store: ReturnType<typeof useStore>,
  sessionId: string,
  event: SessionEvent
) {
  switch (event.type) {
    case 'text_delta':
      // 流式更新
      store.set(updateStreamingContentAtom, sessionId, event.content)
      break

    case 'text_complete':
      // 消息完成
      store.set(appendMessageAtom, sessionId, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: event.content,
        timestamp: Date.now(),
      })
      break

    case 'complete':
      // Session 完成，更新元数据
      updateSessionMetadata(store, sessionId)
      break

    case 'error':
      // 错误处理
      console.error(`Session ${sessionId} error:`, event.message)
      break
  }
}

/**
 * 更新 Session 元数据
 */
function updateSessionMetadata(
  store: ReturnType<typeof useStore>,
  sessionId: string
) {
  const sessionAtom = sessionAtomFamily(sessionId)
  const session = store.get(sessionAtom)
  if (!session) return

  const metaMap = store.get(sessionMetaMapAtom)
  const newMetaMap = new Map(metaMap)
  newMetaMap.set(sessionId, extractSessionMeta(session))
  store.set(sessionMetaMapAtom, newMetaMap)
}
```

- [ ] **Step 2: 创建 hooks/index.ts**

Create: `apps/desktop/src/renderer/src/hooks/index.ts`

```typescript
export * from './useSessionStreams'
```

- [ ] **Step 3: 提交**

```bash
git add apps/desktop/src/renderer/src/hooks/useSessionStreams.ts
git commit -m "feat(renderer): add useSessionStreams hook for multi-session streaming"
```

---

## Phase 5: features 目录建立

### Task 7: 建立 features/chat 目录结构

**Files:**

- Create: `apps/desktop/src/renderer/src/features/chat/` (directory)
- Create: `apps/desktop/src/renderer/src/features/chat/components/` (directory)
- Create: `apps/desktop/src/renderer/src/features/chat/hooks/` (directory)
- Create: `apps/desktop/src/renderer/src/features/chat/types.ts` (directory)
- Create: `apps/desktop/src/renderer/src/features/chat/index.ts`

- [ ] **Step 1: 创建 chat feature 目录结构**

```bash
mkdir -p apps/desktop/src/renderer/src/features/chat/components
mkdir -p apps/desktop/src/renderer/src/features/chat/hooks
```

- [ ] **Step 2: 创建 chat/index.ts**

Create: `apps/desktop/src/renderer/src/features/chat/index.ts`

```typescript
// Chat feature 公开导出
export * from './components'
export * from './hooks'
export * from './types'
```

- [ ] **Step 3: 创建 features/index.ts**

Create: `apps/desktop/src/renderer/src/features/index.ts`

```typescript
export * from './chat'
```

- [ ] **Step 4: 提交**

```bash
git add apps/desktop/src/renderer/src/features/
git commit -m "feat(renderer): create features/chat directory structure"
```

---

## Phase 6: http/sse/websocket services

### Task 8: 实现 http service

**Files:**

- Create: `apps/desktop/src/renderer/src/services/http.ts`

- [ ] **Step 1: 创建基础 HTTP 客户端封装**

Create: `apps/desktop/src/renderer/src/services/http.ts`

```typescript
/**
 * HTTP 服务封装 - 类型安全的方法式 API
 */

interface RequestOptions {
  params?: Record<string, unknown>
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: unknown
  headers?: Record<string, string>
  onProgress?: (percent: number) => void
}

async function request<T>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, method = 'GET', body, headers = {}, onProgress } = options

  // 构建 URL
  const urlWithParams = params
    ? `${url}?${new URLSearchParams(params as Record<string, string>).toString()}`
    : url

  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body)
  }

  const response = await fetch(urlWithParams, fetchOptions)

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  return response.json() as Promise<T>
}

async function requestWithProgress(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  // 实现带进度上传
  // ...
}

export const http = {
  // ========== User API ==========

  getUsers: (params?: { page?: number; limit?: number }) =>
    request<User[]>(`/api/users`, { params }),

  getUser: (id: string) => request<User>(`/api/users/${id}`),

  createUser: (data: CreateUserInput) =>
    request<User>('/api/users', { method: 'POST', body: data }),

  updateUser: (id: string, data: UpdateUserInput) =>
    request<User>(`/api/users/${id}`, { method: 'PUT', body: data }),

  deleteUser: (id: string) =>
    request<void>(`/api/users/${id}`, { method: 'DELETE' }),

  // ========== Upload API ==========

  uploadFile: (
    file: File,
    options?: { onProgress?: (percent: number) => void }
  ) => {
    const formData = new FormData()
    formData.append('file', file)
    return request<{ path: string }>('/api/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // 让 fetch 自动设置 Content-Type
      onProgress: options?.onProgress,
    })
  },
}
```

- [ ] **Step 2: 提交**

```bash
git add apps/desktop/src/renderer/src/services/http.ts
git commit -m "feat(renderer): add http service"
```

---

### Task 9: 实现 sse service

**Files:**

- Create: `apps/desktop/src/renderer/src/services/sse.ts`

- [ ] **Step 1: 创建 SSE 连接封装**

Create: `apps/desktop/src/renderer/src/services/sse.ts`

```typescript
/**
 * SSE 服务封装 - 类型安全的事件订阅 API
 */

export function createSSEConnection(params: { url: string; topics: string[] }) {
  let eventSource: EventSource | null = null
  const listeners = new Map<string, Set<(data: unknown) => void>>()

  const connect = () => {
    eventSource = new EventSource(params.url)

    eventSource.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data)
        const topic = event.topic || 'default'
        listeners.get(topic)?.forEach((handler) => handler(event.data))
      } catch {
        console.error('Failed to parse SSE message:', e.data)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE error:', error)
      // 自动重连逻辑
      eventSource?.close()
      setTimeout(connect, 3000)
    }
  }

  const disconnect = () => {
    eventSource?.close()
    eventSource = null
  }

  const on = <T>(topic: string, handler: (data: T) => void) => {
    if (!listeners.has(topic)) {
      listeners.set(topic, new Set())
    }
    listeners.get(topic)!.add(handler as (data: unknown) => void)
  }

  const off = (topic: string) => {
    listeners.delete(topic)
  }

  return {
    connect,
    disconnect,
    on,
    off,
  }
}

// 预定义的 SSE 连接工厂
export const sse = {
  /**
   * 创建通知 SSE 连接
   */
  createNotificationConnection: () =>
    createSSEConnection({
      url: '/api/sse/notifications',
      topics: ['notification'],
    }),

  /**
   * 创建进度 SSE 连接
   */
  createProgressConnection: () =>
    createSSEConnection({ url: '/api/sse/progress', topics: ['progress'] }),
}
```

- [ ] **Step 2: 提交**

```bash
git add apps/desktop/src/renderer/src/services/sse.ts
git commit -m "feat(renderer): add sse service"
```

---

### Task 10: 实现 websocket service

**Files:**

- Create: `apps/desktop/src/renderer/src/services/websocket.ts`

- [ ] **Step 1: 创建 WebSocket 连接封装**

Create: `apps/desktop/src/renderer/src/services/websocket.ts`

```typescript
/**
 * WebSocket 服务封装 - 类型安全的消息 API
 */

export function createWebSocketConnection(params: { url: string }) {
  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let isManualClose = false

  const listeners = new Map<string, Set<(data: unknown) => void>>()

  const connect = () => {
    ws = new WebSocket(params.url)

    ws.onopen = () => {
      console.log('WebSocket connected')
      isManualClose = false
    }

    ws.onmessage = (e) => {
      try {
        const message = JSON.parse(e.data)
        const type = message.type || 'default'
        listeners.get(type)?.forEach((handler) => handler(message.data))
      } catch {
        console.error('Failed to parse WebSocket message:', e.data)
      }
    }

    ws.onclose = () => {
      if (!isManualClose) {
        // 自动重连
        console.log('WebSocket closed, reconnecting...')
        reconnectTimer = setTimeout(connect, 3000)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }

  const disconnect = () => {
    isManualClose = true
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    ws?.close()
    ws = null
  }

  const send = (data: unknown) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data))
    }
  }

  const on = <T>(type: string, handler: (data: T) => void) => {
    if (!listeners.has(type)) {
      listeners.set(type, new Set())
    }
    listeners.get(type)!.add(handler as (data: unknown) => void)
  }

  const off = (type: string) => {
    listeners.delete(type)
  }

  return {
    connect,
    disconnect,
    send,
    on,
    off,
  }
}

// 预定义的 WebSocket 连接工厂
export const ws = {
  /**
   * 创建聊天 WebSocket 连接
   */
  createChatConnection: () =>
    createWebSocketConnection({ url: `wss://${window.location.host}/ws/chat` }),
}
```

- [ ] **Step 2: 提交**

```bash
git add apps/desktop/src/renderer/src/services/websocket.ts
git commit -m "feat(renderer): add websocket service"
```

---

## 实施检查清单

完成所有任务后，验证以下内容：

- [ ] `services/ipc.ts` 包含所有 IPC 调用
- [ ] `stores/atoms/` 包含所有全局状态
- [ ] `components/base/` 包含基础 UI 组件
- [ ] `features/` 目录结构已建立
- [ ] `useSessionStreams` hook 支持多会话流式
- [ ] `http.ts`、`sse.ts`、`websocket.ts` 已实现
- [ ] 所有导入路径已更新
- [ ] 类型定义完整
- [ ] 运行 `bunx tsc --noEmit` 无错误
- [ ] 运行 `bunx oxlint` 无错误
