# RPC Debug Multi-Window Testing Design

## Overview

Extend the rpc-debug page to support multi-window broadcast testing. Create multiple BrowserWindow instances that join different groups, then test sendToAll / sendToGroup / sendToClient message broadcasting.

## Core Features

### 1. Window Creation

- **Group Selection**: Dropdown to select group-a, group-b, or no group
- **Spawn Button**: Calls `api.createWindow(groupId)` to create a new BrowserWindow via IPC to main process
- **New Window**: Opens `rpc-debug` route, displays its own `clientId` and `groupId`

### 2. Current Window Info Display

- Show current window's `clientId` and `groupId` at the top of rpc-debug page

### 3. Broadcast Testing

| Action | Description |
|--------|-------------|
| `sendToAll` | Broadcast event to ALL registered windows |
| `sendToGroup` | Send event to all windows in group-a or group-b |
| `sendToClient` | Send event to specific clientId |
| `trigger-event` | Trigger a named event, simulating push message |

### 4. Event Listener

- Subscribe to events and display received broadcast messages

## Data Flow

```
[WindowA-group-a] ─┐
[WindowB-group-a] ─┼── sendToGroup("group-a") ─→ These windows receive
[WindowC-group-b] ─┘

[WindowA] ─┐
[WindowB] ─┼── sendToAll() ─→ All windows receive
[WindowC] ─┘
```

## Implementation

### New RPC Handlers (main process)

| Handler | Description |
|---------|-------------|
| `POST /debug/window/create` | Create new BrowserWindow with optional group |
| `POST /debug/push/send-to-all` | Push event to all windows |
| `POST /debug/push/send-to-group` | Push event to specific group |
| `POST /debug/push/send-to-client` | Push event to specific clientId |

### UI Components

1. **WindowInfoCard** — Displays clientId and groupId
2. **WindowManagerCard** — Group selection + spawn button
3. **BroadcastCard** — sendToAll, sendToGroup (with group selector), sendToClient (with clientId input)
4. **EventListenerCard** — Enhanced to show event source (which window sent)

### API Shape

```typescript
// createWindow
api.createWindow(groupId?: string): Promise<{ clientId: string; windowId: number }>

// sendToAll
client.call('/debug/push/send-to-all', eventName: string, ...args)

// sendToGroup
client.call('/debug/push/send-to-group', groupId: string, eventName: string, ...args)

// sendToClient
client.call('/debug/push/send-to-client', clientId: string, eventName: string, ...args)
```

## Files to Modify

- `apps/desktop/src/renderer/src/routes/rpc-debug.tsx` — Add new UI components
- `apps/desktop/src/main/services/RpcDebugService.ts` — Add new handlers (or create if not exists)
- `apps/desktop/src/preload/index.ts` — Expose `api.createWindow`

## Testing Scenarios

1. Open 3 windows: 2 in group-a, 1 in group-b
2. Send to group-a → only 2 windows receive
3. Send to all → all 3 windows receive
4. Send to specific clientId → only that window receives
