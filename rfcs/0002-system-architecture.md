# RFC 0002: System Architecture

## Summary

This document defines the high-level system architecture for Acme, including the technology stack, layer separation, and key component interactions.

## Technology Stack

### Desktop Shell

| Option           | Pros                                  | Cons                                    | Recommendation         |
| ---------------- | ------------------------------------- | --------------------------------------- | ---------------------- |
| **Electron 40+** | Mature ecosystem, Node.js full access | Larger bundle size (~150MB)             | **Recommended for v1** |
| Tauri 2.x        | Smaller bundle, Rust backend          | Limited Node.js APIs, younger ecosystem | Consider for v2        |

**Decision**: Use Electron for v1 to leverage existing knowledge from CodePilot/CodexMonitor and faster development cycle.

### Frontend

| Layer            | Technology   | Version           |
| ---------------- | ------------ | ----------------- |
| Framework        | Next.js      | 16.x (App Router) |
| UI Library       | React        | 19.x              |
| Styling          | Tailwind CSS | 4.x               |
| Components       | Radix UI     | Latest            |
| State Management | Zustand      | Latest            |
| Build Tool       | Turborepo    | Latest            |

### Backend (Embedded)

| Layer     | Technology                |
| --------- | ------------------------- |
| API Layer | Next.js Route Handlers    |
| Database  | better-sqlite3 (WAL mode) |
| IPC       | Electron IPC              |

### AI Integration

| Provider    | Integration Method                       |
| ----------- | ---------------------------------------- |
| Codex       | `codex app-server` (JSON-RPC over stdio) |
| Claude Code | Claude Agent SDK                         |
| OpenCode    | CLI + MCP protocol                       |

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Desktop Shell (Electron)                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Renderer Process (Next.js)                  ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐  ││
│  │  │   UI Layer  │  │   Hooks     │  │  State (Zustand)│  ││
│  │  │  Components │  │  useSSEStream│  │               │  ││
│  │  └─────────────┘  └─────────────┘  └───────────────┘  ││
│  │  ┌─────────────────────────────────────────────────────┐││
│  │  │              API Routes (Next.js)                    │││
│  │  │  /api/chat  /api/projects  /api/settings  /api/git  │││
│  │  └─────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Preload Bridge (contextBridge)              ││
│  └─────────────────────────────────────────────────────────┘│  ┌────────────────────────────────
│─────────────────────────┐│
│  │              Main Process Services                       ││
│  │  WindowManager │ FileSystem │ Git │ Terminal │ Tray    ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              AI Provider Layer (External)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │   Codex      │  │ Claude Code   │  │    OpenCode     │ │
│  │ app-server   │  │ Agent SDK    │  │   MCP Bridge    │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # REST API routes
│   │   ├── chat/          # Chat/message endpoints
│   │   ├── projects/     # Project CRUD
│   │   ├── threads/       # Thread management
│   │   ├── git/           # Git operations
│   │   ├── settings/      # App settings
│   │   ├── mcp/           # MCP server management
│   │   └── skills/        # Skills management
│   ├── chat/              # Main chat UI
│   ├── projects/          # Project list/management UI
│   ├── settings/          # Settings UI
│   ├── mcp/               # MCP server management UI
│   └── skills/            # Skills marketplace UI
├── components/
│   ├── ui/                # Base UI components (Radix-based)
│   ├── chat/              # Chat-specific components
│   │   ├── Composer.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── CodeBlock.tsx
│   │   ├── DiffViewer.tsx
│   │   └── ReasoningDisplay.tsx
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Terminal.tsx
│   ├── projects/         # Project list/tree
│   ├── git/               # Git UI components
│   ├── settings/          # Settings panels
│   └── skills/            # Skills UI
├── lib/
│   ├── db.ts              # SQLite database (schema + CRUD)
│   ├── providers/         # AI provider abstractions
│   │   ├── base.ts        # Base provider interface
│   │   ├── codex.ts       # Codex adapter
│   │   ├── claude.ts      # Claude Code adapter
│   │   └── opencode.ts    # OpenCode adapter
│   ├── stream-manager.ts  # SSE stream lifecycle
│   ├── session-manager.ts # Active session registry
│   ├── files.ts           # File system operations
│   ├── git.ts             # Git operations wrapper
│   ├── mcp.ts             # MCP client/manager
│   ├── skills.ts         # Skills loader/executor
│   └── automation.ts     # Automation runner
├── hooks/                 # React hooks
│   ├── useSSEStream.ts
│   ├── useProject.ts
│   ├── useThread.ts
│   └── useGit.ts
├── types/
│   ├── index.ts           # All TypeScript interfaces
│   └── electron.d.ts      # Electron IPC types
└── i18n/                  # Internationalization
    ├── en.ts
    └── zh.ts

electron/
├── main.ts               # Electron main process
├── preload.ts            # Context bridge
└── services/
    ├── window-manager.ts
    ├── file-service.ts
    ├── git-service.ts
    ├── terminal-service.ts
    └── tray-service.ts
```

## Data Flow

### Chat Message Flow

```
User Input → Composer Component
           → POST /api/chat/messages
           → Provider Adapter (create conversation)
           → AI Provider SSE stream
           → Stream Manager (manage lifecycle)
           → useSSEStream hook (subscribe)
           → MessageList Component (render)
           → Database (persist)
```

### Project Switching Flow

```
Sidebar Project Click
  → Load project config
  → Initialize provider for project
  → Fetch existing threads
  → Update UI state
```

## IPC Communication

### Main ↔ Renderer Channels

| Channel           | Direction | Purpose               |
| ----------------- | --------- | --------------------- |
| `window:minimize` | R→M       | Minimize window       |
| `window:maximize` | R→M       | Toggle maximize       |
| `window:close`    | R→M       | Close window          |
| `window:popout`   | R→M       | Pop out to new window |
| `fs:read`         | R→M       | Read file             |
| `fs:write`        | R→M       | Write file            |
| `git:status`      | R→M       | Get git status        |
| `terminal:spawn`  | R→M       | Spawn terminal        |
| `terminal:input`  | R↔M       | Terminal I/O          |
| `mcp:connect`     | R→M       | Connect MCP server    |

## Security Considerations

1. **Context Isolation**: Enabled by default
2. **Node Integration**: Disabled in renderer
3. **Sandbox**: Enabled for renderer process
4. **CSP**: Strict Content Security Policy
5. **Preload Script**: Exposes minimal API via contextBridge

## Open Questions

1. Should we use a separate process for AI provider communication?
2. How to handle provider-specific config files (e.g., Codex config.toml)?
3. Should we implement a plugin system for third-party integrations?

---

**Status**: Draft
**Related RFCs**: 0001 (Product Vision), 0003 (Provider Abstraction), 0004 (Data Models)
**Reviewers**: (to be assigned)
