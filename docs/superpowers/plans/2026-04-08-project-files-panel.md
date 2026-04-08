# ProjectFilesPanel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构 FilesPanel 为 ProjectFilesPanel，添加搜索、实时文件监控、右键菜单、文件操作（创建/重命名/删除）等功能

**Architecture:**
- 数据获取: IPC `files.listAll(cwd)` + `buildFileTree` 构建树
- 文件监控: `files.watch(cwd)` 监听变化，150ms debounce 刷新
- 搜索: 200ms debounce，自动展开匹配目录

**Tech Stack:** React 19, TailwindCSS, hugeicons, @tanstack/react-virtual

---

## File Structure

```
apps/desktop/src/renderer/src/features/chat/components/panel/project-files/
├── ProjectFilesPanel.tsx       # Main component (refactor from FilesPanel)
├── ProjectFilesPanelHeader.tsx # Header with search
├── FileTree.tsx               # File tree component (refactor from FileTreeView)
├── FileTreeRow.tsx            # Single row with context menu
├── InlineCreateInput.tsx      # Inline file/folder creation
├── SearchBar.tsx              # Search bar component
└── index.ts

apps/desktop/src/renderer/src/features/chat/components/panel/files/
├── file-tree/ (keep for backward compatibility or remove if not needed)
└── FilesPanel.tsx (rename to ProjectFilesPanel or create new)
```

---

## Task 1: Create SearchBar Component (if not already in shared)

**Files:**
- Check: `apps/desktop/src/renderer/src/features/chat/components/panel/shared/SearchBar.tsx`
- If missing, create per Task 2 in `2026-04-08-panel-infrastructure.md`

- [ ] **Step 1: Verify SearchBar exists in shared**

If not, follow Task 2 in `2026-04-08-panel-infrastructure.md` to create it.

---

## Task 2: Create ProjectFilesPanelHeader

**Files:**
- Create: `apps/desktop/src/renderer/src/features/chat/components/panel/project-files/ProjectFilesPanelHeader.tsx`

- [ ] **Step 1: Create ProjectFilesPanelHeader.tsx**

```tsx
// apps/desktop/src/renderer/src/features/chat/components/panel/project-files/ProjectFilesPanelHeader.tsx
import { HugeiconsFolderOpen, HugeiconsRefresh } from '@hugeicons/react'

import { PanelHeader } from '../shared'
import { SearchBar } from '../shared'

interface ProjectFilesPanelHeaderProps {
  totalFiles: number
  onSearch: (query: string) => void
  onRefresh: () => void
  loading?: boolean
}

export function ProjectFilesPanelHeader({
  totalFiles,
  onSearch,
  onRefresh,
  loading,
}: ProjectFilesPanelHeaderProps) {
  return (
    <>
      <PanelHeader
        icon={HugeiconsFolderOpen}
        label="Project Files"
        iconClass="text-teal-600/70"
      >
        {totalFiles > 0 && (
          <span className="text-[10px] tabular-nums text-foreground/35">
            {totalFiles}
          </span>
        )}
        <button
          onClick={onRefresh}
          className="inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md text-foreground/35 transition-colors hover:text-foreground/60 hover:bg-foreground/[0.06]"
          title="Refresh files"
        >
          <HugeiconsRefresh className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </PanelHeader>

      <SearchBar
        value=""
        onChange={onSearch}
        placeholder="Search files…"
      />
    </>
  )
}
```

---

## Task 3: Create FileTreeRow with Context Menu

**Files:**
- Create: `apps/desktop/src/renderer/src/features/chat/components/panel/project-files/FileTreeRow.tsx`

- [ ] **Step 1: Create FileTreeRow.tsx**

```tsx
// apps/desktop/src/renderer/src/features/chat/components/panel/project-files/FileTreeRow.tsx
import { memo, useCallback, useState } from 'react'
import {
  HugeiconsChevronRight,
  HugeiconsFile,
  HugeiconsFolder,
  HugeiconsFolderOpen,
} from '@hugeicons/react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { InlineCreateInput } from './InlineCreateInput'
import type { FileNode } from './types'

interface FileTreeRowProps {
  node: FileNode
  depth: number
  isExpanded: boolean
  isCreating?: 'file' | 'folder' | null
  onToggle: (path: string) => void
  onFileClick: (node: FileNode) => void
  onCommitCreate: (name: string) => void
  onCancelCreate: () => void
  // File operations
  onOpenInEditor?: (path: string) => void
  onShowInFolder?: (path: string) => void
  onRename?: (oldPath: string, newPath: string) => void
  onDelete?: (path: string) => void
  onNewFile?: (parentDir: string) => void
  onNewFolder?: (parentDir: string) => void
  onCopyPath?: (path: string) => void
}

const EXTENSION_COLORS: Record<string, string> = {
  ts: 'text-blue-400',
  tsx: 'text-blue-400',
  js: 'text-yellow-400',
  jsx: 'text-yellow-400',
  json: 'text-yellow-600',
  css: 'text-purple-400',
  scss: 'text-pink-400',
  html: 'text-orange-400',
  md: 'text-gray-400',
  py: 'text-green-400',
  rs: 'text-orange-500',
  go: 'text-cyan-400',
  svg: 'text-amber-400',
  yaml: 'text-red-300',
  yml: 'text-red-300',
  toml: 'text-gray-500',
  sh: 'text-green-500',
}

function getFileIconColor(extension?: string): string {
  if (!extension) return 'text-muted-foreground/70'
  return EXTENSION_COLORS[extension] ?? 'text-muted-foreground/70'
}

export const FileTreeRow = memo(function FileTreeRow({
  node,
  depth,
  isExpanded,
  isCreating,
  onToggle,
  onFileClick,
  onCommitCreate,
  onCancelCreate,
  onOpenInEditor,
  onShowInFolder,
  onRename,
  onDelete,
  onNewFile,
  onNewFolder,
  onCopyPath,
}: FileTreeRowProps) {
  const isDir = node.type === 'directory'

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (isDir) {
        onToggle(node.path)
      } else {
        onFileClick(node)
      }
    },
    [isDir, node, onToggle, onFileClick]
  )

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    // Context menu will be handled by DropdownMenu
  }, [])

  return (
    <>
      <div
        className="group relative flex min-h-7 cursor-pointer items-center gap-2 pe-1.5 py-1 transition-colors duration-75 hover:bg-foreground/[0.05]"
        style={{ paddingInlineStart: depth * 14 + 8 }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {/* Chevron for directories */}
        {isDir ? (
          <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
            <HugeiconsChevronRight
              className={`h-3 w-3 text-muted-foreground/50 transition-transform duration-150 ${
                isExpanded ? 'rotate-90' : ''
              }`}
            />
          </span>
        ) : (
          <span className="h-3.5 w-3.5 shrink-0" />
        )}

        {/* Icon */}
        <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-sm bg-foreground/[0.03] transition-colors duration-150 group-hover:bg-foreground/[0.06]">
          {isDir && isExpanded && <HugeiconsFolderOpen className="h-3.25 w-3.25 text-amber-400/80" />}
          {isDir && !isExpanded && <HugeiconsFolder className="h-3.25 w-3.25 text-amber-400/80" />}
          {!isDir && <HugeiconsFile className={`h-3.25 w-3.25 ${getFileIconColor(node.extension)}`} />}
        </span>

        {/* Name */}
        <span className="min-w-0 flex-1 truncate text-xs text-foreground/80">{node.name}</span>

        {/* Context menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <span className="opacity-0 group-hover:opacity-100 cursor-pointer">
              {/* Three dots or similar trigger */}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="bottom" className="w-52">
            {!isDir && onOpenInEditor && (
              <DropdownMenuItem onClick={() => onOpenInEditor(node.path)}>
                Open in Editor
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onNewFile?.(node.path)}>
              New File
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNewFolder?.(node.path)}>
              New Folder
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {onCopyPath && (
              <DropdownMenuItem onClick={() => onCopyPath(node.path)}>
                Copy Path
              </DropdownMenuItem>
            )}
            {onShowInFolder && (
              <DropdownMenuItem onClick={() => onShowInFolder(node.path)}>
                Show in Finder
              </DropdownMenuItem>
            )}
            {onRename && (
              <DropdownMenuItem onClick={() => {
                // Trigger rename mode
              }}>
                Rename
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {onDelete && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(node.path)}
              >
                Move to Trash
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Inline creation input */}
      {isCreating && isDir && isExpanded && (
        <InlineCreateInput
          depth={depth + 1}
          type={isCreating}
          onCommit={onCommitCreate}
          onCancel={onCancelCreate}
        />
      )}
    </>
  )
})
```

---

## Task 4: Create InlineCreateInput

**Files:**
- Create: `apps/desktop/src/renderer/src/features/chat/components/panel/project-files/InlineCreateInput.tsx`

- [ ] **Step 1: Create InlineCreateInput.tsx**

```tsx
// apps/desktop/src/renderer/src/features/chat/components/panel/project-files/InlineCreateInput.tsx
import { useCallback, useRef, useState } from 'react'
import { HugeiconsFile, HugeiconsFolder } from '@hugeicons/react'

interface InlineCreateInputProps {
  depth: number
  type: 'file' | 'folder'
  onCommit: (name: string) => void
  onCancel: () => void
}

export function InlineCreateInput({
  depth,
  type,
  onCommit,
  onCancel,
}: InlineCreateInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleBlur = useCallback(() => {
    if (value.trim()) {
      onCommit(value)
    } else {
      onCancel()
    }
  }, [value, onCommit, onCancel])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        if (value.trim()) {
          onCommit(value)
        } else {
          onCancel()
        }
      }
      if (e.key === 'Escape') {
        onCancel()
      }
    },
    [value, onCommit, onCancel]
  )

  return (
    <div
      className="flex min-h-7 items-center gap-2 pe-1.5 py-1"
      style={{ paddingInlineStart: (depth + 1) * 14 + 8 }}
    >
      <span className="h-3.5 w-3.5 shrink-0" />
      <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-sm bg-foreground/[0.06]">
        {type === 'folder' ? (
          <HugeiconsFolder className="h-3.25 w-3.25 text-amber-400/80" />
        ) : (
          <HugeiconsFile className="h-3.25 w-3.25 text-muted-foreground/70" />
        )}
      </span>
      <input
        ref={inputRef}
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={type === 'folder' ? 'folder name' : 'filename'}
        className="min-w-0 flex-1 rounded bg-foreground/[0.06] px-1.5 py-0.5 text-xs text-foreground outline-none ring-1 ring-foreground/10 focus:ring-foreground/20"
      />
    </div>
  )
}
```

---

## Task 5: Create ProjectFilesPanel Main Component

**Files:**
- Create: `apps/desktop/src/renderer/src/features/chat/components/panel/project-files/ProjectFilesPanel.tsx`

- [ ] **Step 1: Create ProjectFilesPanel.tsx**

```tsx
// apps/desktop/src/renderer/src/features/chat/components/panel/project-files/ProjectFilesPanel.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAtom } from 'jotai'

import { currentProjectAtom } from '@renderer/stores'
import { filesApi } from '@renderer/api'

import { ProjectFilesPanelHeader } from './ProjectFilesPanelHeader'
import { FileTreeRow } from './FileTreeRow'
import { SearchBar } from '../shared'
import type { FileNode } from './types'

// Build file tree from flat list
function buildFileTree(files: string[]): FileNode[] {
  const root: FileNode[] = []
  const dirs: Record<string, FileNode> = {}

  // Sort: directories first, then alphabetically
  const sorted = [...files].sort((a, b) => {
    const aIsDir = a.endsWith('/')
    const bIsDir = b.endsWith('/')
    if (aIsDir !== bIsDir) return aIsDir ? -1 : 1
    return a.localeCompare(b)
  })

  for (const file of sorted) {
    const parts = file.split('/').filter(Boolean)
    const name = parts[parts.length - 1]
    const isDir = file.endsWith('/')
    const extension = isDir ? undefined : name.includes('.') ? name.split('.').pop() : undefined

    if (parts.length === 1) {
      root.push({ name, path: file, type: isDir ? 'directory' : 'file', extension })
    } else {
      // Find or create parent directory
      const parentPath = parts.slice(0, -1).join('/') + '/'
      if (!dirs[parentPath]) {
        const parentName = parts[parts.length - 2]
        const parentNode: FileNode = {
          name: parentName,
          path: parentPath,
          type: 'directory',
          children: [],
        }
        dirs[parentPath] = parentNode

        // Add to parent's children or root
        const grandparentPath = parts.slice(0, -2).join('/') + '/'
        if (grandparentPath === '/') {
          root.push(parentNode)
        } else {
          if (!dirs[grandparentPath]) {
            dirs[grandparentPath] = { name: parts[parts.length - 3], path: grandparentPath, type: 'directory', children: [] }
            root.push(dirs[grandparentPath])
          }
          dirs[grandparentPath].children!.push(parentNode)
        }
      }
      dirs[parentPath].children!.push({ name, path: file, type: isDir ? 'directory' : 'file', extension })
    }
  }

  return root
}

function filterTree(nodes: FileNode[], query: string): FileNode[] {
  if (!query.trim()) return nodes
  const lowerQuery = query.toLowerCase()

  return nodes.reduce<FileNode[]>((acc, node) => {
    const matches = node.name.toLowerCase().includes(lowerQuery)
    const filteredChildren = node.children ? filterTree(node.children, query) : undefined

    if (matches || (filteredChildren && filteredChildren.length > 0)) {
      acc.push({
        ...node,
        children: filteredChildren,
      })
    }
    return acc
  }, [])
}

function flattenTree(nodes: FileNode[], expandedDirs: Set<string>, depth = 0): Array<{ node: FileNode; depth: number; isExpanded: boolean }> {
  const result: Array<{ node: FileNode; depth: number; isExpanded: boolean }> = []

  for (const node of nodes) {
    const isDir = node.type === 'directory'
    result.push({ node, depth, isExpanded: isDir && expandedDirs.has(node.path) })

    if (isDir && expandedDirs.has(node.path) && node.children) {
      result.push(...flattenTree(node.children, expandedDirs, depth + 1))
    }
  }

  return result
}

export function ProjectFilesPanel() {
  const [project] = useAtom(currentProjectAtom)
  const [tree, setTree] = useState<FileNode[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(() => new Set())
  const [creating, setCreating] = useState<{ parentDir: string; type: 'file' | 'folder' } | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout>>()

  // Debounce search
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQuery(value), 200)
  }, [])

  // Fetch files
  const fetchFiles = useCallback(async () => {
    if (!project?.path) return

    setLoading(true)
    setError(null)

    try {
      const result = await filesApi.listAll(project.path)
      const tree = buildFileTree(result.files)
      setTree(tree)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to list files')
    } finally {
      setLoading(false)
    }
  }, [project?.path])

  // Initial fetch
  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  // File watching
  useEffect(() => {
    if (!project?.path) return

    filesApi.watch(project.path)

    const handleChange = () => {
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = setTimeout(() => {
        fetchFiles()
      }, 150)
    }

    const unsubscribe = filesApi.onChanged(handleChange)

    return () => {
      unsubscribe()
      filesApi.unwatch(project.path)
    }
  }, [project?.path, fetchFiles])

  // Filter and flatten
  const filteredTree = useMemo(() => {
    return debouncedQuery.trim() ? filterTree(tree, debouncedQuery) : tree
  }, [tree, debouncedQuery])

  const flatItems = useMemo(() => {
    if (!filteredTree) return []
    return flattenTree(filteredTree, expandedDirs)
  }, [filteredTree, expandedDirs])

  // Auto-expand matching directories when searching
  useEffect(() => {
    if (debouncedQuery.trim()) {
      const matchingDirs = new Set<string>()
      function collectDirs(nodes: FileNode[]) {
        for (const node of nodes) {
          if (node.type === 'directory') {
            if (node.name.toLowerCase().includes(debouncedQuery.toLowerCase())) {
              matchingDirs.add(node.path)
            }
            if (node.children) {
              collectDirs(node.children)
            }
          }
        }
      }
      collectDirs(filteredTree)
      setExpandedDirs((prev) => {
        const next = new Set(prev)
        matchingDirs.forEach((d) => next.add(d))
        return next
      })
    }
  }, [debouncedQuery, filteredTree])

  const toggleDir = useCallback((path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }, [])

  const handleFileClick = useCallback((node: FileNode) => {
    // TODO: Preview file
    console.log('File clicked:', node.path)
  }, [])

  const handleStartCreate = useCallback((parentDir: string, type: 'file' | 'folder') => {
    // Ensure parent is expanded
    setExpandedDirs((prev) => {
      if (prev.has(parentDir)) return prev
      const next = new Set(prev)
      next.add(parentDir)
      return next
    })
    setCreating({ parentDir, type })
  }, [])

  const handleCommitCreate = useCallback(async (name: string) => {
    if (!project?.path || !creating) return

    const trimmed = name.trim()
    if (!trimmed) {
      setCreating(null)
      return
    }

    const fullPath = `${project.path}/${creating.parentDir ? `${creating.parentDir}/` : ''}${trimmed}`
    const result = creating.type === 'file'
      ? await filesApi.newFile(fullPath)
      : await filesApi.newFolder(fullPath)

    setCreating(null)
    if (result.ok) {
      fetchFiles()
    }
  }, [project?.path, creating, fetchFiles])

  const handleCancelCreate = useCallback(() => {
    setCreating(null)
  }, [])

  const totalFiles = useMemo(() => {
    let count = 0
    function countFiles(nodes: FileNode[]) {
      for (const node of nodes) {
        if (node.type === 'file') count++
        if (node.children) countFiles(node.children)
      }
    }
    countFiles(tree)
    return count
  }, [tree])

  return (
    <div className="flex h-full flex-col">
      <ProjectFilesPanelHeader
        totalFiles={totalFiles}
        onSearch={handleSearchChange}
        onRefresh={fetchFiles}
        loading={loading}
      />

      <div className="mx-2">
        <div className="h-px bg-foreground/[0.06]" />
      </div>

      <div className="flex-1 min-h-0 overflow-auto py-1">
        {loading && tree.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-1 py-6">
            <p className="text-[10px] text-muted-foreground/30">Loading…</p>
          </div>
        )}

        {error && (
          <div className="px-3 py-2">
            <p className="text-[10px] text-destructive">{error}</p>
          </div>
        )}

        {flatItems.length === 0 && !loading && !error && tree.length > 0 && (
          <div className="flex items-center justify-center py-6">
            <p className="text-[10px] text-muted-foreground/30">
              {debouncedQuery ? `No matches for "${debouncedQuery}"` : 'No files found'}
            </p>
          </div>
        )}

        {flatItems.map(({ node, depth, isExpanded }) => (
          <FileTreeRow
            key={node.path}
            node={node}
            depth={depth}
            isExpanded={isExpanded}
            isCreating={creating?.parentDir === node.path ? creating.type : null}
            onToggle={toggleDir}
            onFileClick={handleFileClick}
            onCommitCreate={handleCommitCreate}
            onCancelCreate={handleCancelCreate}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create index.ts**

```typescript
// apps/desktop/src/renderer/src/features/chat/components/panel/project-files/index.ts
export { ProjectFilesPanel } from './ProjectFilesPanel'
export { ProjectFilesPanelHeader } from './ProjectFilesPanelHeader'
export { FileTreeRow } from './FileTreeRow'
export { InlineCreateInput } from './InlineCreateInput'
```

- [ ] **Step 3: Commit**

```bash
git add apps/desktop/src/renderer/src/features/chat/components/panel/project-files/
git commit -m "feat: add ProjectFilesPanel with search and file operations"
```

---

## Task 6: Update PanelRouter

**Files:**
- Modify: `apps/desktop/src/renderer/src/features/chat/components/panel/PanelRouter.tsx`

- [ ] **Step 1: Update PanelRouter to use ProjectFilesPanel**

```tsx
import type { PanelType } from '@renderer/types/panel'

import { BrowserPanel } from './BrowserPanel'
import { GitPanel } from './git/GitPanel'
import { OutlinePanel } from './outline/OutlinePanel'
import { PreviewPanel } from './PreviewPanel'
import { ProjectFilesPanel } from './project-files/ProjectFilesPanel'

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
      return <BrowserPanel />
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
git commit -m "feat: connect ProjectFilesPanel to PanelRouter"
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
- `ProjectFilesPanel` — 项目文件浏览器，支持递归目录视图
- `FileTreeRow` — 带右键菜单的文件行
- `InlineCreateInput` — 内联创建文件/文件夹
- 搜索功能（200ms debounce + 自动展开匹配目录）
- 文件监控（150ms debounce 刷新）

下一步: 执行 `2026-04-08-browser-window-manager.md` 计划实现 Browser 窗口管理器
