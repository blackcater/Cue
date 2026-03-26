# RPC Debug Examples Design

## Overview

Add simple examples in `apps/desktop/src/main` and `apps/desktop/src/renderer` to test the custom RPC capabilities in `apps/desktop/src/shared/rpc`.

**Purpose**: Developer debugging tool to manually trigger RPC calls and verify they work correctly.

## Architecture

```
apps/desktop/src/main/
├── index.ts                   # Wire up services, create ElectronRpcServer
├── services/
│   ├── index.ts               # Export RpcDebugService, WindowManager
│   ├── WindowManager.ts
│   └── RpcDebugService.ts      # NEW: RPC debug handlers
└── lib/logger.ts

apps/desktop/src/renderer/src/
├── routes/
│   ├── rpc-debug.tsx          # NEW: RPC debug UI page
│   └── routeTree.gen.ts       # Add rpc-debug route here
└── main.tsx

apps/desktop/src/preload/
├── index.ts                    # Expose RPC client factory
└── preload.d.ts                # Type declarations
```

## Integration Architecture

The design requires wiring up the RPC infrastructure in `main/index.ts`:

```typescript
import { app } from 'electron'
import { ipcMain } from 'electron'
import { electronApp, is, platform } from '@electron-toolkit/utils'
import { ElectronRpcServer, AppWindowRegistry } from '../shared/rpc/electron'
import { RpcDebugService } from './services/RpcDebugService'

// Global instances
let windowRegistry: AppWindowRegistry
let rpcServer: ElectronRpcServer
let rpcDebugService: RpcDebugService

app.whenReady()
  .then(() => {
    // 1. Create WindowRegistry for managing window clients
    windowRegistry = new AppWindowRegistry()

    // 2. Create ElectronRpcServer
    rpcServer = new ElectronRpcServer(windowRegistry, ipcMain)

    // 3. Register debug handlers
    rpcDebugService = new RpcDebugService(rpcServer)

    // 4. Create window and register it
    const mainWindow = windowManager.createWindow()
    windowRegistry.registerWindow(mainWindow)
  })
```

## Main Process - RpcDebugService

**File**: `apps/desktop/src/main/services/RpcDebugService.ts`

Registers the following RPC handlers under `/debug` namespace:

| Handler | Type | Description |
|---------|------|-------------|
| `/debug/echo` | call | Returns input text - tests basic call |
| `/debug/add` | call | Returns sum of two numbers - tests parameter passing |
| `/debug/stream-numbers` | stream | Yields 1-5 with 200ms delay - tests streaming |
| `/debug/server-time` | call | Returns server ISO time + clientId - tests context |
| `/debug/trigger-event` | call | Pushes event to caller - tests server push |
| `/debug/slow-echo` | call | Returns text after 3s delay - tests AbortSignal timeout |

### Implementation

```typescript
import { ElectronRpcServer } from '../../shared/rpc/electron'
import { RpcError } from '../../shared/rpc/RpcError'
import type { Rpc } from '../../shared/rpc/types'

export class RpcDebugService {
  constructor(private readonly server: ElectronRpcServer) {
    this.registerHandlers()
  }

  private registerHandlers() {
    const router = this.server.router('debug')

    // Basic call - echo back the input
    router.handle('echo', (_, text: string) => text)

    // Basic call - add two numbers
    router.handle('add', (_, a: number, b: number) => a + b)

    // Stream - yield numbers 1 to 5
    router.handle('stream-numbers', async function* () {
      for (let i = 1; i <= 5; i++) {
        await new Promise((r) => setTimeout(r, 200))
        yield i
      }
    })

    // Context - return server time and clientId
    router.handle('server-time', (ctx) => ({
      clientId: ctx.clientId,
      time: new Date().toISOString(),
    }))

    // Push - trigger an event to the calling client
    router.handle('trigger-event', (ctx, eventName: string) => {
      this.server.push(eventName, { type: 'client', clientId: ctx.clientId }, 'Hello from server!')
      return { triggered: true }
    })

    // AbortSignal test - slow response that respects timeout
    router.handle('slow-echo', async (_, text: string, options: Rpc.CallOptions) => {
      const { signal } = options

      if (signal?.aborted) {
        throw new RpcError(RpcError.ABORTED, 'Request was aborted before starting')
      }

      // Wait 3 seconds (will be interrupted if signal aborts)
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Check if aborted during wait
      if (signal?.aborted) {
        throw new RpcError(RpcError.ABORTED, 'Request was aborted during wait')
      }

      return { text, completed: true }
    })
  }
}
```

## Preload - Expose RPC Client

The preload script cannot directly create an `ElectronRpcClient` because it doesn't have access to `WebContents` at module load time. Instead, expose a factory function that the renderer calls when it has a window reference.

**File**: `apps/desktop/src/preload/index.ts`

```typescript
import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { ElectronRpcClient } from '../shared/rpc/electron'

// Lazy-initialized RPC client
let rpcClient: ElectronRpcClient | null = null

const api = {
  // Factory function to create/retrieve RPC client
  // Called by renderer with window's webContents
  getRpcClient: (webContents: Electron.WebContents): ElectronRpcClient => {
    if (!rpcClient) {
      rpcClient = new ElectronRpcClient(webContents)
    }
    return rpcClient
  },
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
}
```

**File**: `apps/desktop/src/preload/preload.d.ts`

```typescript
// Forward declaration - ElectronRpcClient is implemented in index.ts
declare class ElectronRpcClient {
  readonly clientId: string
  readonly groupId?: string
  call<T>(event: string, options?: object, ...args: unknown[]): Promise<T>
  stream<T>(event: string, options?: object, ...args: unknown[]): object
  onEvent(event: string, listener: (...args: unknown[]) => void): () => void
}

interface API {
  getRpcClient(webContents: Electron.WebContents): ElectronRpcClient
}
```

## Renderer - /rpc-debug Page

**File**: `apps/desktop/src/renderer/src/routes/rpc-debug.tsx`

### UI Design

Card-based layout, each RPC call is a card:

```
┌─────────────────────────────┐
│ /debug/echo                 │
│ [____________] [Call]        │
│ Result: "hello"             │
└─────────────────────────────┘

┌─────────────────────────────┐
│ /debug/add                  │
│ [a: __] [b: __] [Call]      │
│ Result: 42                  │
└─────────────────────────────┘

┌─────────────────────────────┐
│ /debug/stream-numbers       │
│ [Start] [Cancel]             │
│ Progress: [1] → [2] → ...   │
└─────────────────────────────┘

┌─────────────────────────────┐
│ /debug/server-time          │
│ [Call]                      │
│ ClientId: client-1          │
│ Server Time: 2026-03-26...  │
└─────────────────────────────┘

┌─────────────────────────────┐
│ /debug/slow-echo + AbortSignal│
│ [text] [Call with 1s timeout]│
│ Result: "Request timed out" │
└─────────────────────────────┘

┌─────────────────────────────┐
│ /debug/trigger-event        │
│ [event name] [Trigger]       │
│ Result: { triggered: true } │
└─────────────────────────────┘

┌─────────────────────────────┐
│ Event Listener              │
│ [Start Listening] [Stop]     │
│ Events:                     │
│ - "my-event": "Hello..."    │
└─────────────────────────────┘
```

### Components

- **Card**: Container with title, input area, action buttons, result display
- **StreamCard**: Extends Card with progress visualization and cancel support
- **EventCard**: Event listener with start/stop and event log

### React Implementation Notes

```typescript
import { useState } from 'react'
import { RpcError } from '../../../../shared/rpc/RpcError'

// Get RPC client using preload API
// Note: window.api.getRpcClient requires a WebContents reference
// In renderer, use: window.api.getRpcClient(window.electron.webContents)

async function handleCall() {
  const client = window.api.getRpcClient(window.electron.webContents)
  try {
    const result = await client.call('/debug/echo', {}, 'hello')
    console.log('Result:', result)
  } catch (error) {
    if (error instanceof RpcError) {
      console.log(`Error ${error.code}: ${error.message}`)
    }
  }
}
```

## Route Registration

This codebase uses TanStack Router with manual route registration. Add the new route to `routeTree.gen.ts`:

**File**: `apps/desktop/src/renderer/src/routeTree.gen.ts`

```typescript
import { createRootRoute, createRoute } from '@tanstack/react-router'

import { RootComponent } from './routes/__root'
import { ChatPage } from './routes/chat'
import { HomePage } from './routes/index'
import { RpcDebugPage } from './routes/rpc-debug'  // NEW
import { SettingsPage } from './routes/settings'

// Root route
export const rootRoute = createRootRoute({
  component: RootComponent,
})

// ... existing routes ...

// RPC Debug route - NEW
export const rpcDebugRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rpc-debug',
  component: RpcDebugPage,
})

// Create route tree
export const routeTree = rootRoute.addChildren([
  homeRoute,
  settingsRoute,
  chatRoute,
  rpcDebugRoute,  // ADD THIS
])
```

## Files to Create/Modify

| Action | File |
|--------|------|
| Create | `apps/desktop/src/main/services/RpcDebugService.ts` |
| Modify | `apps/desktop/src/main/services/index.ts` |
| Modify | `apps/desktop/src/main/index.ts` |
| Modify | `apps/desktop/src/preload/index.ts` |
| Modify | `apps/desktop/src/preload/preload.d.ts` |
| Create | `apps/desktop/src/renderer/src/routes/rpc-debug.tsx` |
| Modify | `apps/desktop/src/renderer/src/routeTree.gen.ts` |

## Initialization Flow

1. `main/index.ts` creates `AppWindowRegistry` and `ElectronRpcServer`
2. `RpcDebugService` is instantiated, registering `/debug/*` handlers
3. `WindowManager.createWindow()` returns a `BrowserWindow`
4. `windowRegistry.registerWindow(mainWindow)` makes the window a RPC client
5. Renderer loads, calls `window.api.getRpcClient(window.electron.webContents)`
6. Renderer navigates to `/rpc-debug` and uses the RPC client to call handlers
7. Server processes calls and sends responses via IPC
