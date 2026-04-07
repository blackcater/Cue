# 代码组织设计方案

## 1. 概述

### 1.1 背景

当前桌面应用项目采用类似 Feature-Sliced Design (FSD) 的代码组织方式。项目功能类似 Codex Desktop，需要支持：
- 多项目管理
- Thread（会话）管理
- Agent 集成
- Git 功能（Diff、Commit、Worktree）
- 集成终端
- MCP 支持
- Skills & Automations

### 1.2 设计目标

- **团队协作** - 多人可独立开发不同模块
- **测试友好** - 各层可独立测试
- **快速迭代** - 便于添加新功能
- **职责清晰** - 每层职责明确，边界清晰

---

## 2. 目录结构

```
src/renderer/src/
├── app/                      # 渲染进程启动
│   ├── main.tsx             # 应用入口
│   ├── providers.tsx        # 全局 Providers
│   └── router.tsx           # TanStack Router 配置
│
├── routes/                    # TanStack Router
│   ├── __root.tsx           # 根路由布局
│   ├── routeTree.gen.ts     # 自动生成的路由树
│   ├── vault/               # /vault
│   │   ├── route.ts
│   │   └── $vaultId/
│   │       ├── route.ts
│   │       ├── index.tsx    # Vault 主页面
│   │       └── thread/
│   │           └── $threadId/
│   │               ├── route.ts
│   │               └── index.tsx  # Thread 页面
│   ├── welcome/             # /welcome
│   └── chat-popup/          # /chat-popup
│
├── domain/                    # 领域模型（核心）
│   ├── models/             # 实体、值对象
│   │   ├── thread.ts
│   │   ├── project.ts
│   │   ├── agent.ts
│   │   └── message.ts
│   ├── events/             # 领域事件
│   │   └── thread.events.ts
│   └── index.ts
│
├── infrastructure/            # 技术基础设施
│   ├── ipc/               # Electron IPC 调用
│   ├── http/              # HTTP 客户端
│   ├── storage/           # 持久化（electron-store）
│   ├── query/             # React Query
│   ├── schemas/           # Zod 格式校验
│   ├── config/            # 配置
│   ├── constants/          # 常量
│   └── logger/            # 日志
│
├── services/                  # 服务层
│   ├── thread.ts           # 线程服务
│   ├── project.ts          # 项目服务
│   ├── agent.ts            # Agent 服务
│   ├── chat.ts             # 聊天服务
│   └── index.ts
│
├── features/                  # 功能模块
│   ├── chat/
│   │   ├── components/     # UI 组件
│   │   ├── hooks/         # UI 逻辑 hooks
│   │   └── stores/        # feature 私有 atom
│   │
│   ├── project/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── stores/
│   │
│   ├── thread/
│   ├── agent/
│   ├── git/
│   ├── terminal/
│   ├── settings/
│   ├── onboarding/
│   └── index.ts
│
└── shared/                   # 横切关注点
    ├── types/              # 全局类型
    ├── errors.ts           # 错误类型定义
    └── utils/              # 工具函数
```

---

## 3. 层次关系

### 3.1 单向依赖规则

```
routes/ (页面组件)
    ↓
features/ (components → hooks → stores)
    ↓
services/ (业务逻辑)
    ↓
domain/ (领域模型)
    ↑
infrastructure/ (技术实现，被调用)
```

**规则：上层可调用下层，下层不依赖上层**

### 3.2 各层职责

| 层次 | 职责 | 包含内容 |
|------|------|---------|
| **routes/** | 路由组件，组合 features | 页面布局、路由参数传递 |
| **features/components/** | UI 展示 | 渲染、用户事件、组合 hooks |
| **features/hooks/** | UI 逻辑 | 组合 atom、React Query、调用 service |
| **features/stores/** | UI 状态 | feature 私有 atom |
| **services/** | 业务逻辑 | 编排操作、规则验证、事务 |
| **domain/models/** | 领域模型 | 实体定义、值对象 |
| **infrastructure/** | 技术实现 | IPC、HTTP、Storage、React Query、Zod Schema |

---

## 4. 各层详细设计

### 4.1 Domain 层

**职责：** 定义核心领域模型，与技术实现无关

```typescript
// domain/models/thread.ts
export interface Thread {
  id: string
  vaultId: string
  title: string
  status: 'active' | 'archived'
  agentConfig: AgentConfig
  createdAt: number
  updatedAt: number
}

export interface Message {
  id: string
  threadId: string
  role: 'user' | 'assistant'
  content: string
  attachments?: Attachment[]
  timestamp: number
}

export interface CreateThreadInput {
  vaultId: string
  title?: string
  agentProvider: 'claude' | 'openai' | 'gemini'
}

export interface SendMessageInput {
  threadId: string
  content: string
}

// domain/models/project.ts
export interface Project {
  id: string
  name: string
  path: string
  config: ProjectConfig
}

// domain/models/agent.ts
export interface Agent {
  id: string
  threadId: string
  provider: 'claude' | 'openai' | 'gemini'
  status: 'idle' | 'running' | 'error'
}
```

### 4.2 Infrastructure 层

**职责：** 技术实现，数据获取入口

```typescript
// infrastructure/ipc/index.ts
export const ipcClient = {
  thread: {
    getById: (id: string) =>
      window.api.rpc.call('thread.get', { id }),
    create: (data: CreateThreadInput) =>
      window.api.rpc.call('thread.create', data),
    sendMessage: (data: SendMessageInput) =>
      window.api.rpc.call('thread.sendMessage', data),
  },
  project: {
    list: () => window.api.rpc.call('project.list'),
    getById: (id: string) => window.api.rpc.call('project.get', { id }),
  },
}

// infrastructure/schemas/thread.schemas.ts
import { z } from 'zod'

export const SendMessageSchema = z.object({
  threadId: z.string().min(1),
  content: z.string().min(1).max(10000),
})

export const CreateThreadSchema = z.object({
  vaultId: z.string().min(1),
  title: z.string().min(1).max(255).optional(),
  agentProvider: z.enum(['claude', 'openai', 'gemini']),
})
```

### 4.3 Services 层

**职责：** 业务逻辑，编排操作，规则验证

```typescript
// services/thread.ts
import { ipcClient } from '@infrastructure/ipc'
import {
  SendMessageSchema,
  CreateThreadSchema,
} from '@infrastructure/schemas'
import { AppError, ThreadNotFoundError } from '@shared/errors'

export const threadService = {
  async getThread(id: string) {
    const thread = await ipcClient.thread.getById(id)
    if (!thread) {
      throw new ThreadNotFoundError(id)
    }
    return thread
  },

  async createThread(input: unknown) {
    // 1. 格式校验
    const data = CreateThreadSchema.parse(input)

    // 2. 业务校验
    const project = await ipcClient.project.getById(data.vaultId)
    if (!project) {
      throw new AppError('Project not found', 'PROJECT_NOT_FOUND', 404)
    }

    // 3. 创建
    return ipcClient.thread.create(data)
  },

  async sendMessage(input: unknown) {
    // 1. 格式校验
    const data = SendMessageSchema.parse(input)

    // 2. 业务校验
    const thread = await this.getThread(data.threadId)
    if (thread.status === 'archived') {
      throw new AppError('Thread is archived', 'THREAD_ARCHIVED', 400)
    }

    // 3. 发送
    return ipcClient.thread.sendMessage(data)
  },
}
```

### 4.4 Features 层

**职责：** UI 组件 + UI 逻辑 hooks + feature 私有状态

```typescript
// features/chat/stores/messages.ts
import { atom } from 'jotai'
import type { Message } from '@domain/models'

export const messagesAtom = atom<Message[]>([])
export const streamingAtom = atom<'idle' | 'streaming'>('idle')

// features/chat/hooks/use-send-message.ts
import { useCallback } from 'react'
import { useAtom } from 'jotai'
import { messagesAtom, streamingAtom } from '../stores/messages'
import { threadService } from '@services/thread'

export function useSendMessage(threadId: string) {
  const [messages, setMessages] = useAtom(messagesAtom)
  const [isStreaming, setIsStreaming] = useAtom(streamingAtom)

  const send = useCallback(async (content: string) => {
    // 乐观更新
    const optimisticMessage: Message = {
      id: crypto.randomUUID(),
      threadId,
      role: 'user',
      content,
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, optimisticMessage])

    setIsStreaming(true)
    try {
      const response = await threadService.sendMessage({ threadId, content })
      setMessages(prev => [...prev, response])
    } catch (error) {
      // 错误处理
      console.error('Failed to send message:', error)
    } finally {
      setIsStreaming(false)
    }
  }, [threadId, setMessages, setIsStreaming])

  return { send, isStreaming }
}

// features/chat/components/ChatView.tsx
import { useSendMessage } from '../hooks/use-send-message'
import { MessageList } from './MessageList'
import { Composer } from './Composer'

export function ChatView({ threadId }: { threadId: string }) {
  const { send, isStreaming } = useSendMessage(threadId)

  return (
    <div>
      <MessageList />
      <Composer onSend={send} disabled={isStreaming} />
    </div>
  )
}
```

### 4.5 Routes 层

**职责：** 路由页面，组合 features 组件

```typescript
// routes/vault/$vaultId/thread/$threadId/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { ChatView } from '@features/chat/components/ChatView'

const threadRoute = createFileRoute(
  '/vault/$vaultId/thread/$threadId/'
)()

export function ThreadPage() {
  const { threadId } = threadRoute.useParams()

  return (
    <div className="flex h-full">
      <ChatView threadId={threadId} />
    </div>
  )
}
```

---

## 5. 错误处理

### 5.1 错误类型定义

```typescript
// shared/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ThreadNotFoundError extends AppError {
  constructor(threadId: string) {
    super(`Thread ${threadId} not found`, 'THREAD_NOT_FOUND', 404)
  }
}

export class NetworkError extends AppError {
  constructor() {
    super('Network error', 'NETWORK_ERROR', 0)
  }
}
```

### 5.2 错误处理流程

```
Service 抛出 Typed Error
    ↓
React Query onError 捕获
    ↓
显示错误 UI
```

### 5.3 Hook 中的错误处理

```typescript
// features/thread/hooks/use-thread.ts
import { useQuery } from '@tanstack/react-query'
import { threadService } from '@services/thread'

export function useThread(threadId: string) {
  return useQuery({
    queryKey: ['thread', threadId],
    queryFn: () => threadService.getThread(threadId),
    enabled: !!threadId,
    retry: (failureCount, error) => {
      // 网络错误重试，业务错误不重试
      if (error instanceof NetworkError) {
        return failureCount < 3
      }
      return false
    },
  })
}

// features/chat/components/ChatView.tsx
export function ChatView({ threadId }: { threadId: string }) {
  const { data: thread, isError, error } = useThread(threadId)

  if (isError) {
    return <ErrorMessage error={error} />
  }

  // ...
}
```

---

## 6. 跨服务依赖

### 6.1 服务依赖关系

| 服务 | 依赖 | 说明 |
|------|------|------|
| **Thread** | Project, Agent | 核心服务，可调用其他 |
| **Chat** | Thread | 依赖 Thread |
| **Project** | - | 无跨服务依赖 |
| **Agent** | - | 无跨服务依赖 |

### 6.2 依赖规则

**核心服务（Thread）可调用其他服务，其他服务只能调用核心服务**

```typescript
// services/thread.ts
import { projectService } from './project'
import { agentService } from './agent'

export const threadService = {
  async createThread(input: CreateThreadInput) {
    // 验证项目（跨服务）
    const project = await projectService.getProject(input.vaultId)

    // 创建线程
    const thread = await ipcClient.thread.create(input)

    // 初始化 Agent（跨服务）
    await agentService.createAgent({ threadId: thread.id })

    return thread
  },
}

// services/chat.ts
export const chatService = {
  async sendMessage(input: SendMessageInput) {
    // Chat 不直接调用 project/agent，只调用 thread
    return threadService.sendMessage(input)
  },
}
```

---

## 7. React Query 使用

### 7.1 Query Provider 设置

```typescript
// infrastructure/query/provider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 分钟
      retry: 2,
    },
  },
})
```

### 7.2 React Query + Service

```typescript
// features/project/hooks/use-projects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectService } from '@services/project'

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.listProjects(),
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: CreateProjectInput) =>
      projectService.createProject(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
```

---

## 8. 导入路径约定

```typescript
// tsconfig paths
{
  "compilerOptions": {
    "paths": {
      "@renderer/*": ["./src/*"],
      "@domain/*": ["./src/domain/*"],
      "@infrastructure/*": ["./src/infrastructure/*"],
      "@services/*": ["./src/services/*"],
      "@features/*": ["./src/features/*"],
      "@shared/*": ["./src/shared/*"]
    }
  }
}
```

```typescript
// 使用示例
import type { Thread } from '@domain/models'          // Domain
import { ipcClient } from '@infrastructure/ipc'      // Infrastructure
import { threadService } from '@services/thread'     // Service
import { useSendMessage } from '@features/chat/hooks' // Feature Hooks
import { Button } from '@acme-ai/ui'                 // UI 组件库
```

---

## 9. 迁移计划

### 阶段一：创建目录结构

```
src/renderer/src/
├── domain/           # 新建
├── infrastructure/   # 新建
├── services/         # 新建
└── features/        # 调整现有
```

### 阶段二：迁移 Domain 模型

- 创建 `domain/models/` 下的实体定义
- 迁移相关类型定义到 domain

### 阶段三：创建 Infrastructure 层

- 创建 `infrastructure/ipc/`
- 创建 `infrastructure/schemas/`
- 设置 React Query Provider

### 阶段四：创建 Services 层

- 创建 `services/thread.ts`
- 创建 `services/project.ts`
- 迁移业务逻辑到 services

### 阶段五：调整 Features 层

- 清理 components/hooks/stores
- 让 hooks 调用 services 而不是直接调用 IPC

---

## 10. 总结

| 层次 | 核心职责 | 可测试性 |
|------|---------|---------|
| **domain/** | 领域模型 | ✅ 纯数据，无依赖 |
| **infrastructure/** | 技术实现 | ✅ Mock IPC |
| **services/** | 业务逻辑 | ✅ Mock infrastructure |
| **features/hooks/** | UI 逻辑 | ⚠️ 需要 React Testing Library |
| **features/components/** | UI 展示 | ⚠️ 需要 React Testing Library |
| **routes/** | 路由组合 | ✅ 可独立测试 |
