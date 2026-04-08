# Browser Window Manager Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 Browser 窗口管理器 Panel，作为 Browser 独立窗口的"控制面板"

**Architecture:**
- 技术方案: craft-agents-oss 方案（BrowserView + CDP）
- 状态管理: Jotai atoms 同步 BrowserInstanceInfo
- 事件: IPC 事件同步状态变化

**Tech Stack:** React 19, TailwindCSS, hugeicons, Jotai, Electron BrowserView

---

## File Structure

```
apps/desktop/src/main/handlers/browser.ts      # BrowserHandler (new)
apps/desktop/src/main/handlers/browser-cdp.ts   # CDP wrapper (new)
apps/desktop/src/main/handlers/index.ts          # Update
apps/desktop/src/preload/expose.ts             # Update
apps/desktop/src/renderer/src/features/chat/components/panel/browser/
├── BrowserWindowManagerPanel.tsx  # Main component
├── BrowserWindowManagerHeader.tsx # Header
├── BrowserWindowList.tsx         # Window list
├── BrowserWindowItem.tsx         # Single window item
├── NewBrowserButton.tsx          # New window button
└── index.ts
apps/desktop/src/renderer/src/stores/
├── browser.atoms.ts              # Browser state atoms (new)
└── index.ts                       # Update
```

---

## Task 1: Create Browser Atoms

**Files:**
- Create: `apps/desktop/src/renderer/src/stores/browser.atoms.ts`

- [ ] **Step 1: Create browser.atoms.ts**

```typescript
// apps/desktop/src/renderer/src/stores/browser.atoms.ts
import { atom } from 'jotai'

export interface BrowserInstanceInfo {
  id: string
  url: string
  title: string
  favicon: string | null
  isLoading: boolean
  canGoBack: boolean
  canGoForward: boolean
  boundSessionId: string | null
  ownerType: 'session' | 'manual'
  ownerSessionId: string | null
  isVisible: boolean
  agentControlActive: boolean
  themeColor: string | null
}

/** Map of all browser instances by ID */
export const browserInstancesMapAtom = atom<Map<string, BrowserInstanceInfo>>(new Map())

/** Derived: array of all browser instances */
export const browserInstancesAtom = atom<BrowserInstanceInfo[]>(
  (get) => Array.from(get(browserInstancesMapAtom).values())
)

/** Currently active browser instance ID */
export const activeBrowserInstanceIdAtom = atom<string | null>(null)

/** Derived: currently active browser instance */
export const activeBrowserInstanceAtom = atom<BrowserInstanceInfo | null>((get) => {
  const activeId = get(activeBrowserInstanceIdAtom)
  if (!activeId) return null
  return get(browserInstancesMapAtom).get(activeId) ?? null
})

/** Update a single browser instance */
export const updateBrowserInstanceAtom = atom(
  null,
  (get, set, info: BrowserInstanceInfo) => {
    const map = new Map(get(browserInstancesMapAtom))
    map.set(info.id, info)
    set(browserInstancesMapAtom, map)
  }
)

/** Remove a browser instance */
export const removeBrowserInstanceAtom = atom(
  null,
  (get, set, id: string) => {
    const map = new Map(get(browserInstancesMapAtom))
    map.delete(id)
    set(browserInstancesMapAtom, map)
  }
)
```

- [ ] **Step 2: Commit**

```bash
git add apps/desktop/src/renderer/src/stores/browser.atoms.ts
git commit -m "feat: add browser state atoms"
```

---

## Task 2: Create BrowserHandler (Main Process)

**Files:**
- Create: `apps/desktop/src/main/handlers/browser.ts`
- Modify: `apps/desktop/src/main/handlers/index.ts`
- Modify: `apps/desktop/src/preload/expose.ts`

- [ ] **Step 1: Create BrowserHandler class**

```typescript
// apps/desktop/src/main/handlers/browser.ts
import { BrowserView, BrowserWindow, app } from 'electron'
import type { BrowserInstanceInfo } from '@renderer/stores/browser.atoms'

export interface BrowserPaneCreateOptions {
  id?: string
  show?: boolean
  bindToSessionId?: string
}

export interface AccessibilitySnapshot {
  // Simplified - actual implementation from craft-agents-oss
  nodes: Array<{
    ref: string
    role: string
    name: string
    children?: string[]
  }>
}

export class BrowserHandler {
  private instances: Map<string, {
    window: BrowserWindow
    view: BrowserView
    info: BrowserInstanceInfo
  }> = new Map()

  private stateChangeCallback: ((info: BrowserInstanceInfo) => void) | null = null
  private removedCallback: ((id: string) => void) | null = null

  onStateChange(callback: (info: BrowserInstanceInfo) => void): void {
    this.stateChangeCallback = callback
  }

  onRemoved(callback: (id: string) => void): void {
    this.removedCallback = callback
  }

  private notifyStateChange(info: BrowserInstanceInfo): void {
    this.stateChangeCallback?.(info)
  }

  async create(input?: string | BrowserPaneCreateOptions): Promise<string> {
    const id = typeof input === 'string' ? input : (input?.id || crypto.randomUUID())
    const show = typeof input === 'object' ? input?.show : true

    // Create browser window with view
    const window = new BrowserWindow({
      width: 1200,
      height: 800,
      show,
      webPreferences: {
        partition: 'persist:browser-pane',
        nodeIntegration: false,
        contextIsolation: true,
      },
    })

    const view = new BrowserView()
    window.addBrowserView(view)

    const info: BrowserInstanceInfo = {
      id,
      url: '',
      title: 'New Tab',
      favicon: null,
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      boundSessionId: null,
      ownerType: 'manual',
      ownerSessionId: null,
      isVisible: true,
      agentControlActive: false,
      themeColor: null,
    }

    this.instances.set(id, { window, view, info })
    this.notifyStateChange(info)

    return id
  }

  destroy(id: string): void {
    const instance = this.instances.get(id)
    if (instance) {
      instance.window.destroy()
      this.instances.delete(id)
      this.removedCallback?.(id)
    }
  }

  list(): BrowserInstanceInfo[] {
    return Array.from(this.instances.values()).map((i) => i.info)
  }

  async navigate(id: string, url: string): Promise<void> {
    const instance = this.instances.get(id)
    if (!instance) return

    instance.info.isLoading = true
    this.notifyStateChange(instance.info)

    try {
      await instance.view.webContents.loadURL(url)
      instance.info.url = url
      instance.info.isLoading = false
      instance.info.canGoBack = instance.view.webContents.canGoBack()
      instance.info.canGoForward = instance.view.webContents.canGoForward()
    } catch (err) {
      instance.info.isLoading = false
      console.error('Navigation error:', err)
    }

    this.notifyStateChange(instance.info)
  }

  goBack(id: string): void {
    const instance = this.instances.get(id)
    if (instance?.info.canGoBack) {
      instance.view.webContents.goBack()
    }
  }

  goForward(id: string): void {
    const instance = this.instances.get(id)
    if (instance?.info.canGoForward) {
      instance.view.webContents.goForward()
    }
  }

  reload(id: string): void {
    const instance = this.instances.get(id)
    instance?.view.webContents.reload()
  }

  stop(id: string): void {
    const instance = this.instances.get(id)
    instance?.view.webContents.stop()
  }

  focus(id: string): void {
    const instance = this.instances.get(id)
    if (instance) {
      instance.window.focus()
    }
  }

  // CDP operations
  async getAccessibilitySnapshot(id: string): Promise<AccessibilitySnapshot> {
    const instance = this.instances.get(id)
    if (!instance) throw new Error('Instance not found')

    // Use CDP to get accessibility tree
    const snapshot = await instance.view.webContents.executeJavaScript(`
      (function() {
        function getAccessibilityNode(node, ref) {
          const children = [];
          let childRef = ref + 1;

          const children = Array.from(node.children || []).map(child => {
            const childRef = childRef++;
            children.push(getAccessibilityNode(child, childRef));
            return childRef - 1;
          });

          return {
            ref: '@e' + ref,
            role: node.role,
            name: node.name || '',
            children
          };
        }

        return getAccessibilityNode(
          JSON.parse('${JSON.stringify({ role: 'WebArea', name: document.title }) }'),
          1
        );
      })()
    `)

    return snapshot
  }

  async clickElement(id: string, ref: string): Promise<void> {
    // Parse ref like "@e1" and click element
    // Implementation depends on CDP accessibility tree
  }

  async fillElement(id: string, ref: string, value: string): Promise<void> {
    // Fill form element by ref
  }

  async selectOption(id: string, ref: string, value: string): Promise<void> {
    // Select dropdown option by ref
  }

  async screenshot(id: string): Promise<{ base64: string }> {
    const instance = this.instances.get(id)
    if (!instance) throw new Error('Instance not found')

    const image = await instance.view.webContents.capturePage()
    return { base64: image.toPNG().toString('base64') }
  }

  // Registration
  static registerHandlers(): void {
    // TODO: Register with RPC server
  }
}
```

- [ ] **Step 2: Update handlers/index.ts**

```typescript
// apps/desktop/src/main/handlers/index.ts
import { FilesHandler } from './files'
import { registerSystemHandlers } from './system'
import { GitHandler } from './git'
import { BrowserHandler } from './browser'

export function registerHandlers() {
  registerSystemHandlers()
  FilesHandler.registerHandlers()
  GitHandler.registerHandlers()
  BrowserHandler.registerHandlers()
}
```

- [ ] **Step 3: Update preload/expose.ts**

```typescript
// apps/desktop/src/preload/expose.ts
// Add browser API
const browser = buildCallApi<BrowserHandler>('browser', [
  'create',
  'destroy',
  'list',
  'navigate',
  'goBack',
  'goForward',
  'reload',
  'stop',
  'focus',
  'getAccessibilitySnapshot',
  'clickElement',
  'fillElement',
  'selectOption',
  'screenshot',
], rpc)
```

- [ ] **Step 4: Commit**

```bash
git add apps/desktop/src/main/handlers/browser.ts apps/desktop/src/main/handlers/index.ts apps/desktop/src/preload/expose.ts
git commit -m "feat: add BrowserHandler with BrowserView management"
```

---

## Task 3: Create BrowserWindowManagerPanel Components

**Files:**
- Create: `apps/desktop/src/renderer/src/features/chat/components/panel/browser/`

- [ ] **Step 1: Create BrowserWindowManagerHeader.tsx**

```tsx
// apps/desktop/src/renderer/src/features/chat/components/panel/browser/BrowserWindowManagerHeader.tsx
import { HugeiconsWindow } from '@hugeicons/react'

import { PanelHeader } from '../shared'

interface BrowserWindowManagerHeaderProps {
  windowCount: number
  onNewWindow?: () => void
}

export function BrowserWindowManagerHeader({
  windowCount,
  onNewWindow,
}: BrowserWindowManagerHeaderProps) {
  return (
    <PanelHeader
      icon={HugeiconsWindow}
      label="Browser Windows"
      iconClass="text-sky-600/70"
    >
      {windowCount > 0 && (
        <span className="text-[10px] tabular-nums text-foreground/35">
          {windowCount}
        </span>
      )}
      {onNewWindow && (
        <button
          onClick={onNewWindow}
          className="inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md text-foreground/35 transition-colors hover:text-foreground/60 hover:bg-foreground/[0.06]"
          title="New Browser Window"
        >
          +
        </button>
      )}
    </PanelHeader>
  )
}
```

- [ ] **Step 2: Create BrowserWindowItem.tsx**

```tsx
// apps/desktop/src/renderer/src/features/chat/components/panel/browser/BrowserWindowItem.tsx
import { memo, useCallback } from 'react'
import {
  HugeiconsWindow,
  HugeiconsGlobe,
  HugeiconsRefresh,
  HugeiconsArrowLeft,
  HugeiconsArrowRight,
  HugeiconsClose,
} from '@hugeicons/react'

import type { BrowserInstanceInfo } from '@renderer/stores/browser.atoms'

interface BrowserWindowItemProps {
  instance: BrowserInstanceInfo
  onFocus: (id: string) => void
  onClose: (id: string) => void
  onNavigate?: (id: string, url: string) => void
}

export const BrowserWindowItem = memo(function BrowserWindowItem({
  instance,
  onFocus,
  onClose,
  onNavigate,
}: BrowserWindowItemProps) {
  const handleClick = useCallback(() => {
    onFocus(instance.id)
  }, [instance.id, onFocus])

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onClose(instance.id)
    },
    [instance.id, onClose]
  )

  const handleBack = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      // Trigger goBack via API
    },
    []
  )

  const handleForward = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      // Trigger goForward via API
    },
    []
  )

  const handleReload = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      // Trigger reload via API
    },
    []
  )

  return (
    <div
      className="group flex cursor-pointer items-center gap-2 rounded px-2 py-2 hover:bg-foreground/[0.05] transition-colors"
      onClick={handleClick}
    >
      {/* Favicon or Globe icon */}
      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
        {instance.favicon ? (
          <img src={instance.favicon} className="h-4 w-4" alt="" />
        ) : (
          <HugeiconsGlobe className="h-4 w-4 text-muted-foreground/50" />
        )}
      </span>

      {/* Title and URL */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-xs font-medium text-foreground/80">
          {instance.title || 'New Tab'}
        </span>
        <span className="truncate text-[10px] text-muted-foreground/50">
          {instance.url || 'about:blank'}
        </span>
      </div>

      {/* Loading indicator */}
      {instance.isLoading && (
        <HugeiconsRefresh className="h-3 w-3 animate-spin text-muted-foreground/50" />
      )}

      {/* Navigation controls */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleBack}
          disabled={!instance.canGoBack}
          className="rounded p-0.5 text-muted-foreground/50 hover:text-foreground disabled:opacity-30"
          title="Go Back"
        >
          <HugeiconsArrowLeft className="h-3 w-3" />
        </button>
        <button
          onClick={handleForward}
          disabled={!instance.canGoForward}
          className="rounded p-0.5 text-muted-foreground/50 hover:text-foreground disabled:opacity-30"
          title="Go Forward"
        >
          <HugeiconsArrowRight className="h-3 w-3" />
        </button>
        <button
          onClick={handleReload}
          className="rounded p-0.5 text-muted-foreground/50 hover:text-foreground"
          title="Reload"
        >
          <HugeiconsRefresh className="h-3 w-3" />
        </button>
        <button
          onClick={handleClose}
          className="rounded p-0.5 text-muted-foreground/50 hover:text-destructive"
          title="Close"
        >
          <HugeiconsClose className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
})
```

- [ ] **Step 3: Create BrowserWindowList.tsx**

```tsx
// apps/desktop/src/renderer/src/features/chat/components/panel/browser/BrowserWindowList.tsx
import { useAtom } from 'jotai'
import { useCallback } from 'jotai'

import { browserInstancesAtom } from '@renderer/stores/browser.atoms'
import { browserApi } from '@renderer/api'

import { BrowserWindowItem } from './BrowserWindowItem'

interface BrowserWindowListProps {}

export function BrowserWindowList({}: BrowserWindowListProps) {
  const [instances] = useAtom(browserInstancesAtom)

  const handleFocus = useCallback(async (id: string) => {
    await browserApi.focus(id)
  }, [])

  const handleClose = useCallback(async (id: string) => {
    await browserApi.destroy(id)
  }, [])

  if (instances.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8">
        <HugeiconsWindow className="h-8 w-8 text-muted-foreground/20" />
        <p className="text-xs text-muted-foreground/50">No browser windows open</p>
        <p className="text-[10px] text-muted-foreground/30">Click + to create one</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      {instances.map((instance) => (
        <BrowserWindowItem
          key={instance.id}
          instance={instance}
          onFocus={handleFocus}
          onClose={handleClose}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Create NewBrowserButton.tsx**

```tsx
// apps/desktop/src/renderer/src/features/chat/components/panel/browser/NewBrowserButton.tsx
import { useCallback } from 'react'
import { HugeiconsPlus } from '@hugeicons/react'

import { browserApi } from '@renderer/api'

interface NewBrowserButtonProps {}

export function NewBrowserButton({}: NewBrowserButtonProps) {
  const handleClick = useCallback(async () => {
    await browserApi.create({ show: true })
  }, [])

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 rounded px-3 py-2 text-xs text-muted-foreground/70 hover:bg-foreground/[0.05] hover:text-foreground/80 transition-colors"
    >
      <HugeiconsPlus className="h-3 w-3" />
      New Window
    </button>
  )
}
```

- [ ] **Step 5: Create BrowserWindowManagerPanel.tsx**

```tsx
// apps/desktop/src/renderer/src/features/chat/components/panel/browser/BrowserWindowManagerPanel.tsx
import { useEffect } from 'react'
import { useAtom } from 'jotai'

import { browserInstancesAtom, browserInstancesMapAtom } from '@renderer/stores/browser.atoms'
import { browserApi } from '@renderer/api'

import { BrowserWindowManagerHeader } from './BrowserWindowManagerHeader'
import { BrowserWindowList } from './BrowserWindowList'
import { NewBrowserButton } from './NewBrowserButton'

export function BrowserWindowManagerPanel() {
  const [instances] = useAtom(browserInstancesAtom)
  const [, setInstancesMap] = useAtom(browserInstancesMapAtom)

  // Sync browser instances on mount and via events
  useEffect(() => {
    const syncInstances = async () => {
      const list = await browserApi.list()
      const map = new Map(list.map((i) => [i.id, i]))
      setInstancesMap(map)
    }

    syncInstances()

    // Subscribe to state changes
    const unsubscribeState = browserApi.onStateChanged((info) => {
      setInstancesMap((prev) => {
        const next = new Map(prev)
        next.set(info.id, info)
        return next
      })
    })

    const unsubscribeRemoved = browserApi.onRemoved((id) => {
      setInstancesMap((prev) => {
        const next = new Map(prev)
        next.delete(id)
        return next
      })
    })

    return () => {
      unsubscribeState()
      unsubscribeRemoved()
    }
  }, [setInstancesMap])

  const handleNewWindow = useCallback(async () => {
    await browserApi.create({ show: true })
  }, [])

  return (
    <div className="flex h-full flex-col">
      <BrowserWindowManagerHeader
        windowCount={instances.length}
        onNewWindow={handleNewWindow}
      />

      <div className="flex-1 min-h-0 overflow-auto">
        <BrowserWindowList />
      </div>

      <div className="border-t p-2">
        <NewBrowserButton />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create index.ts**

```typescript
// apps/desktop/src/renderer/src/features/chat/components/panel/browser/index.ts
export { BrowserWindowManagerPanel } from './BrowserWindowManagerPanel'
export { BrowserWindowManagerHeader } from './BrowserWindowManagerHeader'
export { BrowserWindowList } from './BrowserWindowList'
export { BrowserWindowItem } from './BrowserWindowItem'
export { NewBrowserButton } from './NewBrowserButton'
```

- [ ] **Step 7: Commit**

```bash
git add apps/desktop/src/renderer/src/features/chat/components/panel/browser/
git commit -m "feat: add BrowserWindowManagerPanel components"
```

---

## Task 4: Update PanelRouter

**Files:**
- Modify: `apps/desktop/src/renderer/src/features/chat/components/panel/PanelRouter.tsx`

- [ ] **Step 1: Update PanelRouter to use BrowserWindowManagerPanel**

```tsx
import type { PanelType } from '@renderer/types/panel'

import { BrowserPanel } from './BrowserPanel'
import { GitPanel } from './git/GitPanel'
import { OutlinePanel } from './outline/OutlinePanel'
import { PreviewPanel } from './PreviewPanel'
import { ProjectFilesPanel } from './project-files/ProjectFilesPanel'
import { BrowserWindowManagerPanel } from './browser/BrowserWindowManagerPanel'

interface PanelRouterProps {
  type?: PanelType
  messages?: Array<{
    id: string
    role: string
    content: unknown
    tool_calls?: unknown[]
  }>
  onNavigateToMessage?: (messageId: string) => void
}

export function PanelRouter({ type, messages = [], onNavigateToMessage }: Readonly<PanelRouterProps>) {
  switch (type) {
    case 'git':
      return <GitPanel />
    case 'files':
    case 'projectFiles':
      return <ProjectFilesPanel />
    case 'browser':
      // Browser panel shows when 'browser' is active
      return <BrowserWindowManagerPanel />
    case 'preview':
      return <PreviewPanel />
    case 'outline':
      if (!onNavigateToMessage) {
        return <div className="p-4 text-xs text-muted-foreground">Outline Panel requires onNavigateToMessage prop</div>
      }
      return <OutlinePanel messages={messages} onNavigate={onNavigateToMessage} />
    default:
      return null
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/desktop/src/renderer/src/features/chat/components/panel/PanelRouter.tsx
git commit -m "feat: connect BrowserWindowManagerPanel to PanelRouter"
```

---

## Verification

Run the following commands to verify:

```bash
cd apps/desktop
bun run typecheck
```

Expected: No errors

---

## Summary

完成此计划后，你将拥有：
- `BrowserHandler` — Main 进程的 Browser 实例管理
- `BrowserWindowManagerPanel` — Browser 窗口管理器面板
- `BrowserWindowList` / `BrowserWindowItem` — 窗口列表组件
- `BrowserInstanceInfo` atoms — 状态同步
- 支持新建、关闭、聚焦 Browser 窗口

---

## Next Steps

所有 5 个子计划完成后，Panel 系统重构完成。下一步：
1. 添加键盘快捷键支持（1=Git, 2=Outline, 3=ProjectFiles, 4=Browser）
2. 添加状态持久化（localStorage）
3. 添加 AI commit message 生成集成
