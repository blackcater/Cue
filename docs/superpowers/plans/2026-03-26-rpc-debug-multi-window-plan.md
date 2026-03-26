# RPC Debug Multi-Window Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add multi-window broadcast testing to rpc-debug: create windows with group assignment, test sendToAll/sendToGroup/sendToClient.

**Architecture:** Extend RpcDebugService with window management and broadcast handlers. Add UI components to rpc-debug page. Expose createWindow via preload.

**Tech Stack:** Electron BrowserWindow, TanStack Router (hash history), IPC RPC pattern already in codebase.

---

## File Map

```
apps/desktop/src/main/
  services/
    WindowManager.ts         # Modify: add createDebugWindow()
    RpcDebugService.ts       # Modify: add window/push handlers
    index.ts                 # No changes (WindowManager already imported)
  index.ts                  # Add ipcMain.handle for window:create

apps/desktop/src/shared/rpc/electron/
  AppWindowRegistry.ts       # Modify: add getGroupsByClientId()
  types.ts                   # Modify: WindowRegistry interface add getGroupsByClientId

apps/desktop/src/preload/
  index.ts                  # Modify: expose api.createWindow

apps/desktop/src/renderer/src/routes/
  rpc-debug.tsx             # Modify: add WindowInfoCard, WindowManagerCard, BroadcastCard, enhance EventListenerCard
```

---

## Task 1: Add `createDebugWindow` to WindowManager

**Files:**
- Modify: `apps/desktop/src/main/services/WindowManager.ts`

- [ ] **Step 1: Add `createDebugWindow` method to WindowManager**

Add this method to the `WindowManager` class:

```typescript
createDebugWindow(groupId?: string): { window: BrowserWindow; clientId: string } {
    const window = new BrowserWindow({
        width: 900,
        height: 670,
        show: false,
        autoHideMenuBar: true,
        ...(process.platform === 'linux' ? { icon } : {}),
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false,
        },
        titleBarStyle: 'hidden',
    })

    window.on('ready-to-show', () => {
        window.show()
    })

    const clientId = `client-${window.id}`

    // Load the rpc-debug route via hash history
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/rpc-debug`)
    } else {
        window.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/rpc-debug' })
    }

    return { window, clientId }
}
```

Note: In production `loadFile` with `{ hash: '/rpc-debug' }` appends the hash to the file path, which works with hash-based routing.

---

## Task 2: Add getGroupsByClientId to AppWindowRegistry

**Files:**
- Modify: `apps/desktop/src/shared/rpc/electron/AppWindowRegistry.ts`
- Modify: `apps/desktop/src/shared/rpc/types.ts` (WindowRegistry interface)

- [ ] **Step 1: Add `_clientIdToGroups` map and `getGroupsByClientId` method to AppWindowRegistry**

Add a private map to track group memberships per clientId:
```typescript
private readonly _clientIdToGroups = new Map<string, Set<string>>()
```

Update `registerWindow` to populate this map:
```typescript
if (group) {
    this.joinGroup(clientId, group)
    // Also track directly on _clientIdToGroups
    if (!this._clientIdToGroups.has(clientId)) {
        this._clientIdToGroups.set(clientId, new Set())
    }
    this._clientIdToGroups.get(clientId)!.add(group)
}
```

Update `joinGroup`:
```typescript
joinGroup(clientId: string, groupId: string): void {
    if (!this._groups.has(groupId)) {
        this._groups.set(groupId, new Set())
    }
    this._groups.get(groupId)!.add(clientId)

    // Track per-client group membership
    if (!this._clientIdToGroups.has(clientId)) {
        this._clientIdToGroups.set(clientId, new Set())
    }
    this._clientIdToGroups.get(clientId)!.add(groupId)
}
```

Update `unregisterWindow` to clean up:
```typescript
this._clientIdToGroups.delete(clientId)
```

Add new method:
```typescript
getGroupsByClientId(clientId: string): string[] {
    return Array.from(this._clientIdToGroups.get(clientId) ?? [])
}
```

- [ ] **Step 2: Add `getGroupsByClientId` to WindowRegistry interface in types.ts**

```typescript
getGroupsByClientId(clientId: string): string[]
```

---

## Task 3: Add window/push handlers to RpcDebugService

**Files:**
- Modify: `apps/desktop/src/main/services/RpcDebugService.ts`

- [ ] **Step 1: Update RpcDebugService constructor and register new handlers**

Update constructor to accept WindowRegistry:

```typescript
constructor(
    private readonly server: RpcServer,
    private readonly registry: WindowRegistry,
    private readonly windowManager: WindowManager,
) {
    this.registerHandlers()
}
```

Add these new handlers after the existing ones:

```typescript
// window/create - create a new BrowserWindow
router.handle('window/create', ((ctx, groupId: string | null) => {
    const { window, clientId } = this.windowManager.createDebugWindow(groupId ?? undefined)
    this.registry.registerWindow(window, groupId ?? undefined)
    return { clientId, windowId: window.id }
}) as Rpc.HandlerFn)

// window/info - return current window's clientId and groups
router.handle('window/info', ((ctx) => {
    const groups = this.registry.getGroupsByClientId(ctx.clientId)
    return { clientId: ctx.clientId, groupId: groups[0] ?? null }
}) as Rpc.HandlerFn)

// push/send-to-all - broadcast to all windows
router.handle('push/send-to-all', ((ctx, eventName: string, ...args: unknown[]) => {
    this.server.push(eventName, { type: 'broadcast' }, ctx.clientId, eventName, args)
    return { ok: true }
}) as Rpc.HandlerFn)

// push/send-to-group - send to specific group
router.handle('push/send-to-group', ((ctx, groupId: string, eventName: string, ...args: unknown[]) => {
    this.server.push(eventName, { type: 'group', groupId }, ctx.clientId, eventName, args)
    return { ok: true }
}) as Rpc.HandlerFn)

// push/send-to-client - send to specific clientId
router.handle('push/send-to-client', ((ctx, clientId: string, eventName: string, ...args: unknown[]) => {
    this.server.push(eventName, { type: 'client', clientId }, ctx.clientId, eventName, args)
    return { ok: true }
}) as Rpc.HandlerFn)
```

- [ ] **Step 2: Update main/index.ts to pass WindowManager to RpcDebugService**

```typescript
// Change from:
new RpcDebugService(rpcServer)
// To:
new RpcDebugService(rpcServer, windowRegistry, windowManager)
```

---

## Task 4: Add window:create IPC handler in main

**Files:**
- Modify: `apps/desktop/src/main/index.ts`

- [ ] **Step 1: Add ipcMain.handle for window:create**

This is separate from the RPC handlers because BrowserWindow creation must happen via ipcMain.handle (not through the RPC invoke channel, which is only for renderer→main calls that return data, not create windows):

```typescript
// Add after rpcServer initialization:
ipcMain.handle('window:create', async (_, groupId: string | null) => {
    const { window, clientId } = windowManager.createDebugWindow(groupId ?? undefined)
    windowRegistry.registerWindow(window, groupId ?? undefined)
    return { clientId, windowId: window.id }
})
```

---

## Task 5: Expose api.createWindow in preload

**Files:**
- Modify: `apps/desktop/src/preload/index.ts`

- [ ] **Step 1: Add createWindow to exposed api**

Replace the api object with:

```typescript
const api = {
    getRpcClient: () => ({
        clientId: rpcClient.clientId,
        groupId: rpcClient.groupId,
        call: rpcClient.call.bind(rpcClient),
        stream: rpcClient.stream.bind(rpcClient),
        onEvent: rpcClient.onEvent.bind(rpcClient),
    }),
    createWindow: (groupId: string | null) =>
        ipcRenderer.invoke('window:create', groupId),
}
```

Note: TypeScript will complain `api.createWindow` doesn't exist on the type. Use `// eslint-disable-next-line @typescript-eslint/no-explicit-any` or extend the window type.

---

## Task 6: Update rpc-debug.tsx with new UI components

**Files:**
- Modify: `apps/desktop/src/renderer/src/routes/rpc-debug.tsx`

- [ ] **Step 1: Add WindowInfoCard component**

```typescript
function WindowInfoCard({ styles }: { styles: ReturnType<typeof useThemeColors> }) {
    const [info, setInfo] = useState<{ clientId: string; groupId: string | null } | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleFetch = async () => {
        setLoading(true)
        setError(null)
        try {
            const client = getRpcClient()
            const result = await client.call<{ clientId: string; groupId: string | null }>('/debug/window/info')
            setInfo(result)
        } catch (err) {
            setError((err as Error).message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={styles['card']}>
            <h3 style={styles['cardTitle']}>Window Info</h3>
            <button style={styles['button']} onClick={handleFetch} disabled={loading}>
                {loading ? 'Fetching...' : 'Refresh'}
            </button>
            {info && (
                <div style={styles['result']}>
                    <strong>clientId:</strong> {info.clientId}
                    <br />
                    <strong>groupId:</strong> {info.groupId ?? '(none)'}
                </div>
            )}
            {error && <div style={styles['error']}>Error: {error}</div>}
        </div>
    )
}
```

- [ ] **Step 2: Add WindowManagerCard component**

```typescript
function WindowManagerCard({ styles }: { styles: ReturnType<typeof useThemeColors> }) {
    const [groupId, setGroupId] = useState<string>('none')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{ clientId: string; windowId: number } | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleCreate = async () => {
        setLoading(true)
        setError(null)
        setResult(null)
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const group = groupId === 'none' ? null : groupId
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res = await (window as any).api.createWindow(group)
            setResult(res)
        } catch (err) {
            setError((err as Error).message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={styles['card']}>
            <h3 style={styles['cardTitle']}>Window Manager</h3>
            <div style={styles['inputGroup']}>
                <label style={styles['label']}>Group</label>
                <select
                    style={styles['input']}
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                >
                    <option value="none">No Group</option>
                    <option value="group-a">Group A</option>
                    <option value="group-b">Group B</option>
                </select>
            </div>
            <button style={styles['button']} onClick={handleCreate} disabled={loading}>
                {loading ? 'Creating...' : 'Spawn Window'}
            </button>
            {result && (
                <div style={styles['result']}>
                    <strong>clientId:</strong> {result.clientId}
                    <br />
                    <strong>windowId:</strong> {result.windowId}
                </div>
            )}
            {error && <div style={styles['error']}>Error: {error}</div>}
        </div>
    )
}
```

- [ ] **Step 3: Add BroadcastCard component**

```typescript
function BroadcastCard({ styles }: { styles: ReturnType<typeof useThemeColors> }) {
    const [eventName, setEventName] = useState('broadcast-event')
    const [targetGroup, setTargetGroup] = useState('group-a')
    const [targetClientId, setTargetClientId] = useState('')
    const [message, setMessage] = useState('Hello from broadcast!')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<unknown>(null)
    const [error, setError] = useState<string | null>(null)

    const client = getRpcClient()

    const handleSendToAll = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await client.call('/debug/push/send-to-all', eventName, message)
            setResult(res)
        } catch (err) {
            setError((err as Error).message)
        } finally {
            setLoading(false)
        }
    }

    const handleSendToGroup = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await client.call('/debug/push/send-to-group', targetGroup, eventName, message)
            setResult(res)
        } catch (err) {
            setError((err as Error).message)
        } finally {
            setLoading(false)
        }
    }

    const handleSendToClient = async () => {
        if (!targetClientId.trim()) {
            setError('clientId is required')
            return
        }
        setLoading(true)
        setError(null)
        try {
            const res = await client.call('/debug/push/send-to-client', targetClientId, eventName, message)
            setResult(res)
        } catch (err) {
            setError((err as Error).message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={styles['card']}>
            <h3 style={styles['cardTitle']}>Broadcast</h3>
            <div style={styles['inputGroup']}>
                <label style={styles['label']}>Event Name</label>
                <input type="text" style={styles['input']} value={eventName} onChange={(e) => setEventName(e.target.value)} />
            </div>
            <div style={styles['inputGroup']}>
                <label style={styles['label']}>Message</label>
                <input type="text" style={styles['input']} value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>

            <div style={styles['buttonRow']}>
                <button style={styles['button']} onClick={handleSendToAll} disabled={loading}>Send to All</button>
                <button style={styles['button']} onClick={handleSendToGroup} disabled={loading}>Send to Group</button>
                <button style={styles['button']} onClick={handleSendToClient} disabled={loading}>Send to Client</button>
            </div>

            <div style={styles['inputRow']}>
                <div style={styles['inputGroup']}>
                    <label style={styles['label']}>Target Group</label>
                    <select style={styles['input']} value={targetGroup} onChange={(e) => setTargetGroup(e.target.value)}>
                        <option value="group-a">Group A</option>
                        <option value="group-b">Group B</option>
                    </select>
                </div>
                <div style={styles['inputGroup']}>
                    <label style={styles['label']}>Target ClientId</label>
                    <input type="text" style={styles['input']} value={targetClientId} onChange={(e) => setTargetClientId(e.target.value)} placeholder="client-123" />
                </div>
            </div>

            {result && <div style={styles['result']}>{JSON.stringify(result)}</div>}
            {error && <div style={styles['error']}>Error: {error}</div>}
        </div>
    )
}
```

- [ ] **Step 4: Update EventListenerCard to display broadcast metadata**

The broadcast handlers push: `ctx.clientId, eventName, args` as three separate arguments. The `onEvent` listener receives these as `argArray = [senderClientId, eventName, argsArray]`.

Update the event display section:

```typescript
// Replace the event display div with:
{events.map((e, i) => (
    <div key={i}>
        - &quot;{e.name}&quot;: sender={String((e.data as unknown[])[0])}, eventName={String((e.data as unknown[])[1])}, payload={JSON.stringify((e.data as unknown[])[2])}
    </div>
))}
```

- [ ] **Step 5: Add new components to RpcDebugPage render**

Add to the grid in `RpcDebugPage` (before the existing cards):

```typescript
<WindowInfoCard styles={styles} />
<WindowManagerCard styles={styles} />
<BroadcastCard styles={styles} />
```

---

## Task 7: Build and verify

- [ ] **Step 1: Run type check**

```bash
cd apps/desktop && bunx tsc --noEmit
```

- [ ] **Step 2: Run linter**

```bash
cd apps/desktop && bunx oxlint
```

- [ ] **Step 3: Format code**

```bash
cd apps/desktop && bunx oxfmt
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(rpc-debug): add multi-window broadcast testing"
```
