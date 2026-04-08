# OutlinePanel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 OutlinePanel，显示当前对话的大纲（会话结构），点击可跳转到 Chat 对应位置

**Architecture:**
- 数据来源: 从 session messages 中提取对话结构
- 状态: 内存状态，不持久化，Session 切换时重新计算
- 跳转: 点击大纲项高亮对应消息，滚动 Chat 到该位置

**Tech Stack:** React 19, TailwindCSS, hugeicons, Jotai

---

## File Structure

```
apps/desktop/src/renderer/src/features/chat/components/panel/outline/
├── OutlinePanel.tsx       # Main component
├── OutlinePanelHeader.tsx # Header
├── OutlineTree.tsx        # Tree structure
├── OutlineNode.tsx        # Single node
└── index.ts

apps/desktop/src/renderer/src/features/chat/hooks/
├── useOutline.ts          # Outline data extraction hook (new)
└── index.ts              # Update exports
```

---

## Task 1: Create useOutline Hook

**Files:**
- Create: `apps/desktop/src/renderer/src/features/chat/hooks/useOutline.ts`

- [ ] **Step 1: Create useOutline.ts**

```typescript
// apps/desktop/src/renderer/src/features/chat/hooks/useOutline.ts
import { useMemo } from 'react'
import type { UIMessage } from '@/types'

export type OutlineNodeType = 'user' | 'assistant' | 'tool_call' | 'tool_result'

export interface OutlineNode {
  id: string
  type: OutlineNodeType
  label: string
  icon?: string
  messageId: string
  children?: OutlineNode[]
}

function getToolName(toolName: string): string {
  // Extract readable tool name from tool call
  const parts = toolName.split('_')
  return parts[parts.length - 1] || toolName
}

function extractToolCallInfo(content: unknown): { toolName: string; input?: string } | null {
  if (!content || typeof content !== 'object') return null

  const obj = content as Record<string, unknown>

  // Handle different message formats
  if (typeof obj.tool_name === 'string') {
    return { toolName: obj.tool_name as string }
  }

  if (typeof obj.name === 'string') {
    return { toolName: obj.name as string }
  }

  return null
}

function buildOutlineTree(messages: UIMessage[]): OutlineNode[] {
  const nodes: OutlineNode[] = []

  for (const message of messages) {
    if (message.role === 'tool') {
      // Skip individual tool results - they are grouped with their tool_call
      continue
    }

    if (message.role === 'user') {
      // Extract first line of user message as label
      const text = typeof message.content === 'string'
        ? message.content
        : JSON.stringify(message.content)
      const label = text.split('\n')[0].slice(0, 50)

      nodes.push({
        id: message.id,
        type: 'user',
        label: label || 'User message',
        messageId: message.id,
      })
      continue
    }

    if (message.role === 'assistant') {
      const content = message.content
      const text = typeof content === 'string'
        ? content
        : Array.isArray(content)
          ? content.map((c) => ('text' in c ? c.text : '')).join('')
          : ''

      // Extract thinking or first meaningful response
      const label = text.split('\n')[0].slice(0, 50) || 'Assistant response'

      const node: OutlineNode = {
        id: message.id,
        type: 'assistant',
        label,
        messageId: message.id,
        children: [],
      }

      // Check for tool calls in the message
      if ('tool_calls' in message && Array.isArray(message.tool_calls)) {
        for (const toolCall of message.tool_calls) {
          const toolName = typeof toolCall === 'string'
            ? toolCall
            : 'name' in toolCall
              ? String(toolCall.name)
              : 'unknown'

          node.children!.push({
            id: `tool-${message.id}-${toolName}`,
            type: 'tool_call',
            label: getToolName(toolName),
            messageId: message.id,
          })
        }
      }

      nodes.push(node)
    }
  }

  return nodes
}

interface UseOutlineOptions {
  /** Messages to extract outline from */
  messages: UIMessage[]
}

interface UseOutlineResult {
  nodes: OutlineNode[]
  totalCount: number
  userMessageCount: number
  assistantMessageCount: number
  toolCallCount: number
}

export function useOutline({ messages }: UseOutlineOptions): UseOutlineResult {
  return useMemo(() => {
    const nodes = buildOutlineTree(messages)

    let userMessageCount = 0
    let assistantMessageCount = 0
    let toolCallCount = 0

    for (const node of nodes) {
      if (node.type === 'user') userMessageCount++
      if (node.type === 'assistant') assistantMessageCount++
      toolCallCount += node.children?.length || 0
    }

    return {
      nodes,
      totalCount: nodes.length,
      userMessageCount,
      assistantMessageCount,
      toolCallCount,
    }
  }, [messages])
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/desktop/src/renderer/src/features/chat/hooks/useOutline.ts
git commit -m "feat: add useOutline hook for extracting conversation structure"
```

---

## Task 2: Create OutlinePanel Components

**Files:**
- Create: `apps/desktop/src/renderer/src/features/chat/components/panel/outline/`

- [ ] **Step 1: Create OutlinePanel.tsx**

```tsx
// apps/desktop/src/renderer/src/features/chat/components/panel/outline/OutlinePanel.tsx
import { useCallback, useState } from 'react'
import { HugeiconsList } from '@hugeicons/react'

import { useOutline } from '../../hooks/useOutline'
import { OutlinePanelHeader } from './OutlinePanelHeader'
import { OutlineTree } from './OutlineTree'
import type { OutlineNode } from '../../hooks/useOutline'

interface OutlinePanelProps {
  messages: Array<{
    id: string
    role: string
    content: unknown
    tool_calls?: unknown[]
  }>
  onNavigate: (messageId: string) => void
}

export function OutlinePanel({ messages, onNavigate }: OutlinePanelProps) {
  const { nodes, userMessageCount, assistantMessageCount, toolCallCount } = useOutline({ messages })
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => new Set(nodes.map((n) => n.id)))

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }, [])

  const handleNodeClick = useCallback(
    (node: OutlineNode) => {
      onNavigate(node.messageId)
    },
    [onNavigate]
  )

  return (
    <div className="flex h-full flex-col">
      <OutlinePanelHeader
        totalNodes={nodes.length}
        userCount={userMessageCount}
        assistantCount={assistantMessageCount}
        toolCallCount={toolCallCount}
      />

      <div className="flex-1 min-h-0 overflow-auto py-1">
        <OutlineTree
          nodes={nodes}
          expandedNodes={expandedNodes}
          onToggle={toggleNode}
          onNodeClick={handleNodeClick}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create OutlinePanelHeader.tsx**

```tsx
// apps/desktop/src/renderer/src/features/chat/components/panel/outline/OutlinePanelHeader.tsx
import { HugeiconsList } from '@hugeicons/react'

import { PanelHeader } from '../shared'

interface OutlinePanelHeaderProps {
  totalNodes: number
  userCount: number
  assistantCount: number
  toolCallCount: number
}

export function OutlinePanelHeader({
  totalNodes,
  userCount,
  assistantCount,
  toolCallCount,
}: OutlinePanelHeaderProps) {
  return (
    <PanelHeader
      icon={HugeiconsList}
      label="Outline"
      iconClass="text-violet-600/70"
    >
      <span className="text-[10px] tabular-nums text-foreground/35">
        {totalNodes}
      </span>
    </PanelHeader>
  )
}
```

- [ ] **Step 3: Create OutlineTree.tsx**

```tsx
// apps/desktop/src/renderer/src/features/chat/components/panel/outline/OutlineTree.tsx
import { type FC } from 'react'
import type { OutlineNode } from '../../hooks/useOutline'
import { OutlineNodeComponent } from './OutlineNode'

interface OutlineTreeProps {
  nodes: OutlineNode[]
  expandedNodes: Set<string>
  onToggle: (nodeId: string) => void
  onNodeClick: (node: OutlineNode) => void
  depth?: number
}

export const OutlineTree: FC<OutlineTreeProps> = ({
  nodes,
  expandedNodes,
  onToggle,
  onNodeClick,
  depth = 0,
}) => {
  if (nodes.length === 0) {
    return (
      <div className="px-3 py-4 text-center">
        <p className="text-xs text-muted-foreground/50">No outline available</p>
      </div>
    )
  }

  return (
    <div>
      {nodes.map((node) => (
        <OutlineNodeComponent
          key={node.id}
          node={node}
          expandedNodes={expandedNodes}
          onToggle={onToggle}
          onNodeClick={onNodeClick}
          depth={depth}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Create OutlineNode.tsx**

```tsx
// apps/desktop/src/renderer/src/features/chat/components/panel/outline/OutlineNode.tsx
import { type FC, useCallback } from 'react'
import {
  HugeiconsUser,
  HugeiconsAssistant,
  HugeiconsTool,
  HugeiconsChevronRight,
} from '@hugeicons/react'

import type { OutlineNode } from '../../hooks/useOutline'
import { OutlineTree } from './OutlineTree'

interface OutlineNodeProps {
  node: OutlineNode
  expandedNodes: Set<string>
  onToggle: (nodeId: string) => void
  onNodeClick: (node: OutlineNode) => void
  depth: number
}

const NODE_ICONS = {
  user: HugeiconsUser,
  assistant: HugeiconsAssistant,
  tool_call: HugeiconsTool,
  tool_result: HugeiconsTool,
} as const

const NODE_COLORS = {
  user: 'text-blue-500',
  assistant: 'text-green-500',
  tool_call: 'text-orange-500',
  tool_result: 'text-gray-500',
} as const

export const OutlineNodeComponent: FC<OutlineNodeProps> = ({
  node,
  expandedNodes,
  onToggle,
  onNodeClick,
  depth,
}) => {
  const Icon = NODE_ICONS[node.type] || HugeiconsUser
  const iconColor = NODE_COLORS[node.type] || 'text-muted-foreground'
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expandedNodes.has(node.id)

  const handleClick = useCallback(() => {
    onNodeClick(node)
  }, [node, onNodeClick])

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (hasChildren) {
        onToggle(node.id)
      }
    },
    [node.id, hasChildren, onToggle]
  )

  return (
    <div>
      <div
        className="group flex items-center gap-1.5 cursor-pointer rounded px-2 py-1 hover:bg-foreground/[0.05] transition-colors"
        style={{ paddingInlineStart: depth * 14 + 8 }}
        onClick={handleClick}
      >
        {/* Expand/collapse chevron */}
        <span
          className={`h-3 w-3 shrink-0 flex items-center justify-center transition-transform ${hasChildren ? 'cursor-pointer' : 'invisible'}`}
          onClick={handleToggle}
        >
          <HugeiconsChevronRight
            className={`h-3 w-3 text-muted-foreground/50 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          />
        </span>

        {/* Icon */}
        <Icon className={`h-3 w-3 shrink-0 ${iconColor}`} />

        {/* Label */}
        <span className="text-xs truncate text-foreground/80">{node.label}</span>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <OutlineTree
          nodes={node.children!}
          expandedNodes={expandedNodes}
          onToggle={onToggle}
          onNodeClick={onNodeClick}
          depth={depth + 1}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 5: Create index.ts**

```typescript
// apps/desktop/src/renderer/src/features/chat/components/panel/outline/index.ts
export { OutlinePanel } from './OutlinePanel'
export { OutlinePanelHeader } from './OutlinePanelHeader'
export { OutlineTree } from './OutlineTree'
export { OutlineNodeComponent } from './OutlineNode'
```

- [ ] **Step 6: Commit**

```bash
git add apps/desktop/src/renderer/src/features/chat/components/panel/outline/
git commit -m "feat: add OutlinePanel for conversation outline"
```

---

## Task 3: Update PanelRouter to Use OutlinePanel

**Files:**
- Modify: `apps/desktop/src/renderer/src/features/chat/components/panel/PanelRouter.tsx`

- [ ] **Step 1: Update PanelRouter to import and use OutlinePanel**

```tsx
import type { PanelType } from '@renderer/types/panel'

import { BrowserPanel } from './BrowserPanel'
import { GitPanel } from './git/GitPanel'
import { OutlinePanel } from './outline/OutlinePanel'
import { PreviewPanel } from './PreviewPanel'
import { FilesPanel } from './files'

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
      return <FilesPanel />
    case 'browser':
      return <BrowserPanel />
    case 'preview':
      return <PreviewPanel />
    case 'outline':
      if (!onNavigateToMessage) {
        return <div className="p-4 text-xs text-muted-foreground">Outline Panel requires onNavigateToMessage prop</div>
      }
      return <OutlinePanel messages={messages} onNavigate={onNavigateToMessage} />
    case 'projectFiles':
      return <div className="p-4 text-xs text-muted-foreground">Project Files Panel (TBD)</div>
    default:
      return null
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/desktop/src/renderer/src/features/chat/components/panel/PanelRouter.tsx
git commit -m "feat: connect OutlinePanel to PanelRouter"
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
- `useOutline` hook — 从 session messages 提取对话大纲结构
- `OutlinePanel` — 大纲面板组件
- `OutlineTree` / `OutlineNode` — 树形结构展示
- 支持点击跳转到 Chat 对应消息位置

OutlinePanel 节点类型:
- `user` — 用户消息（蓝色图标）
- `assistant` — AI 回复（绿色图标）
- `tool_call` — 工具调用（橙色图标）

下一步: 执行 `2026-04-08-project-files-panel.md` 计划实现 ProjectFilesPanel
