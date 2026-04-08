# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package Manager

**Always use `bun` and `bunx`** instead of npm, npx, pnpm, or yarn.

```bash
bun install          # Install dependencies
bun run <script>     # Run a script
bunx <package>       # Execute a package (like npx)
bun test             # Run tests
```

## Development Commands

```bash
# Desktop app
bun run dev:desktop  # Start Electron dev server with hot reload

# Desktop app (from apps/desktop)
bun run dev          # Development mode
bun run build        # Production build
bun run typecheck    # TypeScript type checking

# Code quality (must pass before commit)
bunx tsc --noEmit
bunx oxlint
bunx oxfmt
```

## Architecture

### Monorepo Structure

```
apps/
  desktop/      # Electron desktop application
  cli/          # Command-line interface
  web/          # Web application
  api-server/   # Backend API server
  console/      # Admin console
  viewer/       # File viewer

packages/
  ui/           # Shared UI component library
  schemas/      # Shared TypeScript schemas
  tsconfig/     # Shared TypeScript configurations
```

### Desktop App Architecture (Electron)

```
apps/desktop/src/
  main/           # Main process (Node.js, no DOM)
    handlers/     # IPC handlers (application-menu, clipboard, files, etc.)
    lib/          # Main process utilities (logger, store, utils)
    env.main.ts   # Environment configuration
  preload/        # Context bridge (electron API exposure)
    api.ts        # Exposes typed API to renderer via contextBridge
    expose.ts     # RPC client setup (IpcRendererRpcClient)
  renderer/       # React application (no Node.js APIs)
    src/
      features/   # Feature modules (agent, chat, thread, vault, etc.)
      components/ # Shared UI components
      lib/        # Renderer utilities (i18n, config, env)
      stores/     # State management (Jotai atoms and other state stores)
      routes/     # TanStack Router file-based routes
      services/   # Service modules (files, threads, vault, etc.)
  shared/         # Common shared codes for renderer and main process
    rpc/          # Shared RPC types and utilities
```

### IPC Communication

The renderer communicates with main process via typed RPC:

1. **Preload** (`src/preload/`): Creates `IpcRendererRpcClient` and exposes typed API via `contextBridge`
2. **Renderer** (`src/renderer/`): Uses `buildCallApi` / `buildStreamApi` helpers to create typed API facades
3. **Main** (`src/main/handlers/`): Registers IPC handlers with the RPC server

```typescript
// Example: Exposing a files API
// preload/expose.ts
const files = buildCallApi<FilesHandler>('files', ['list', 'search'], rpc)
contextBridge.exposeInMainWorld('api', { files, store, rpc })
```

### State Management

- **Jotai** for atomic state management in renderer
- **TanStack Query** for server state and caching
- **TanStack Router** for routing (file-based route discovery)

### Key Technologies

| Category     | Technology                                     |
| ------------ | ---------------------------------------------- |
| UI Framework | React 19 + TypeScript                          |
| Styling      | TailwindCSS                                    |
| Icons        | hugeicon (`@hugeicons/react`)                  |
| State        | Jotai + TanStack Query                         |
| Routing      | TanStack Router (file-based)                   |
| IPC          | Custom RPC over Electron IPC                   |
| Build        | electron-vite + Vite                           |
| Agents       | Anthropic SDK, OpenAI Agents SDK, ACP protocol |

## Code Conventions

### Naming Conventions

| Element             | Convention              | Example                   |
| ------------------- | ----------------------- | ------------------------- |
| Directories         | kebab-case              | `file-tree`, `chat-panel` |
| Component files     | PascalCase              | `ThreadCell.tsx`          |
| Hook files          | camelCase, `use` prefix | `useThread.ts`            |
| Hooks               | camelCase, `use` prefix | `useThread()`             |
| Variables/Functions | camelCase               | `threadList`              |
| Types/Classes       | PascalCase              | `ThreadItem`              |
| Constants           | UPPER_SNAKE_CASE        | `MAX_RETRY_COUNT`         |
| Unused params       | `_` prefix              | `_threadId`               |

### TypeScript

- Use `interface` for internal implementation
- Export types for external use
- Path aliases: `@renderer/*` for renderer, `@main/*` for main process
- Private methods/fields use `#` prefix
- Use namespace to organize related types for a class

### React Components

- One component per file
- Props type: `<ComponentName>Props`
- State in atoms, derived data via selectors
- Prefer composition over prop drilling
- Use **TailwindCSS** for styling; avoid raw CSS
- Use **hugeicon** (`@hugeicons/react`) for icons — do not use other icon libraries

### Feature Modules Directory Structure

Each feature module (under `features/`) follows a consistent structure:

```
feature-name/
├── components/           # Feature-specific React components
│   ├── index.ts          # Public exports
│   ├── ComponentName.tsx # Component file (PascalCase)
│   └── sub-folder/       # Nested components organized by domain
├── hooks/                # Custom React hooks (useFeatureHook.ts)
├── pages/                # Page-level components (route leaf components)
├── stores/               # State management (Jotai atoms and other state stores)
├── lib/                  # Feature-specific utilities (avoid if possible)
└── types.ts              # Feature-specific types
```

**Rules:**
- Only add sub-directories when actually needed (avoid empty layers)
- Keep components focused on the feature domain
- Feature-specific state should be in `stores/` (Jotai atoms and other state stores)
- **Features must NOT import from other features** — use composition at the route/page level instead

### Code Quality

Before every commit, you MUST run:
```bash
bunx tsc --noEmit
bunx oxlint
bunx oxfmt
```

- Use ENGLISH for all code comments
