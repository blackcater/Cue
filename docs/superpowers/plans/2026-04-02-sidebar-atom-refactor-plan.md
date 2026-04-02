# Sidebar Atom 重构实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构 Sidebar 中的 FolderCell 和 ThreadTitleCell，将菜单事件逻辑下沉到上层组件，同时使用 atom 管理 ThreadTitleCell 的按钮显示和菜单选中状态。

**Architecture:** 修改 SidebarState 类型定义，更新相关 atom，将 FolderCell 菜单回调传递到 ProjectSection 处理，ThreadTitleCell 菜单事件在组件内通过 atom 处理。

**Tech Stack:** TypeScript, React, Jotai (atoms/sidebar.ts, atoms/project.ts)

---

## 文件变更概览

| 文件 | 变更类型 | 职责 |
|------|----------|------|
| `types/sidebar.ts` | 修改 | 类型定义：viewMode→organizeMode, sortField→sortBy, 新增showMode |
| `atoms/sidebar.ts` | 修改 | atom 默认值更新 |
| `atoms/thread.ts` | 修改 | 更新 sortField→sortBy，移除 sortOrder |
| `cell/FolderCell.tsx` | 修改 | 添加菜单回调 props |
| `cell/ThreadTitleCell.tsx` | 修改 | 使用 atom 控制按钮显示，菜单事件内部处理 atom |
| `section/FolderView.tsx` | 修改 | 传递菜单回调给 FolderCell |
| `ProjectSection.tsx` | 修改 | 实现事件处理逻辑 |

---

## Task 1: 修改 types/sidebar.ts

**Files:**
- Modify: `apps/desktop/src/renderer/src/types/sidebar.ts`

- [ ] **Step 1: 更新类型定义**

```typescript
export type OrganizeMode = 'folder' | 'flat'
export type SortBy = 'updatedAt' | 'createdAt'
export type ShowMode = 'all' | 'relevant'

export interface SidebarState {
  collapsed: boolean
  width: number
  organizeMode: OrganizeMode
  sortBy: SortBy
  showMode: ShowMode
}
```

- [ ] **Step 2: 提交**

```bash
git add apps/desktop/src/renderer/src/types/sidebar.ts
git commit -m "refactor(sidebar): update SidebarState types - viewMode→organizeMode, sortField→sortBy, add showMode"
```

---

## Task 2: 修改 atoms/sidebar.ts

**Files:**
- Modify: `apps/desktop/src/renderer/src/atoms/sidebar.ts`

- [ ] **Step 1: 更新 atom 默认值**

```typescript
export const sidebarAtom = atomWithStorage<SidebarState>('sidebar-state', {
  collapsed: false,
  width: 256,
  organizeMode: 'folder',
  sortBy: 'updatedAt',
  showMode: 'all',
})
```

- [ ] **Step 2: 提交**

```bash
git add apps/desktop/src/renderer/src/atoms/sidebar.ts
git commit -m "refactor(sidebar): update sidebarAtom default values"
```

---

## Task 3: 修改 atoms/thread.ts

**Files:**
- Modify: `apps/desktop/src/renderer/src/atoms/thread.ts`

- [ ] **Step 1: 更新 sortField → sortBy，移除 sortOrder**

修改 `flatThreadsAtom` 和 `projectTreeAtom` 中的排序逻辑：

当前代码：
```typescript
const field: ThreadSortField = sidebar.sortField
const order: number = sidebar.sortOrder === 'asc' ? 1 : -1
```

更新为：
```typescript
const field: SortBy = sidebar.sortBy
const order = -1 // 默认降序（最新在前）
```

同时更新 import：
```typescript
import type { SortBy } from '../types/sidebar'
```

- [ ] **Step 2: 提交**

```bash
git add apps/desktop/src/renderer/src/atoms/thread.ts
git commit -m "refactor(sidebar): update thread atoms to use sortBy and default desc order"
```

---

## Task 4: 修改 FolderCell.tsx

**Files:**
- Modify: `apps/desktop/src/renderer/src/components/app-shell/sidebar/cell/FolderCell.tsx`

- [ ] **Step 1: 添加菜单回调 Props**

在 `FolderCellProps` 接口中添加：
```typescript
onMenuOpenInFinder?: (id: string) => void
onMenuCreateWorktree?: (id: string) => void
onMenuEditName?: (id: string) => void
onMenuArchiveThreads?: (id: string) => void
onMenuDelete?: (id: string) => void
```

- [ ] **Step 2: 更新组件 Props 接收**

```typescript
export function FolderCell({
  className,
  id,
  title,
  isExpanded,
  isDragging,
  onToggle,
  onAddThread,
  onMenuOpenInFinder,
  onMenuCreateWorktree,
  onMenuEditName,
  onMenuArchiveThreads,
  onMenuDelete,
}: Readonly<FolderCellProps>) {
```

- [ ] **Step 3: 更新菜单项 onClick，添加 e.preventDefault()**

```typescript
<DropdownMenuItem
  onClick={(e) => {
    e.preventDefault()
    onMenuOpenInFinder?.(id)
  }}
>
  <HugeiconsIcon icon={Folder03Icon} />
  Open in Finder
</DropdownMenuItem>
```

每个菜单项都需要添加 `e.preventDefault()`。

- [ ] **Step 4: 提交**

```bash
git add apps/desktop/src/renderer/src/components/app-shell/sidebar/cell/FolderCell.tsx
git commit -m "feat(FolderCell): add menu callback props with preventDefault"
```

---

## Task 5: 修改 ThreadTitleCell.tsx

**Files:**
- Modify: `apps/desktop/src/renderer/src/components/app-shell/sidebar/cell/ThreadTitleCell.tsx`

- [ ] **Step 1: 添加 import**

```typescript
import { useAtomValue, useSetAtom } from 'jotai'
import { isAllProjectsExpandedAtom, isAllProjectsCollapsedAtom } from '@renderer/atoms/project'
import { sidebarAtom } from '@renderer/atoms/sidebar'
import type { OrganizeMode, SortBy, ShowMode } from '@renderer/types/sidebar'
```

- [ ] **Step 2: 使用 atom 替换 TODO 注释**

删除：
```typescript
const isAllProjectsExpanded = true // TODO: 从 state 中获取
const isAllProjectsCollapsed = false // TODO: 从 state 中获取
```

添加：
```typescript
const isAllProjectsExpanded = useAtomValue(isAllProjectsExpandedAtom)
const isAllProjectsCollapsed = useAtomValue(isAllProjectsCollapsedAtom)
const [sidebar, setSidebar] = useAtom(sidebarAtom)
```

- [ ] **Step 3: 添加菜单事件处理函数**

```typescript
const handleOrganizeChange = (mode: OrganizeMode) => {
  setSidebar((prev) => ({ ...prev, organizeMode: mode }))
}

const handleSortByChange = (sortBy: SortBy) => {
  setSidebar((prev) => ({ ...prev, sortBy }))
}

const handleShowModeChange = (mode: ShowMode) => {
  setSidebar((prev) => ({ ...prev, showMode: mode }))
}
```

- [ ] **Step 4: 更新 CheckboxItem 的 checked 和 onCheckedChange**

Organize 区块：
```typescript
<DropdownMenuCheckboxItem
  checked={sidebar.organizeMode === 'folder'}
  onCheckedChange={() => handleOrganizeChange('folder')}
>
  <HugeiconsIcon icon={Folder01Icon} />
  By Project
</DropdownMenuCheckboxItem>
<DropdownMenuCheckboxItem
  checked={sidebar.organizeMode === 'flat'}
  onCheckedChange={() => handleOrganizeChange('flat')}
>
  <HugeiconsIcon icon={Clock01Icon} />
  Chronological list
</DropdownMenuCheckboxItem>
```

Sort by 区块：
```typescript
<DropdownMenuCheckboxItem
  checked={sidebar.sortBy === 'createdAt'}
  onCheckedChange={() => handleSortByChange('createdAt')}
>
  <HugeiconsIcon icon={BubbleChatAddIcon} />
  Created
</DropdownMenuCheckboxItem>
<DropdownMenuCheckboxItem
  checked={sidebar.sortBy === 'updatedAt'}
  onCheckedChange={() => handleSortByChange('updatedAt')}
>
  <HugeiconsIcon icon={MessageEdit01Icon} />
  Updated
</DropdownMenuCheckboxItem>
```

Show 区块：
```typescript
<DropdownMenuCheckboxItem
  checked={sidebar.showMode === 'all'}
  onCheckedChange={() => handleShowModeChange('all')}
>
  <HugeiconsIcon icon={Chatting01Icon} />
  All threads
</DropdownMenuCheckboxItem>
<DropdownMenuCheckboxItem
  checked={sidebar.showMode === 'relevant'}
  onCheckedChange={() => handleShowModeChange('relevant')}
>
  <HugeiconsIcon icon={StarIcon} />
  Relevant
</DropdownMenuCheckboxItem>
```

- [ ] **Step 5: 提交**

```bash
git add apps/desktop/src/renderer/src/components/app-shell/sidebar/cell/ThreadTitleCell.tsx
git commit -m "feat(ThreadTitleCell): use atoms for button visibility and menu state"
```

---

## Task 6: 修改 FolderView.tsx

**Files:**
- Modify: `apps/desktop/src/renderer/src/components/app-shell/sidebar/section/FolderView.tsx`

- [ ] **Step 1: 更新 SortableFolderProps 添加菜单回调**

```typescript
interface SortableFolderProps {
  folder: Project
  threads: Thread[]
  index: number
  isOpen: boolean
  onToggle: (id: string) => void
  onTogglePin: (threadId: string) => void
  // 新增菜单回调
  onMenuOpenInFinder?: (id: string) => void
  onMenuCreateWorktree?: (id: string) => void
  onMenuEditName?: (id: string) => void
  onMenuArchiveThreads?: (id: string) => void
  onMenuDelete?: (id: string) => void
}
```

- [ ] **Step 2: 更新 SortableFolder 组件接收并传递回调给 FolderCell**

```typescript
function SortableFolder({
  folder,
  threads: folderThreads,
  index,
  isOpen,
  onToggle,
  onTogglePin,
  onMenuOpenInFinder,
  onMenuCreateWorktree,
  onMenuEditName,
  onMenuArchiveThreads,
  onMenuDelete,
}: Readonly<SortableFolderProps>) {
  // ...
  return (
    <FolderCell
      id={folder.id}
      title={folder.title}
      isExpanded={isOpen}
      isDragging={isDragging}
      onToggle={onToggle}
      onMenuOpenInFinder={onMenuOpenInFinder}
      onMenuCreateWorktree={onMenuCreateWorktree}
      onMenuEditName={onMenuEditName}
      onMenuArchiveThreads={onMenuArchiveThreads}
      onMenuDelete={onMenuDelete}
    />
    // ...
  )
}
```

- [ ] **Step 3: 更新 FolderView Props 和调用**

```typescript
interface FolderViewProps {
  onMenuOpenInFinder?: (id: string) => void
  onMenuCreateWorktree?: (id: string) => void
  onMenuEditName?: (id: string) => void
  onMenuArchiveThreads?: (id: string) => void
  onMenuDelete?: (id: string) => void
}

export function FolderView({
  onMenuOpenInFinder,
  onMenuCreateWorktree,
  onMenuEditName,
  onMenuArchiveThreads,
  onMenuDelete,
}: Readonly<FolderViewProps>) {
```

在 projectTree.map 中传递回调：
```typescript
<SortableFolder
  key={project.id}
  folder={project}
  threads={folderThreads}
  index={index}
  isOpen={openedProjectIds.has(project.id)}
  onToggle={handleToggleFolder}
  onTogglePin={handleTogglePin}
  onMenuOpenInFinder={onMenuOpenInFinder}
  onMenuCreateWorktree={onMenuCreateWorktree}
  onMenuEditName={onMenuEditName}
  onMenuArchiveThreads={onMenuArchiveThreads}
  onMenuDelete={onMenuDelete}
/>
```

- [ ] **Step 4: 提交**

```bash
git add apps/desktop/src/renderer/src/components/app-shell/sidebar/section/FolderView.tsx
git commit -m "feat(FolderView): pass menu callbacks to FolderCell"
```

---

## Task 7: 修改 ProjectSection.tsx

**Files:**
- Modify: `apps/desktop/src/renderer/src/components/app-shell/sidebar/ProjectSection.tsx`

- [ ] **Step 1: 添加 import**

```typescript
import { getAtomValue } from 'jotai'
import { projectsAtom } from '@renderer/atoms/project'
```

- [ ] **Step 2: 添加 Collapse All / Expand All / Add 事件处理**

```typescript
const handleCollapseAll = () => {
  const projects = getAtomValue(projectsAtom)
  setOpenedProjectIds(new Set(projects.map((p) => p.id)))
}

const handleExpandAll = () => {
  setOpenedProjectIds(new Set())
}

const handleAddFolder = () => {
  // TODO: Add Project
  console.log('Add folder clicked')
}

// FolderCell 菜单处理
const handleMenuOpenInFinder = (id: string) => {
  console.log('Open in Finder:', id)
}

const handleMenuCreateWorktree = (id: string) => {
  console.log('Create worktree:', id)
}

const handleMenuEditName = (id: string) => {
  console.log('Edit name:', id)
}

const handleMenuArchiveThreads = (id: string) => {
  console.log('Archive threads:', id)
}

const handleMenuDelete = (id: string) => {
  console.log('Delete:', id)
}
```

- [ ] **Step 3: 更新 ThreadTitleCell 调用，添加 Collapse/Expand All 回调**

```typescript
<ThreadTitleCell
  title="Threads"
  onCollapseAll={handleCollapseAll}
  onExpandAll={handleExpandAll}
  onAdd={handleAddFolder}
/>
```

- [ ] **Step 4: 更新 FolderView 调用，传递菜单回调**

```typescript
<FolderView
  onMenuOpenInFinder={handleMenuOpenInFinder}
  onMenuCreateWorktree={handleMenuCreateWorktree}
  onMenuEditName={handleMenuEditName}
  onMenuArchiveThreads={handleMenuArchiveThreads}
  onMenuDelete={handleMenuDelete}
/>
```

- [ ] **Step 5: 提交**

```bash
git add apps/desktop/src/renderer/src/components/app-shell/sidebar/ProjectSection.tsx
git commit -m "feat(ProjectSection): implement folder menu handlers and collapse/expand all"
```

---

## Task 8: 验证类型检查

**Files:**
- None (verification only)

- [ ] **Step 1: 运行 TypeScript 类型检查**

```bash
cd apps/desktop && bunx tsc --noEmit
```

- [ ] **Step 2: 运行 lint 检查**

```bash
cd apps/desktop && bunx oxlint
```

- [ ] **Step 3: 运行 format 检查**

```bash
cd apps/desktop && bunx oxfmt --check
```

预期：无错误

---

## 实施检查清单

- [ ] Task 1: types/sidebar.ts 修改完成
- [ ] Task 2: atoms/sidebar.ts 修改完成
- [ ] Task 3: atoms/thread.ts 修改完成
- [ ] Task 4: FolderCell.tsx 修改完成
- [ ] Task 5: ThreadTitleCell.tsx 修改完成
- [ ] Task 6: FolderView.tsx 修改完成
- [ ] Task 7: ProjectSection.tsx 修改完成
- [ ] Task 8: 类型检查和 lint 通过
