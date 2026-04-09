# AI Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multi-engine AI chat system with full session lifecycle, part-based message rendering, and distributed permission approval.

**Architecture:** Engine-driven architecture (Harnss-style) with unified EngineHookState interface. Main process handles Engine bridges and storage; Renderer handles UI and session state management. RPC layer connects them bidirectionally.

**Tech Stack:** Electron, React 19, TypeScript, Jotai (atoms), TanStack Router, TailwindCSS, @hugeicons/react

---

## File Structure

```
apps/desktop/src/
├── main/handlers/
│   ├── chat/
│   │   ├── index.ts              # Handler registration
│   │   ├── chat-handler.ts      # Main chat RPC handlers
│   │   ├── chat.schema.ts       # Request/response types
│   │   ├── permission-handler.ts # Permission RPC handlers
│   │   └── permission.schema.ts
│   ├── engines/
│   │   ├── index.ts             # Engine registry
│   │   ├── engine-bridge.ts      # EngineBridge interface
│   │   ├── engine-types.ts       # Shared engine types
│   │   └── mock-engine.ts        # Mock engine for Phase 1-2
│   └── session-store/
│       ├── index.ts
│       ├── session-store.ts      # SessionStore interface
│       └── jsonl-session-store.ts # JSONL implementation
├── shared/
│   └── types/
│       └── chat.ts               # Shared chat types (Message, Part, Turn, Session)
└── renderer/src/
    ├── atoms/
    │   └── chat-atoms.ts         # Chat-specific atoms
    ├── hooks/
    │   ├── useChatSession.ts     # Session management hook
    │   └── useEngine.ts          # Engine communication hook
    ├── components/chat/
    │   ├── panel/                # Chat panel components
    │   │   ├── ChatPanel.tsx     # Main container
    │   │   ├── MessageList.tsx   # Virtual scrolling list
    │   │   ├── Turn.tsx          # Single turn rendering
    │   │   ├── UserMessage.tsx
    │   │   ├── AssistantParts.tsx
    │   │   ├── Part.tsx          # Part dispatcher
    │   │   ├── TextPart.tsx
    │   │   ├── ToolCard.tsx
    │   │   ├── ToolCardContent.tsx
    │   │   ├── ContextToolGroup.tsx
    │   │   ├── ReasoningPart.tsx
    │   │   ├── CompactionPart.tsx
    │   │   ├── DiffView.tsx
    │   │   ├── PermissionDialog.tsx
    │   │   ├── PermissionRequest.tsx
    │   │   ├── ThinkingIndicator.tsx
    │   │   ├── InputBar.tsx
    │   │   └── index.ts
    │   └── sidebar/
    │       ├── SessionList.tsx
    │       ├── SessionItem.tsx
    │       └── NewSessionButton.tsx
    └── pages/
        └── chat.tsx              # Chat page route
```

---

## Phase 1: Core Framework

### Task 1: Shared Types Definition

**Files:**
- Create: `apps/desktop/src/shared/types/chat.ts`
- Modify: `apps/desktop/src/shared/types/index.ts`

- [ ] **Step 1: Create shared chat types**

```typescript
// apps/desktop/src/shared/types/chat.ts

export type PartType = 'text' | 'tool' | 'reasoning' | 'compaction' | 'file' | 'agent'

export interface TextPart {
  type: 'text'
  text: string
}

export interface ToolPart {
  type: 'tool'
  tool: string
  toolCallId: string
  input: Record<string, unknown>
  output?: string
  status: 'pending' | 'running' | 'completed' | 'error'
  error?: string
}

export interface ReasoningPart {
  type: 'reasoning'
  text: string
  summary?: string
}

export interface CompactionPart {
  type: 'compaction'
  message: string
}

export interface FilePart {
  type: 'file'
  path: string
  mimeType?: string
  data?: string
}

export interface AgentPart {
  type: 'agent'
  name: string
}

export type Part = TextPart | ToolPart | ReasoningPart | CompactionPart | FilePart | AgentPart

export interface Message {
  id: string
  role: 'user' | 'assistant'
  parts: Part[]
  timestamp: number
}

export interface Turn {
  id: string
  userMessage: Message
  assistantParts: Part[]
  status: 'in_progress' | 'completed' | 'interrupted' | 'error'
  diffs?: FileDiff[]
  tokenUsage?: TokenUsage
}

export interface FileDiff {
  path: string
  before: string
  after: string
  status: 'created' | 'modified' | 'deleted'
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

export type EngineType = 'claude' | 'codex' | 'acp' | 'mock'

export interface Session {
  id: string
  name?: string
  engineType: EngineType
  engineConfig: EngineConfig
  status: 'active' | 'archived'
  createdAt: number
  updatedAt: number
  turns: Turn[]
}

export interface SessionSummary {
  id: string
  name?: string
  engineType: EngineType
  status: 'active' | 'archived'
  createdAt: number
  updatedAt: number
  turnCount: number
  preview?: string
}

export interface EngineConfig {
  model?: string
  apiKey?: string
  baseUrl?: string
  [key: string]: unknown
}

export interface PermissionRequest {
  requestId: string
  tool: string
  params: Record<string, unknown>
  patterns: string[]
  alwaysPatterns: string[]
  metadata?: Record<string, unknown>
}

export interface StreamDelta {
  type: 'text' | 'tool_start' | 'tool_end' | 'reasoning' | 'compaction' | 'turn_complete' | 'error'
  data: unknown
  turnId?: string
  partId?: string
}
```

- [ ] **Step 2: Export from shared types index**

```typescript
// apps/desktop/src/shared/types/index.ts (add export)
export * from './chat'
```

- [ ] **Step 3: Commit**

```bash
git add apps/desktop/src/shared/types/chat.ts apps/desktop/src/shared/types/index.ts
git commit -m "feat(chat): add shared chat types - Message, Part, Turn, Session"
```

---

### Task 2: SessionStore Interface + JSONL Implementation

**Files:**
- Create: `apps/desktop/src/main/handlers/session-store/index.ts`
- Create: `apps/desktop/src/main/handlers/session-store/session-store.ts`
- Create: `apps/desktop/src/main/handlers/session-store/jsonl-session-store.ts`

- [ ] **Step 1: Create SessionStore interface**

```typescript
// apps/desktop/src/main/handlers/session-store/session-store.ts
import type { Session, SessionSummary, Turn, EngineType } from '@shared/types'

export interface SessionStore {
  // CRUD
  create(session: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>): Promise<Session>
  get(id: string): Promise<Session | null>
  list(filter?: { engineType?: EngineType; status?: string }): Promise<SessionSummary[]>
  update(id: string, patch: Partial<Session>): Promise<void>
  delete(id: string): Promise<void>

  // Lifecycle
  fork(baseId: string, fromTurnId?: string): Promise<Session>
  archive(id: string): Promise<void>
  unarchive(id: string): Promise<void>
  rollback(id: string, turnCount: number): Promise<void>

  // Turn operations
  addTurn(sessionId: string, turn: Turn): Promise<void>
  updateTurn(sessionId: string, turnId: string, patch: Partial<Turn>): Promise<void>
  getTurn(sessionId: string, turnId: string): Promise<Turn | null>
}
```

- [ ] **Step 2: Create JsonlSessionStore implementation**

```typescript
// apps/desktop/src/main/handlers/session-store/jsonl-session-store.ts
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { randomUUID } from 'node:crypto'

import type { Session, SessionSummary, Turn, EngineType, EngineConfig } from '@shared/types'
import type { SessionStore } from './session-store'

export class JsonlSessionStore implements SessionStore {
  constructor(private baseDir: string) {}

  private sessionDir(id: string): string {
    return path.join(this.baseDir, id)
  }

  async create(sessionData): Promise<Session> {
    const id = randomUUID()
    const now = Date.now()
    const session: Session = {
      ...sessionData,
      id,
      createdAt: now,
      updatedAt: now,
      turns: [],
    }

    const dir = this.sessionDir(id)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(path.join(dir, 'meta.json'), JSON.stringify(session))
    await fs.writeFile(path.join(dir, 'turns.jsonl'), '')

    return session
  }

  async get(id: string): Promise<Session | null> {
    const metaPath = path.join(this.sessionDir(id), 'meta.json')
    try {
      const content = await fs.readFile(metaPath, 'utf-8')
      return JSON.parse(content) as Session
    } catch {
      return null
    }
  }

  async list(filter?: { engineType?: EngineType; status?: string }): Promise<SessionSummary[]> {
    const entries = await fs.readdir(this.baseDir).catch(() => [])
    const summaries: SessionSummary[] = []

    for (const id of entries) {
      const session = await this.get(id)
      if (!session) continue
      if (filter?.engineType && session.engineType !== filter.engineType) continue
      if (filter?.status && session.status !== filter.status) continue

      summaries.push({
        id: session.id,
        name: session.name,
        engineType: session.engineType,
        status: session.status,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        turnCount: session.turns.length,
        preview: session.turns[0]?.userMessage?.parts[0]?.type === 'text'
          ? (session.turns[0].userMessage.parts[0] as any).text.substring(0, 50)
          : undefined,
      })
    }

    return summaries.sort((a, b) => b.updatedAt - a.updatedAt)
  }

  async update(id: string, patch: Partial<Session>): Promise<void> {
    const session = await this.get(id)
    if (!session) throw new Error(`Session not found: ${id}`)

    const updated = { ...session, ...patch, updatedAt: Date.now() }
    await fs.writeFile(
      path.join(this.sessionDir(id), 'meta.json'),
      JSON.stringify(updated)
    )
  }

  async delete(id: string): Promise<void> {
    await fs.rm(this.sessionDir(id), { recursive: true, force: true })
  }

  async fork(baseId: string, fromTurnId?: string): Promise<Session> {
    const base = await this.get(baseId)
    if (!base) throw new Error(`Session not found: ${baseId}`)

    const turns = fromTurnId
      ? base.turns.slice(0, base.turns.findIndex(t => t.id === fromTurnId) + 1)
      : [...base.turns]

    return this.create({
      engineType: base.engineType,
      engineConfig: base.engineConfig,
      status: 'active',
      name: base.name ? `${base.name} (fork)` : undefined,
      turns,
    })
  }

  async archive(id: string): Promise<void> {
    await this.update(id, { status: 'archived' })
  }

  async unarchive(id: string): Promise<void> {
    await this.update(id, { status: 'active' })
  }

  async rollback(id: string, turnCount: number): Promise<void> {
    const session = await this.get(id)
    if (!session) throw new Error(`Session not found: ${id}`)

    const newTurns = session.turns.slice(0, -turnCount)
    await this.update(id, { turns: newTurns })
  }

  async addTurn(sessionId: string, turn: Turn): Promise<void> {
    const turnsPath = path.join(this.sessionDir(sessionId), 'turns.jsonl')
    await fs.appendFile(turnsPath, JSON.stringify(turn) + '\n')

    const session = await this.get(sessionId)
    if (session) {
      await this.update(sessionId, {
        turns: [...session.turns, turn],
      })
    }
  }

  async updateTurn(sessionId: string, turnId: string, patch: Partial<Turn>): Promise<void> {
    const session = await this.get(sessionId)
    if (!session) throw new Error(`Session not found: ${sessionId}`)

    const newTurns = session.turns.map(t =>
      t.id === turnId ? { ...t, ...patch } : t
    )
    await this.update(sessionId, { turns: newTurns })
  }

  async getTurn(sessionId: string, turnId: string): Promise<Turn | null> {
    const session = await this.get(sessionId)
    return session?.turns.find(t => t.id === turnId) ?? null
  }
}
```

- [ ] **Step 3: Create index with DI registration**

```typescript
// apps/desktop/src/main/handlers/session-store/index.ts
import { Container } from '@/shared/di'
import { JsonlSessionStore } from './jsonl-session-store'
import type { SessionStore } from './session-store'

// Register SessionStore as singleton
const userDataDir = process.env.APPDATA || process.env.HOME
const sessionStore = new JsonlSessionStore(
  path.join(userDataDir, 'sessions')
)

Container.register(SessionStore, { useValue: sessionStore })

export type { SessionStore } from './session-store'
export { JsonlSessionStore }
```

- [ ] **Step 4: Commit**

```bash
git add apps/desktop/src/main/handlers/session-store/
git commit -m "feat(chat): add SessionStore interface and JSONL implementation"
```

---

### Task 3: EngineBridge Interface

**Files:**
- Create: `apps/desktop/src/main/handlers/engines/index.ts`
- Create: `apps/desktop/src/main/handlers/engines/engine-types.ts`
- Create: `apps/desktop/src/main/handlers/engines/engine-bridge.ts`

- [ ] **Step 1: Create engine types**

```typescript
// apps/desktop/src/main/handlers/engines/engine-types.ts
import type { CancelFn } from '@/shared/rpc'
import type { Session, Turn, PermissionRequest, StreamDelta, EngineConfig } from '@shared/types'

export type EngineStatus = 'idle' | 'processing' | 'error' | 'waiting_permission'

export interface EngineState {
  sessionId: string
  status: EngineStatus
  error?: string
  currentTurn?: Turn
}

export interface EngineEvent {
  type: 'status_change' | 'delta' | 'permission_request' | 'turn_complete' | 'error'
  sessionId: string
  data: unknown
}

export type EngineEventListener = (event: EngineEvent) => void

export interface EngineBridge {
  readonly engineType: string

  initialize(config: EngineConfig): Promise<void>
  destroy(): void

  createSession(config: EngineConfig): Promise<string>
  closeSession(sessionId: string): Promise<void>

  send(sessionId: string, input: string): Promise<void>
  interrupt(sessionId: string): Promise<void>

  respondPermission(requestId: string, approved: boolean, alwaysPattern?: string): Promise<void>

  onEvent(listener: EngineEventListener): CancelFn
}
```

- [ ] **Step 2: Create EngineBridge interface + MockEngine**

```typescript
// apps/desktop/src/main/handlers/engines/engine-bridge.ts
import type { EngineBridge, EngineEvent, EngineEventListener, EngineState } from './engine-types'
import type { PermissionRequest, StreamDelta, EngineConfig } from '@shared/types'
import type { CancelFn } from '@/shared/rpc'

export interface EngineBridgeClass {
  new (): EngineBridge
}

export const engineRegistry: Map<string, EngineBridgeClass> = new Map()

export function registerEngine(type: string, cls: EngineBridgeClass): void {
  engineRegistry.set(type, cls)
}

// MockEngine for testing without real AI
export class MockEngine implements EngineBridge {
  readonly engineType = 'mock'
  private listeners: Set<EngineEventListener> = new Set()
  private sessions: Map<string, boolean> = new Map()
  private pendingPermissions: Map<string, PermissionRequest> = new Map()

  async initialize(_config: EngineConfig): Promise<void> {
    console.log('[MockEngine] initialized')
  }

  destroy(): void {
    this.listeners.clear()
    this.sessions.clear()
  }

  async createSession(config: EngineConfig): Promise<string> {
    const sessionId = `mock-${Date.now()}`
    this.sessions.set(sessionId, false)
    return sessionId
  }

  async closeSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId)
  }

  async send(sessionId: string, input: string): Promise<void> {
    if (!this.sessions.has(sessionId)) return

    // Simulate typing delay
    await new Promise(r => setTimeout(r, 500))

    // Emit text delta
    this.emit({
      type: 'delta',
      sessionId,
      data: { type: 'text', text: `Mock response to: ${input}` } as StreamDelta,
    })

    // Simulate permission request for "dangerous" commands
    if (input.toLowerCase().includes('rm') || input.toLowerCase().includes('delete')) {
      const reqId = `perm-${Date.now()}`
      const request: PermissionRequest = {
        requestId: reqId,
        tool: 'bash',
        params: { command: input },
        patterns: ['*'],
        alwaysPatterns: [],
      }
      this.pendingPermissions.set(reqId, request)
      this.emit({
        type: 'permission_request',
        sessionId,
        data: request,
      })
      return
    }

    // Complete turn
    this.emit({
      type: 'turn_complete',
      sessionId,
      data: {},
    })
  }

  async interrupt(sessionId: string): Promise<void> {
    this.emit({ type: 'status_change', sessionId, data: { status: 'idle' } })
  }

  async respondPermission(
    requestId: string,
    approved: boolean,
    _alwaysPattern?: string
  ): Promise<void> {
    const request = this.pendingPermissions.get(requestId)
    if (!request) return

    this.pendingPermissions.delete(requestId)

    if (approved) {
      this.emit({
        type: 'delta',
        sessionId: '',
        data: { type: 'text', text: `[Approved] Executed: ${(request.params as any).command}` } as StreamDelta,
      })
      this.emit({ type: 'turn_complete', sessionId: '', data: {} })
    } else {
      this.emit({
        type: 'error',
        sessionId: '',
        data: { message: 'Permission denied' },
      })
    }
  }

  onEvent(listener: EngineEventListener): CancelFn {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(event: EngineEvent): void {
    for (const listener of this.listeners) {
      listener(event)
    }
  }
}

// Register MockEngine
registerEngine('mock', MockEngine)
```

- [ ] **Step 3: Create index with engine registry**

```typescript
// apps/desktop/src/main/handlers/engines/index.ts
export * from './engine-types'
export * from './engine-bridge'

import { MockEngine } from './engine-bridge'

// Register built-in engines
export function registerBuiltinEngines(): void {
  // MockEngine is registered in engine-bridge.ts
  // Real engines (Claude, Codex, ACP) will be added in Phase 4
}

registerBuiltinEngines()
```

- [ ] **Step 4: Commit**

```bash
git add apps/desktop/src/main/handlers/engines/
git commit -m "feat(chat): add EngineBridge interface and MockEngine"
```

---

### Task 4: RPC Handlers Registration

**Files:**
- Create: `apps/desktop/src/main/handlers/chat/chat-handler.ts`
- Create: `apps/desktop/src/main/handlers/chat/chat.schema.ts`
- Create: `apps/desktop/src/main/handlers/chat/permission-handler.ts`
- Create: `apps/desktop/src/main/handlers/chat/permission.schema.ts`
- Create: `apps/desktop/src/main/handlers/chat/index.ts`
- Modify: `apps/desktop/src/main/handlers/index.ts`

- [ ] **Step 1: Create chat schema types**

```typescript
// apps/desktop/src/main/handlers/chat/chat.schema.ts
import type { StandardSchemaV1 } from '@standard-schema/spec'

export const createSessionSchema = {
  '~standard': {
    version: 1,
    validate: (args: unknown[]) => {
      const [engineType, engineConfig] = args as [string, Record<string, unknown>]
      if (typeof engineType !== 'string') {
        return { issues: [{ message: 'engineType must be string' }] }
      }
      return { value: [engineType, engineConfig] }
    },
  } as StandardSchemaV1,
}

export const sendMessageSchema = {
  '~standard': {
    version: 1,
    validate: (args: unknown[]) => {
      const [sessionId, input] = args as [string, string]
      if (typeof sessionId !== 'string' || typeof input !== 'string') {
        return { issues: [{ message: 'sessionId and input must be string' }] }
      }
      return { value: [sessionId, input] }
    },
  } as StandardSchemaV1,
}
```

- [ ] **Step 2: Create chat handler**

```typescript
// apps/desktop/src/main/handlers/chat/chat-handler.ts
import { ElectronRpcServer } from '@shared/rpc/electron'
import { engineRegistry, type EngineBridge, type EngineEvent } from '@main/handlers/engines'
import { Container } from '@shared/di'
import type { SessionStore } from '@main/handlers/session-store'
import type { Session, Turn, StreamDelta } from '@shared/types'

export class ChatHandler {
  private engines: Map<string, EngineBridge> = new Map()
  private rpcServer: ElectronRpcServer
  private sessionStore: SessionStore

  constructor() {
    this.rpcServer = Container.inject(ElectronRpcServer)
    this.sessionStore = Container.inject(SessionStore)
  }

  register(): void {
    // Session management
    this.rpcServer.handle('/chat/session/create', async (engineType, engineConfig) => {
      const EngineClass = engineRegistry.get(engineType as string)
      if (!EngineClass) throw new Error(`Unknown engine: ${engineType}`)

      const engine = new EngineClass()
      await engine.initialize(engineConfig as any)

      const sessionId = await engine.createSession(engineConfig as any)
      this.engines.set(sessionId, engine)

      const session = await this.sessionStore.create({
        engineType: engineType as any,
        engineConfig: engineConfig as any,
        status: 'active',
        turns: [],
      })

      // Listen to engine events
      engine.onEvent((event: EngineEvent) => {
        this.handleEngineEvent(sessionId, event)
      })

      return { sessionId: session.id, session }
    })

    this.rpcServer.handle('/chat/session/list', async (filter) => {
      return this.sessionStore.list(filter)
    })

    this.rpcServer.handle('/chat/session/get', async (sessionId) => {
      return this.sessionStore.get(sessionId)
    })

    this.rpcServer.handle('/chat/session/delete', async (sessionId) => {
      const engine = this.engines.get(sessionId)
      if (engine) {
        await engine.closeSession(sessionId)
        this.engines.delete(sessionId)
      }
      return this.sessionStore.delete(sessionId)
    })

    this.rpcServer.handle('/chat/session/fork', async (sessionId, fromTurnId) => {
      return this.sessionStore.fork(sessionId, fromTurnId)
    })

    this.rpcServer.handle('/chat/session/archive', async (sessionId) => {
      return this.sessionStore.archive(sessionId)
    })

    this.rpcServer.handle('/chat/session/rollback', async (sessionId, turnCount) => {
      return this.sessionStore.rollback(sessionId, turnCount)
    })

    // Messaging
    this.rpcServer.handle('/chat/send', async (sessionId, input) => {
      const engine = this.engines.get(sessionId)
      if (!engine) throw new Error(`No engine for session: ${sessionId}`)

      // Create new turn
      const turnId = `turn-${Date.now()}`
      const userMessage = {
        id: `msg-${Date.now()}`,
        role: 'user' as const,
        parts: [{ type: 'text' as const, text: input }],
        timestamp: Date.now(),
      }

      const turn = {
        id: turnId,
        userMessage,
        assistantParts: [],
        status: 'in_progress' as const,
      }

      await this.sessionStore.addTurn(sessionId, turn)

      // Send to engine
      await engine.send(sessionId, input)

      return { turnId }
    })

    this.rpcServer.handle('/chat/interrupt', async (sessionId) => {
      const engine = this.engines.get(sessionId)
      if (engine) await engine.interrupt(sessionId)
    })
  }

  private handleEngineEvent(sessionId: string, event: EngineEvent): void {
    switch (event.type) {
      case 'delta':
        this.rpcServer.push('chat:delta', { type: 'broadcast', sessionId }, event.data)
        break
      case 'permission_request':
        this.rpcServer.push('chat:permission', { type: 'broadcast', sessionId }, event.data)
        break
      case 'turn_complete':
        this.rpcServer.push('chat:turn_complete', { type: 'broadcast', sessionId }, {})
        break
      case 'error':
        this.rpcServer.push('chat:error', { type: 'broadcast', sessionId }, event.data)
        break
    }
  }
}
```

- [ ] **Step 3: Create permission handler**

```typescript
// apps/desktop/src/main/handlers/chat/permission-handler.ts
import { ElectronRpcServer } from '@shared/rpc/electron'
import { Container } from '@shared/di'
import type { EngineBridge } from '@main/handlers/engines'

export class PermissionHandler {
  private engines: Map<string, EngineBridge> = new Map()

  constructor() {
    // Note: engines are managed by ChatHandler, we need to share state
  }

  setEngine(sessionId: string, engine: EngineBridge): void {
    this.engines.set(sessionId, engine)
  }

  register(): void {
    const server = Container.inject(ElectronRpcServer)

    server.handle('/chat/permission/respond', async (requestId, approved, alwaysPattern, sessionId) => {
      // Find engine with pending permission
      for (const [_sessionId, engine] of this.engines) {
        // In real implementation, we'd track permissions per session
        await engine.respondPermission(requestId, approved, alwaysPattern)
        break
      }
      return { success: true }
    })
  }
}
```

- [ ] **Step 4: Create chat index and register handlers**

```typescript
// apps/desktop/src/main/handlers/chat/index.ts
import { ChatHandler } from './chat-handler'
import { PermissionHandler } from './permission-handler'

export function registerChatHandlers(): void {
  const chatHandler = new ChatHandler()
  chatHandler.register()

  const permissionHandler = new PermissionHandler()
  permissionHandler.register()
}

export { ChatHandler } from './chat-handler'
export { PermissionHandler } from './permission-handler'
```

- [ ] **Step 5: Modify main handler index**

```typescript
// apps/desktop/src/main/handlers/index.ts (add)
import { registerChatHandlers } from './chat'

export function registerHandlers(): void {
  registerSystemHandlers()
  FilesHandler.registerHandlers()
  GitHandler.registerHandlers()
  BrowserHandler.registerHandlers()
  registerChatHandlers() // Add this
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/desktop/src/main/handlers/chat/ apps/desktop/src/main/handlers/index.ts
git commit -m "feat(chat): add RPC handlers for chat and permissions"
```

---

### Task 5: Chat Atoms (Renderer State)

**Files:**
- Create: `apps/desktop/src/renderer/src/atoms/chat-atoms.ts`
- Modify: `apps/desktop/src/renderer/src/atoms/index.ts`

- [ ] **Step 1: Create chat atoms**

```typescript
// apps/desktop/src/renderer/src/atoms/chat-atoms.ts
import { atom } from 'jotai'
import { atomFamily } from 'jotai-family'
import type { Session, Turn, Part, PermissionRequest } from '@shared/types'

// Session atoms
export const chatSessionAtomFamily = atomFamily(
  (_sessionId: string) => atom<Session | null>(null),
  (a, b) => a === b
)

export const chatSessionIdsAtom = atom<string[]>([])

export const chatActiveSessionIdAtom = atom<string | null>(null)

export const chatActiveSessionAtom = atom((get) => {
  const id = get(chatActiveSessionIdAtom)
  if (!id) return null
  return get(chatSessionAtomFamily(id))
})

// Permission state
export const pendingPermissionAtom = atom<PermissionRequest | null>(null)

export const permissionDialogOpenAtom = atom(false)

// UI State
export const isProcessingAtom = atom(false)

export const streamingContentAtom = atom<Map<string, string>>(new Map())

// Actions
export const appendTurnAtom = atom(
  null,
  (get, set, sessionId: string, turn: Turn) => {
    const sessionAtom = chatSessionAtomFamily(sessionId)
    const session = get(sessionAtom)
    if (session) {
      set(sessionAtom, {
        ...session,
        turns: [...session.turns, turn],
      })
    }
  }
)

export const updateTurnAtom = atom(
  null,
  (get, set, sessionId: string, turnId: string, patch: Partial<Turn>) => {
    const sessionAtom = chatSessionAtomFamily(sessionId)
    const session = get(sessionAtom)
    if (session) {
      const newTurns = session.turns.map(t =>
        t.id === turnId ? { ...t, ...patch } : t
      )
      set(sessionAtom, { ...session, turns: newTurns })
    }
  }
)

export const appendPartAtom = atom(
  null,
  (get, set, sessionId: string, turnId: string, part: Part) => {
    const sessionAtom = chatSessionAtomFamily(sessionId)
    const session = get(sessionAtom)
    if (session) {
      const newTurns = session.turns.map(t => {
        if (t.id === turnId) {
          return { ...t, assistantParts: [...t.assistantParts, part] }
        }
        return t
      })
      set(sessionAtom, { ...session, turns: newTurns })
    }
  }
)
```

- [ ] **Step 2: Update atoms index**

```typescript
// apps/desktop/src/renderer/src/atoms/index.ts (add export)
export * from './chat-atoms'
```

- [ ] **Step 3: Commit**

```bash
git add apps/desktop/src/renderer/src/atoms/chat-atoms.ts apps/desktop/src/renderer/src/atoms/index.ts
git commit -m "feat(chat): add chat atoms for session state management"
```

---

### Task 6: useChatSession Hook

**Files:**
- Create: `apps/desktop/src/renderer/src/hooks/useChatSession.ts`
- Modify: `apps/desktop/src/renderer/src/hooks/index.ts` (add export)

- [ ] **Step 1: Create useChatSession hook**

```typescript
// apps/desktop/src/renderer/src/hooks/useChatSession.ts
import { useCallback, useEffect } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  chatSessionIdsAtom,
  chatActiveSessionIdAtom,
  chatActiveSessionAtom,
  chatSessionAtomFamily,
  appendTurnAtom,
  updateTurnAtom,
  isProcessingAtom,
  pendingPermissionAtom,
  permissionDialogOpenAtom,
} from '@renderer/atoms/chat-atoms'
import type { Session, Turn, StreamDelta, PermissionRequest } from '@shared/types'

declare global {
  interface Window {
    api: {
      chat: {
        session: {
          create: (engineType: string, config?: Record<string, unknown>) => Promise<{ sessionId: string; session: Session }>
          list: (filter?: Record<string, string>) => Promise<Session[]>
          get: (sessionId: string) => Promise<Session | null>
          delete: (sessionId: string) => Promise<void>
          fork: (sessionId: string, fromTurnId?: string) => Promise<Session>
          archive: (sessionId: string) => Promise<void>
          rollback: (sessionId: string, turnCount: number) => Promise<void>
        }
        send: (sessionId: string, input: string) => Promise<{ turnId: string }>
        interrupt: (sessionId: string) => Promise<void>
        permission: {
          respond: (requestId: string, approved: boolean, alwaysPattern?: string) => Promise<void>
        }
      }
      rpc: {
        onEvent: (event: string, listener: (...args: unknown[]) => void) => () => void
        call: <T>(event: string, ...args: unknown[]) => Promise<T>
      }
    }
  }
}

export function useChatSession() {
  const [sessionIds, setSessionIds] = useAtom(chatSessionIdsAtom)
  const [activeId, setActiveId] = useAtom(chatActiveSessionIdAtom)
  const activeSession = useAtomValue(chatActiveSessionAtom)
  const appendTurn = useSetAtom(appendTurnAtom)
  const updateTurn = useSetAtom(updateTurnAtom)
  const [isProcessing, setIsProcessing] = useAtom(isProcessingAtom)
  const [pendingPermission, setPendingPermission] = useAtom(pendingPermissionAtom)
  const setPermissionDialogOpen = useSetAtom(permissionDialogOpenAtom)

  // Load sessions on mount
  useEffect(() => {
    window.api.chat.session.list().then((sessions) => {
      setSessionIds(sessions.map(s => s.id))
    })
  }, [setSessionIds])

  // Subscribe to RPC events
  useEffect(() => {
    const unsubDelta = window.api.rpc.onEvent('chat:delta', (data: unknown) => {
      const delta = data as StreamDelta
      // Handle delta based on type
      console.log('[chat:delta]', delta)
    })

    const unsubPermission = window.api.rpc.onEvent('chat:permission', (data: unknown) => {
      const request = data as PermissionRequest
      setPendingPermission(request)
      setPermissionDialogOpen(true)
      setIsProcessing(false)
    })

    const unsubTurnComplete = window.api.rpc.onEvent('chat:turn_complete', () => {
      setIsProcessing(false)
    })

    return () => {
      unsubDelta()
      unsubPermission()
      unsubTurnComplete()
    }
  }, [setPendingPermission, setPermissionDialogOpen, setIsProcessing])

  const createSession = useCallback(async (engineType: string = 'mock', config?: Record<string, unknown>) => {
    const { sessionId, session } = await window.api.chat.session.create(engineType, config)
    setSessionIds(prev => [...prev, sessionId])
    setActiveId(sessionId)
    return session
  }, [setSessionIds, setActiveId])

  const switchSession = useCallback((sessionId: string) => {
    setActiveId(sessionId)
  }, [setActiveId])

  const deleteSession = useCallback(async (sessionId: string) => {
    await window.api.chat.session.delete(sessionId)
    setSessionIds(prev => prev.filter(id => id !== sessionId))
    if (activeId === sessionId) {
      setActiveId(sessionIds[0] ?? null)
    }
  }, [activeId, sessionIds, setSessionIds, setActiveId])

  const sendMessage = useCallback(async (input: string) => {
    if (!activeId) return
    setIsProcessing(true)
    try {
      await window.api.chat.send(activeId, input)
    } catch (error) {
      console.error('[sendMessage error]', error)
      setIsProcessing(false)
    }
  }, [activeId, setIsProcessing])

  const interrupt = useCallback(async () => {
    if (!activeId) return
    await window.api.chat.interrupt(activeId)
    setIsProcessing(false)
  }, [activeId, setIsProcessing])

  const respondPermission = useCallback(async (approved: boolean, alwaysPattern?: string) => {
    if (!pendingPermission) return
    await window.api.chat.permission.respond(pendingPermission.requestId, approved, alwaysPattern)
    setPermissionDialogOpen(false)
    setPendingPermission(null)
  }, [pendingPermission, setPermissionDialogOpen, setPendingPermission])

  return {
    sessionIds,
    activeId,
    activeSession,
    isProcessing,
    pendingPermission,
    createSession,
    switchSession,
    deleteSession,
    sendMessage,
    interrupt,
    respondPermission,
  }
}
```

- [ ] **Step 2: Update hooks index**

```typescript
// apps/desktop/src/renderer/src/hooks/index.ts (add)
export { useChatSession } from './useChatSession'
```

- [ ] **Step 3: Commit**

```bash
git add apps/desktop/src/renderer/src/hooks/useChatSession.ts apps/desktop/src/renderer/src/hooks/index.ts
git commit -m "feat(chat): add useChatSession hook for session management"
```

---

## Phase 2: Chat UI Components

### Task 7: Core Chat Components

**Files:**
- Create: `apps/desktop/src/renderer/src/components/chat/panel/ChatPanel.tsx`
- Create: `apps/desktop/src/renderer/src/components/chat/panel/MessageList.tsx`
- Create: `apps/desktop/src/renderer/src/components/chat/panel/Turn.tsx`
- Create: `apps/desktop/src/renderer/src/components/chat/panel/UserMessage.tsx`
- Create: `apps/desktop/src/renderer/src/components/chat/panel/AssistantParts.tsx`
- Create: `apps/desktop/src/renderer/src/components/chat/panel/InputBar.tsx`
- Create: `apps/desktop/src/renderer/src/components/chat/panel/index.ts`

- [ ] **Step 1: Create ChatPanel component**

```tsx
// apps/desktop/src/renderer/src/components/chat/panel/ChatPanel.tsx
import { useChatSession } from '@renderer/hooks/useChatSession'
import { MessageList } from './MessageList'
import { InputBar } from './InputBar'
import { PermissionDialog } from './PermissionDialog'

export function ChatPanel() {
  const { activeSession, isProcessing } = useChatSession()

  return (
    <div className="flex flex-col h-full bg-background">
      {activeSession ? (
        <>
          <MessageList session={activeSession} />
          <InputBar disabled={isProcessing} />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          No active session. Create one to start chatting.
        </div>
      )}

      <PermissionDialog />
    </div>
  )
}
```

- [ ] **Step 2: Create MessageList component**

```tsx
// apps/desktop/src/renderer/src/components/chat/panel/MessageList.tsx
import { useRef, useEffect } from 'react'
import type { Session } from '@shared/types'
import { Turn } from './Turn'

interface MessageListProps {
  session: Session
}

export function MessageList({ session }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Auto-scroll to bottom on new messages
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [session.turns.length])

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-2"
    >
      {session.turns.map((turn) => (
        <Turn key={turn.id} turn={turn} />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Create Turn component**

```tsx
// apps/desktop/src/renderer/src/components/chat/panel/Turn.tsx
import type { Turn as TurnType } from '@shared/types'
import { UserMessage } from './UserMessage'
import { AssistantParts } from './AssistantParts'
import { ThinkingIndicator } from './ThinkingIndicator'
import { DiffView } from './DiffView'

interface TurnProps {
  turn: TurnType
}

export function Turn({ turn }: TurnProps) {
  const isActive = turn.status === 'in_progress'

  return (
    <div className="py-4 border-b border-border">
      <UserMessage message={turn.userMessage} />

      {isActive && <ThinkingIndicator />}

      <AssistantParts parts={turn.assistantParts} />

      {turn.status === 'completed' && turn.diffs && turn.diffs.length > 0 && (
        <DiffView diffs={turn.diffs} />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create UserMessage component**

```tsx
// apps/desktop/src/renderer/src/components/chat/panel/UserMessage.tsx
import type { Message } from '@shared/types'
import { Markdown } from '@hugeicons/react'

interface UserMessageProps {
  message: Message
}

export function UserMessage({ message }: UserMessageProps) {
  const textPart = message.parts.find(p => p.type === 'text')
  const text = textPart?.type === 'text' ? textPart.text : ''

  return (
    <div className="flex gap-3 mb-3">
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
        U
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium mb-1">User</div>
        <div className="prose prose-sm dark:prose-invert">
          <Markdown>{text}</Markdown>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create AssistantParts component**

```tsx
// apps/desktop/src/renderer/src/components/chat/panel/AssistantParts.tsx
import type { Part } from '@shared/types'
import { TextPart } from './TextPart'
import { ToolCard } from './ToolCard'
import { ReasoningPart } from './ReasoningPart'
import { CompactionPart } from './CompactionPart'
import { ContextToolGroup } from './ContextToolGroup'

interface AssistantPartsProps {
  parts: Part[]
}

export function AssistantParts({ parts }: AssistantPartsProps) {
  // Group context tools (read/glob/grep)
  const groupedParts: Array<Part | { type: 'context_group'; tools: Part[] }> = []
  let contextGroup: Part[] = []

  for (const part of parts) {
    if (part.type === 'tool' && ['read', 'glob', 'grep', 'list'].includes((part as any).tool)) {
      contextGroup.push(part)
    } else {
      if (contextGroup.length > 0) {
        groupedParts.push({ type: 'context_group', tools: [...contextGroup] })
        contextGroup = []
      }
      groupedParts.push(part)
    }
  }

  if (contextGroup.length > 0) {
    groupedParts.push({ type: 'context_group', tools: contextGroup })
  }

  return (
    <div className="flex gap-3 mt-2">
      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-sm font-medium">
        A
      </div>
      <div className="flex-1 space-y-2">
        {groupedParts.map((part, idx) => {
          if (part.type === 'context_group') {
            return <ContextToolGroup key={`ctx-${idx}`} tools={part.tools} />
          }
          switch (part.type) {
            case 'text':
              return <TextPart key={idx} part={part} />
            case 'tool':
              return <ToolCard key={idx} part={part} />
            case 'reasoning':
              return <ReasoningPart key={idx} part={part} />
            case 'compaction':
              return <CompactionPart key={idx} part={part} />
            default:
              return null
          }
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create InputBar component**

```tsx
// apps/desktop/src/renderer/src/components/chat/panel/InputBar.tsx
import { useState } from 'react'
import { PaperAirplaneIcon } from '@hugeicons/react'

interface InputBarProps {
  disabled?: boolean
  onSend?: (message: string) => void
}

export function InputBar({ disabled, onSend }: InputBarProps) {
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || disabled) return
    onSend?.(input.trim())
    setInput('')
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-border">
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={disabled ? 'Waiting...' : 'Type a message...'}
          disabled={disabled}
          className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          rows={1}
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <PaperAirplaneIcon className="w-4 h-4" />
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 7: Create index export**

```typescript
// apps/desktop/src/renderer/src/components/chat/panel/index.ts
export { ChatPanel } from './ChatPanel'
export { MessageList } from './MessageList'
export { Turn } from './Turn'
export { UserMessage } from './UserMessage'
export { AssistantParts } from './AssistantParts'
export { InputBar } from './InputBar'
```

- [ ] **Step 8: Commit**

```bash
git add apps/desktop/src/renderer/src/components/chat/panel/
git commit -m "feat(chat): add core chat panel components"
```

---

### Task 8: Part Components

**Files:**
- Create: `apps/desktop/src/renderer/src/components/chat/panel/Part.tsx`
- Create: `apps/desktop/src/renderer/src/components/chat/panel/TextPart.tsx`
- Create: `apps/desktop/src/renderer/src/components/chat/panel/ToolCard.tsx`
- Create: `apps/desktop/src/renderer/src/components/chat/panel/ToolCardContent.tsx`
- Create: `apps/desktop/src/renderer/src/components/chat/panel/ContextToolGroup.tsx`
- Create: `apps/desktop/src/renderer/src/components/chat/panel/ReasoningPart.tsx`
- Create: `apps/desktop/src/renderer/src/components/chat/panel/CompactionPart.tsx`
- Create: `apps/desktop/src/renderer/src/components/chat/panel/DiffView.tsx`
- Create: `apps/desktop/src/renderer/src/components/chat/panel/ThinkingIndicator.tsx`

- [ ] **Step 1: Create TextPart component**

```tsx
// apps/desktop/src/renderer/src/components/chat/panel/TextPart.tsx
import type { TextPart as TextPartType } from '@shared/types'
import { Markdown } from '@hugeicons/react'
import { CopyButton } from '../shared/CopyButton'

interface TextPartProps {
  part: TextPartType
}

export function TextPart({ part }: TextPartProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <div className="relative group">
        <Markdown>{part.text}</Markdown>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyButton text={part.text} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create ToolCard component**

```tsx
// apps/desktop/src/renderer/src/components/chat/panel/ToolCard.tsx
import { useState } from 'react'
import type { ToolPart } from '@shared/types'
import { ChevronDownIcon, ChevronRightIcon } from '@hugeicons/react'

interface ToolCardProps {
  part: ToolPart
}

const toolIcons: Record<string, string> = {
  bash: '⌨️',
  read: '📖',
  edit: '✏️',
  write: '📝',
  glob: '🔍',
  grep: '🔍',
  webfetch: '🌐',
  websearch: '🌐',
  task: '📋',
  todowrite: '✅',
}

export function ToolCard({ part }: ToolCardProps) {
  const [isOpen, setIsOpen] = useState(false)

  const statusColors = {
    pending: 'bg-yellow-500',
    running: 'bg-blue-500 animate-pulse',
    completed: 'bg-green-500',
    error: 'bg-red-500',
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-muted hover:bg-muted/50 transition-colors"
      >
        <span className={`w-2 h-2 rounded-full ${statusColors[part.status]}`} />
        <span className="text-lg">{toolIcons[part.tool] || '🔧'}</span>
        <span className="text-sm font-medium">{part.tool}</span>
        {isOpen ? (
          <ChevronDownIcon className="w-4 h-4 ml-auto" />
        ) : (
          <ChevronRightIcon className="w-4 h-4 ml-auto" />
        )}
      </button>

      {isOpen && (
        <div className="px-3 py-2 border-t border-border space-y-2">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Input</div>
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
              {JSON.stringify(part.input, null, 2)}
            </pre>
          </div>
          {part.output && (
            <div>
              <div className="text-xs text-muted-foreground mb-1">Output</div>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                {part.output}
              </pre>
            </div>
          )}
          {part.error && (
            <div className="text-xs text-red-500">{part.error}</div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create remaining part components**

```tsx
// apps/desktop/src/renderer/src/components/chat/panel/ContextToolGroup.tsx
import type { Part } from '@shared/types'
import { ToolCard } from './ToolCard'

interface ContextToolGroupProps {
  tools: Part[]
}

export function ContextToolGroup({ tools }: ContextToolGroupProps) {
  const toolNames = tools.map(t => (t as any).tool).join(', ')

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="px-3 py-2 bg-muted text-sm">
        <span className="text-muted-foreground">Gathered context: </span>
        <span className="font-medium">{tools.length} {toolNames}</span>
      </div>
      <div className="p-2 space-y-2">
        {tools.map((tool, idx) => (
          <ToolCard key={idx} part={tool as any} />
        ))}
      </div>
    </div>
  )
}
```

```tsx
// apps/desktop/src/renderer/src/components/chat/panel/ReasoningPart.tsx
import type { ReasoningPart as ReasoningPartType } from '@shared/types'
import { useState } from 'react'
import { ChevronDownIcon } from '@hugeicons/react'

interface ReasoningPartProps {
  part: ReasoningPartType
}

export function ReasoningPart({ part }: ReasoningPartProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="rounded-lg bg-muted/50 border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors"
      >
        <span className="text-sm text-muted-foreground">
          {isExpanded ? '▼' : '▶'} Reasoning
        </span>
      </button>
      {isExpanded && (
        <div className="px-3 py-2 border-t border-border">
          <pre className="text-xs whitespace-pre-wrap">{part.text}</pre>
        </div>
      )}
    </div>
  )
}
```

```tsx
// apps/desktop/src/renderer/src/components/chat/panel/CompactionPart.tsx
import type { CompactionPart as CompactionPartType } from '@shared/types'

interface CompactionPartProps {
  part: CompactionPartType
}

export function CompactionPart({ part }: CompactionPartProps) {
  return (
    <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
      <div className="flex-1 h-px bg-border" />
      <span>{part.message || 'Context compacted'}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}
```

```tsx
// apps/desktop/src/renderer/src/components/chat/panel/DiffView.tsx
import type { FileDiff } from '@shared/types'

interface DiffViewProps {
  diffs: FileDiff[]
}

export function DiffView({ diffs }: DiffViewProps) {
  return (
    <div className="rounded-lg border border-border overflow-hidden mt-4">
      <div className="px-3 py-2 bg-muted font-medium text-sm">
        {diffs.length} file(s) changed
      </div>
      <div className="divide-y divide-border">
        {diffs.map((diff) => (
          <div key={diff.path} className="px-3 py-2">
            <div className="font-medium text-sm mb-1">
              {diff.status === 'created' && '✨ '}
              {diff.status === 'modified' && '📝 '}
              {diff.status === 'deleted' && '🗑️ '}
              {diff.path}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

```tsx
// apps/desktop/src/renderer/src/components/chat/panel/ThinkingIndicator.tsx
export function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>Thinking...</span>
    </div>
  )
}
```

- [ ] **Step 4: Update index export**

```typescript
// apps/desktop/src/renderer/src/components/chat/panel/index.ts
export { ChatPanel } from './ChatPanel'
// ... existing exports
export { TextPart } from './TextPart'
export { ToolCard } from './ToolCard'
export { ContextToolGroup } from './ContextToolGroup'
export { ReasoningPart } from './ReasoningPart'
export { CompactionPart } from './CompactionPart'
export { DiffView } from './DiffView'
export { ThinkingIndicator } from './ThinkingIndicator'
```

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/src/renderer/src/components/chat/panel/
git commit -m "feat(chat): add Part components - Text, Tool, Reasoning, Compaction, Diff"
```

---

### Task 9: PermissionDialog Component

**Files:**
- Create: `apps/desktop/src/renderer/src/components/chat/panel/PermissionDialog.tsx`
- Create: `apps/desktop/src/renderer/src/components/chat/panel/PermissionRequest.tsx`

- [ ] **Step 1: Create PermissionDialog component**

```tsx
// apps/desktop/src/renderer/src/components/chat/panel/PermissionDialog.tsx
import { useAtomValue } from 'jotai'
import { pendingPermissionAtom, permissionDialogOpenAtom } from '@renderer/atoms/chat-atoms'
import { useChatSession } from '@renderer/hooks/useChatSession'
import { XIcon } from '@hugeicons/react'

export function PermissionDialog() {
  const [isOpen, setIsOpen] = useAtomValue(permissionDialogOpenAtom)
  const pendingPermission = useAtomValue(pendingPermissionAtom)
  const { respondPermission } = useChatSession()

  if (!isOpen || !pendingPermission) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setIsOpen(false)}
      />

      {/* Dialog */}
      <div className="relative bg-background rounded-lg shadow-lg border border-border max-w-md w-full mx-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-lg font-semibold">Permission Required</h2>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-muted rounded"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <div className="font-medium">{pendingPermission.tool}</div>
              <div className="text-sm text-muted-foreground">requires permission</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-sm font-medium mb-1">Parameters</div>
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
              {JSON.stringify(pendingPermission.params, null, 2)}
            </pre>
          </div>

          {pendingPermission.patterns.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-medium mb-1">Affected patterns</div>
              <div className="flex flex-wrap gap-1">
                {pendingPermission.patterns.map((p) => (
                  <span
                    key={p}
                    className="px-2 py-0.5 bg-muted rounded text-xs"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 px-4 py-3 border-t border-border bg-muted/50">
          <button
            type="button"
            onClick={() => respondPermission(false)}
            className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            Deny
          </button>
          <button
            type="button"
            onClick={() => respondPermission(true)}
            className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Allow
          </button>
          <button
            type="button"
            onClick={() => respondPermission(true, pendingPermission.alwaysPatterns?.[0])}
            className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Always Allow
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update index export**

```typescript
// apps/desktop/src/renderer/src/components/chat/panel/index.ts
export { PermissionDialog } from './PermissionDialog'
```

- [ ] **Step 3: Commit**

```bash
git add apps/desktop/src/renderer/src/components/chat/panel/PermissionDialog.tsx
git commit -m "feat(chat): add PermissionDialog component"
```

---

### Task 10: Chat Sidebar Components

**Files:**
- Create: `apps/desktop/src/renderer/src/components/chat/sidebar/SessionList.tsx`
- Create: `apps/desktop/src/renderer/src/components/chat/sidebar/SessionItem.tsx`
- Create: `apps/desktop/src/renderer/src/components/chat/sidebar/NewSessionButton.tsx`
- Create: `apps/desktop/src/renderer/src/components/chat/sidebar/index.ts`

- [ ] **Step 1: Create SessionList component**

```tsx
// apps/desktop/src/renderer/src/components/chat/sidebar/SessionList.tsx
import { useChatSession } from '@renderer/hooks/useChatSession'
import { SessionItem } from './SessionItem'
import { NewSessionButton } from './NewSessionButton'

export function SessionList() {
  const { sessionIds, activeId, switchSession, deleteSession } = useChatSession()

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-border">
        <NewSessionButton />
      </div>

      <div className="flex-1 overflow-y-auto">
        {sessionIds.map((id) => (
          <SessionItem
            key={id}
            sessionId={id}
            isActive={id === activeId}
            onClick={() => switchSession(id)}
            onDelete={() => deleteSession(id)}
          />
        ))}

        {sessionIds.length === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No sessions yet
          </div>
        )}
      </div>
    </div>
  )
}
```

```tsx
// apps/desktop/src/renderer/src/components/chat/sidebar/SessionItem.tsx
import { useAtomValue } from 'jotai'
import { chatSessionAtomFamily } from '@renderer/atoms/chat-atoms'
import { TrashIcon } from '@hugeicons/react'

interface SessionItemProps {
  sessionId: string
  isActive: boolean
  onClick: () => void
  onDelete: () => void
}

export function SessionItem({ sessionId, isActive, onClick, onDelete }: SessionItemProps) {
  const session = useAtomValue(chatSessionAtomFamily(sessionId))

  if (!session) return null

  const preview = session.turns[0]?.userMessage?.parts[0]?.type === 'text'
    ? (session.turns[0].userMessage.parts[0] as any).text.substring(0, 30)
    : '...'

  return (
    <div
      className={`group flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted transition-colors ${
        isActive ? 'bg-muted' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">
          {session.name || 'Untitled'}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {preview}
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded transition-opacity"
      >
        <TrashIcon className="w-4 h-4 text-destructive" />
      </button>
    </div>
  )
}
```

```tsx
// apps/desktop/src/renderer/src/components/chat/sidebar/NewSessionButton.tsx
import { useChatSession } from '@renderer/hooks/useChatSession'

export function NewSessionButton() {
  const { createSession } = useChatSession()

  return (
    <button
      type="button"
      onClick={() => createSession('mock')}
      className="w-full px-3 py-2 text-sm font-medium rounded-lg border border-dashed border-border hover:bg-muted transition-colors"
    >
      + New Session
    </button>
  )
}
```

```typescript
// apps/desktop/src/renderer/src/components/chat/sidebar/index.ts
export { SessionList } from './SessionList'
export { SessionItem } from './SessionItem'
export { NewSessionButton } from './NewSessionButton'
```

- [ ] **Step 2: Commit**

```bash
git add apps/desktop/src/renderer/src/components/chat/sidebar/
git commit -m "feat(chat): add chat sidebar components for session management"
```

---

## Phase 3: Full Features

### Task 11: Fork/Resume/Archive Implementation

**Files:**
- Modify: `apps/desktop/src/main/handlers/chat/chat-handler.ts`
- Modify: `apps/desktop/src/renderer/src/hooks/useChatSession.ts`
- Modify: `apps/desktop/src/renderer/src/components/chat/sidebar/SessionItem.tsx`

- [ ] **Step 1: Add lifecycle methods to ChatHandler**

Add these handlers in Task 3's chat-handler.ts:
```typescript
// Add to register() method
this.rpcServer.handle('/chat/session/resume', async (sessionId) => {
  const session = await this.sessionStore.get(sessionId)
  if (!session) throw new Error(`Session not found: ${sessionId}`)

  const EngineClass = engineRegistry.get(session.engineType)
  if (!EngineClass) throw new Error(`Unknown engine: ${session.engineType}`)

  const engine = new EngineClass()
  await engine.initialize(session.engineConfig)
  this.engines.set(sessionId, engine)

  engine.onEvent((event: EngineEvent) => {
    this.handleEngineEvent(sessionId, event)
  })

  return session
})
```

- [ ] **Step 2: Add resume to useChatSession hook**

```typescript
// Add to useChatSession.ts
const resumeSession = useCallback(async (sessionId: string) => {
  const session = await window.api.chat.session.resume(sessionId)
  // Re-register engine for this session
  // ... (implementation details)
  setActiveId(sessionId)
}, [setActiveId])

// Export resumeSession in return object
```

- [ ] **Step 3: Commit**

```bash
git add apps/desktop/src/main/handlers/chat/chat-handler.ts apps/desktop/src/renderer/src/hooks/useChatSession.ts
git commit -m "feat(chat): add fork, resume, archive lifecycle methods"
```

---

### Task 12: Reasoning and Compaction Display

**Files:**
- Modify: `apps/desktop/src/renderer/src/components/chat/panel/ReasoningPart.tsx`
- Modify: `apps/desktop/src/renderer/src/components/chat/panel/CompactionPart.tsx`
- Update stream handling in `useChatSession.ts`

- [ ] **Step 1: Enhance reasoning display**

Update `ReasoningPart.tsx` to show summary when collapsed:
```typescript
// Add summary prop handling
interface ReasoningPartProps {
  part: ReasoningPartType
  defaultExpanded?: boolean
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/desktop/src/renderer/src/components/chat/panel/
git commit -m "feat(chat): enhance reasoning and compaction display"
```

---

## Phase 4: Multi-Engine

### Task 13: ClaudeEngine Implementation

**Files:**
- Create: `apps/desktop/src/main/handlers/engines/claude-engine.ts`

This is a placeholder - actual implementation depends on Claude CLI integration details.

- [ ] **Step 1: Create ClaudeEngine stub**

```typescript
// apps/desktop/src/main/handlers/engines/claude-engine.ts
import { EngineBridge, type EngineEvent } from './engine-bridge'
import type { EngineConfig } from '@shared/types'

export class ClaudeEngine implements EngineBridge {
  readonly engineType = 'claude'

  async initialize(config: EngineConfig): Promise<void> {
    // TODO: Implement Claude CLI connection
  }

  // ... other interface methods
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/desktop/src/main/handlers/engines/claude-engine.ts
git commit -m "feat(chat): add ClaudeEngine stub for Claude CLI integration"
```

---

## Self-Review Checklist

- [ ] **Spec coverage**: All requirements from spec have corresponding tasks
- [ ] **Placeholder scan**: No TBD/TODO in implementation steps
- [ ] **Type consistency**: Types match between tasks (Session, Turn, Part, etc.)
- [ ] **File paths**: All files use correct paths from the structure
- [ ] **Dependencies**: Tasks are ordered correctly (Phase 1 before Phase 2)

---

## Execution Options

**Plan complete and saved to `docs/superpowers/plans/2026-04-09-ai-chat-implementation.md`**

Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
