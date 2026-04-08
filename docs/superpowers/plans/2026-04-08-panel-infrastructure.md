# Panel Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建共享组件（PanelHeader、SearchBar、TabBar）并更新 Panel 基础设施

**Architecture:** 共享组件放在 `features/chat/components/panel/shared/` 目录，使用 hugeicons 图标库，遵循现有代码风格

**Tech Stack:** React 19, TailwindCSS, hugeicons, Jotai

---

## File Structure

```
apps/desktop/src/renderer/src/features/chat/components/panel/shared/
├── PanelHeader.tsx
├── SearchBar.tsx
├── TabBar.tsx
└── index.ts

Modified:
- apps/desktop/src/renderer/src/types/panel.ts
- apps/desktop/src/renderer/src/features/chat/components/panel/PanelRouter.tsx
- apps/desktop/src/renderer/src/features/chat/components/panel/index.ts
```

---

## Task 1: Create PanelHeader Component

**Files:**
- Create: `apps/desktop/src/renderer/src/features/chat/components/panel/shared/PanelHeader.tsx`

- [ ] **Step 1: Create PanelHeader.tsx**

```tsx
import type { LucideIcon } from 'lucide-react'

interface PanelHeaderProps {
  /** Icon component from hugeicons */
  icon?: React.ComponentType<{ className?: string }>
  /** Custom icon node — takes precedence over `icon` when provided */
  iconNode?: React.ReactNode
  label: string
  /** Optional content rendered to the right of the label (badges, counts, buttons) */
  children?: React.ReactNode
  /** Show a bottom border separator. Defaults to true */
  separator?: boolean
  /** Additional className for the header container */
  className?: string
  /** Icon color class override */
  iconClass?: string
}

export function PanelHeader({
  icon: Icon,
  iconNode,
  label,
  children,
  separator = true,
  className = 'px-3 py-2',
  iconClass = 'text-muted-foreground',
}: PanelHeaderProps) {
  return (
    <>
      <div className={`flex items-center gap-1.5 ${className}`}>
        {iconNode ?? (Icon && (
          <Icon className={`h-3 w-3 shrink-0 ${iconClass}`} />
        ))}
        <span className="text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
          {label}
        </span>
        {children && (
          <div className="ms-auto flex items-center gap-1">{children}</div>
        )}
      </div>
      {separator && (
        <div className="mx-2">
          <div className="h-px bg-foreground/[0.06]" />
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: Create shared/index.ts**

```typescript
// apps/desktop/src/renderer/src/features/chat/components/panel/shared/index.ts
export { PanelHeader } from './PanelHeader'
export { SearchBar } from './SearchBar'
export { TabBar } from './TabBar'
```

- [ ] **Step 3: Commit**

```bash
git add apps/desktop/src/renderer/src/features/chat/components/panel/shared/
git commit -m "feat: add shared panel components (PanelHeader, SearchBar, TabBar)"
```

---

## Task 2: Create SearchBar Component

**Files:**
- Create: `apps/desktop/src/renderer/src/features/chat/components/panel/shared/SearchBar.tsx`

- [ ] **Step 1: Create SearchBar.tsx**

```tsx
import { useCallback, useRef, useState } from 'react'
import { HugeiconsSearch } from '@hugeicons/react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 200,
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setLocalValue(newValue)
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onChange(newValue)
      }, debounceMs)
    },
    [onChange, debounceMs]
  )

  return (
    <div className="flex items-center gap-1.5 px-3 py-1">
      <HugeiconsSearch className="h-3 w-3 shrink-0 text-foreground/25" />
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full bg-transparent text-[11px] text-foreground/75 outline-none placeholder:text-foreground/25"
      />
    </div>
  )
}
```

---

## Task 3: Create TabBar Component

**Files:**
- Create: `apps/desktop/src/renderer/src/features/chat/components/panel/shared/TabBar.tsx`

- [ ] **Step 1: Create TabBar.tsx**

```tsx
import { forwardRef } from 'react'
import type { LucideIcon } from 'lucide-react'

export interface Tab {
  id: string
  label: string
  icon?: LucideIcon
}

interface TabBarProps {
  tabs: Tab[]
  activeTabId: string | null
  onSelectTab: (tabId: string) => void
  headerIcon?: React.ComponentType<{ className?: string }>
  headerLabel?: string
  headerActions?: React.ReactNode
  tabMaxWidth?: string
  activeClass?: string
  inactiveClass?: string
}

export const TabBar = forwardRef<HTMLDivElement, TabBarProps>(
  function TabBar(
    {
      tabs,
      activeTabId,
      onSelectTab,
      headerIcon: HeaderIcon,
      headerLabel,
      headerActions,
      tabMaxWidth = 'max-w-24',
      activeClass = 'bg-foreground/[0.08] text-foreground/80',
      inactiveClass = 'text-foreground/35 hover:text-foreground/55 hover:bg-foreground/[0.04]',
    },
    ref
  ) {
    return (
      <div ref={ref} className="flex flex-col">
        {/* Tab header with optional icon/label/actions */}
        {(HeaderIcon || headerLabel || headerActions) && (
          <div className="flex items-center gap-1.5 px-3 py-2">
            {HeaderIcon && <HeaderIcon className="h-3 w-3 shrink-0" />}
            {headerLabel && (
              <span className="text-[10px] font-semibold tracking-wider uppercase">
                {headerLabel}
              </span>
            )}
            {headerActions && (
              <div className="ms-auto flex items-center gap-1">
                {headerActions}
              </div>
            )}
          </div>
        )}

        {/* Tab list */}
        <div className="flex items-center gap-0.5 px-2">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`
                  flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium
                  transition-colors duration-75
                  ${isActive ? activeClass : inactiveClass}
                `}
                style={{ maxWidth: tabMaxWidth }}
                title={tab.label}
              >
                {tab.icon && <tab.icon className="h-3 w-3 shrink-0" />}
                <span className="truncate">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Separator */}
        <div className="mx-2 mt-1">
          <div className="h-px bg-foreground/[0.06]" />
        </div>
      </div>
    )
  }
)
```

---

## Task 4: Update PanelType

**Files:**
- Modify: `apps/desktop/src/renderer/src/types/panel.ts`

- [ ] **Step 1: Update PanelType**

```typescript
export type PanelType = 'git' | 'files' | 'browser' | 'preview' | 'outline' | 'projectFiles' | null

export interface PanelState {
  collapsed: boolean
  width: number
  type: PanelType
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/desktop/src/renderer/src/types/panel.ts
git commit -m "feat: add outline and projectFiles panel types"
```

---

## Task 5: Update PanelRouter

**Files:**
- Modify: `apps/desktop/src/renderer/src/features/chat/components/panel/PanelRouter.tsx`

- [ ] **Step 1: Update PanelRouter to add placeholder routing**

```tsx
import type { PanelType } from '@renderer/types/panel'

import { BrowserPanel } from './BrowserPanel'
import { GitPanel } from './GitPanel'
import { PreviewPanel } from './PreviewPanel'
import { FilesPanel } from './files'

interface PanelRouterProps {
  type?: PanelType
}

export function PanelRouter({ type }: Readonly<PanelRouterProps>) {
  switch (type) {
    case 'git':
      return <GitPanel />
    case 'files':
      return <FilesPanel />
    case 'browser':
      return <BrowserPanel />
    case 'preview':
      return <PreviewPanel />
    case 'outline':
      // TODO: Replace with OutlinePanel
      return <div className="p-4 text-xs text-muted-foreground">Outline Panel (TBD)</div>
    case 'projectFiles':
      // TODO: Replace with ProjectFilesPanel
      return <div className="p-4 text-xs text-muted-foreground">Project Files Panel (TBD)</div>
    default:
      return null
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/desktop/src/renderer/src/features/chat/components/panel/PanelRouter.tsx
git commit -m "feat: add outline and projectFiles routing placeholders"
```

---

## Task 6: Update panel exports

**Files:**
- Modify: `apps/desktop/src/renderer/src/features/chat/components/panel/index.ts`

- [ ] **Step 1: Update exports to include shared components**

```typescript
// Re-export shared components
export { PanelHeader } from './shared/PanelHeader'
export { SearchBar } from './shared/SearchBar'
export { TabBar } from './shared/TabBar'
export type { Tab } from './shared/TabBar'

// Panel exports
export { BrowserPanel } from './BrowserPanel'
export { GitPanel } from './GitPanel'
export { PanelRouter } from './PanelRouter'
export { PreviewPanel } from './PreviewPanel'

export { FilesPanel } from './files'
```

- [ ] **Step 2: Commit**

```bash
git add apps/desktop/src/renderer/src/features/chat/components/panel/index.ts
git commit -m "feat: export shared panel components"
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
- `PanelHeader` — 统一的 Panel 头部组件
- `SearchBar` — 带 debounce 的搜索栏组件
- `TabBar` — Tab 切换组件
- `PanelType` 更新 — 添加 `outline` 和 `projectFiles` 类型
- `PanelRouter` 更新 — 添加新 Panel 的路由占位符

下一步: 执行 `2026-04-08-gitpanel.md` 计划实现 GitPanel
