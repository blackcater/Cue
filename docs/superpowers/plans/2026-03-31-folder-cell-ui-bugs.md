# FolderCell UI Bugs Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 4 UI issues in FolderCell: drag restriction, arrow animation, expand/collapse animation, and click handling.

**Architecture:** Move `draggable` from outer wrapper to `FolderCell` only, add CSS rotation animation to arrow, wrap folder content with Framer Motion for height animation, and add click handler to entire `Cell`.

**Tech Stack:** React, TypeScript, Tailwind CSS, Framer Motion

---

## Task 1: Move draggable to FolderCell

**Files:**

- Modify: `apps/desktop/src/renderer/src/components/app-shell/sidebar/thread/FolderView.tsx`

- [ ] **Step 1: Remove draggable from outer div and pass to FolderCell**

```tsx
// FolderView.tsx - Find this:
<div
  key={folder.id}
  className="flex flex-col gap-0.5"
  draggable  // REMOVE THIS
  onDragStart={(e) => handleDragStart(e, folder.id)}
  onDragOver={(e) => handleDragOver(e, folder.id)}
  onDragLeave={handleDragLeave}
  onDrop={(e) => handleDrop(e, folder.id)}
  onDragEnd={handleDragEnd}
>
  <FolderCell ... />

// Change to:
<div
  key={folder.id}
  className="flex flex-col gap-0.5"
  // No draggable here
  onDragOver={(e) => handleDragOver(e, folder.id)}
  onDragLeave={handleDragLeave}
  onDrop={(e) => handleDrop(e, folder.id)}
>
  <FolderCell
    draggable
    onDragStart={(e) => handleDragStart(e, folder.id)}
    onDragEnd={handleDragEnd}
    ...
  />
```

- [ ] **Step 2: Commit**

```bash
git add apps/desktop/src/renderer/src/components/app-shell/sidebar/thread/FolderView.tsx
git commit -m "fix(desktop): move draggable to FolderCell only"
```

---

## Task 2: Add arrow rotation animation

**Files:**

- Modify: `apps/desktop/src/renderer/src/components/app-shell/sidebar/cell/FolderCell.tsx`

- [ ] **Step 1: Update ArrowRight01Icon with transition and rotation**

```tsx
// FolderCell.tsx - Find the ArrowRight01Icon:
<HugeiconsIcon
  icon={isExpanded ? ArrowDown01Icon : ArrowRight01Icon}
  className="absolute size-3.5 opacity-0 transition-opacity group-hover:opacity-100"
/>

// Change to:
<HugeiconsIcon
  icon={ArrowRight01Icon}
  className={cn(
    "absolute size-3.5 opacity-0 transition-opacity group-hover:opacity-100 transition-transform duration-200",
    isExpanded ? "rotate-90" : "rotate-0"
  )}
/>
```

- [ ] **Step 2: Remove ArrowDown01Icon since we're now just rotating ArrowRight01Icon**

```tsx
// In imports, remove ArrowDown01Icon
// Keep ArrowRight01Icon
```

- [ ] **Step 3: Commit**

```bash
git add apps/desktop/src/renderer/src/components/app-shell/sidebar/cell/FolderCell.tsx
git commit -m "feat(desktop): add arrow rotation animation"
```

---

## Task 3: Add expand/collapse animation with Framer Motion

**Files:**

- Modify: `apps/desktop/src/renderer/src/components/app-shell/sidebar/thread/FolderView.tsx`

- [ ] **Step 1: Add AnimatePresence and motion imports**

```tsx
// FolderView.tsx - Add import
import { motion, AnimatePresence } from 'framer-motion'
```

- [ ] **Step 2: Wrap ThreadCell list with AnimatePresence and motion.div**

```tsx
// FolderView.tsx - Find this:
{
  isOpen && (
    <div className="flex flex-col gap-0.5">
      {folderThreads.map((thread) => (
        <ThreadCell key={thread.id} thread={thread} />
      ))}
    </div>
  )
}

// Change to:
;<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="flex flex-col gap-0.5"
    >
      {folderThreads.map((thread) => (
        <ThreadCell key={thread.id} thread={thread} />
      ))}
    </motion.div>
  )}
</AnimatePresence>
```

- [ ] **Step 3: Commit**

```bash
git add apps/desktop/src/renderer/src/components/app-shell/sidebar/thread/FolderView.tsx
git commit -m "feat(desktop): add expand/collapse animation for folder content"
```

---

## Task 4: Add onClick handler and cursor styles to FolderCell

**Files:**

- Modify: `apps/desktop/src/renderer/src/components/app-shell/sidebar/cell/FolderCell.tsx`

- [ ] **Step 1: Update FolderCellProps to include onDragStart and onDragEnd**

```tsx
export interface FolderCellProps {
  id: string
  title: string
  isExpanded: boolean
  onToggle: (id: string) => void
  onAddThread?: (folderId: string) => void
  onRename?: (folderId: string) => void
  onDelete?: (folderId: string) => void
  className?: string
  dropPosition?: 'before' | 'after' | null
  isDragging?: boolean
  draggable?: boolean // ADD
  onDragStart?: (e: DragEvent) => void // ADD
  onDragEnd?: (e: DragEvent) => void // ADD
}
```

- [ ] **Step 2: Destructure new props and add onClick to Cell**

```tsx
export function FolderCell({
  id,
  title,
  isExpanded,
  onToggle,
  onAddThread,
  onRename,
  onDelete,
  className,
  dropPosition,
  isDragging,
  draggable,         // ADD
  onDragStart,       // ADD
  onDragEnd,         // ADD
}: Readonly<FolderCellProps>) {
  return (
    <div className="relative">
      {/* Drop indicator lines */}
      {dropPosition === 'before' && (
        <div className="absolute -top-0.5 right-2 left-2 z-10 h-0.5 bg-primary/30" />
      )}
      {dropPosition === 'after' && (
        <div className="absolute -bottom-0.5 right-2 left-2 z-10 h-0.5 bg-primary/30" />
      )}
      <Cell
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onClick={() => onToggle(id)}
        className={cn(
          'hover:bg-black/10 dark:hover:bg-white/10',
          isDragging && 'cursor-grabbing',
          !isDragging && draggable && 'cursor-grab',
          className
        )}
      >
```

- [ ] **Step 3: Remove onClick from CellIcon since whole Cell is now clickable**

```tsx
// Find CellIcon:
<CellIcon
  className="cursor-pointer"
  onClick={(e) => {
    e.stopPropagation()
    onToggle(id)
  }}
>

// Change to:
<CellIcon>
```

- [ ] **Step 4: Import DragEvent type**

```tsx
import { useState, useCallback, type DragEvent } from 'react'
```

- [ ] **Step 5: Commit**

```bash
git add apps/desktop/src/renderer/src/components/app-shell/sidebar/cell/FolderCell.tsx
git commit -m "feat(desktop): add click handler and cursor styles to FolderCell"
```

---

## Task 5: Run linter and formatter

- [ ] **Step 1: Run TypeScript check, oxlint, and oxfmt**

```bash
cd apps/desktop && bunx tsc --noEmit && bunx oxlint && bunx oxfmt
```

- [ ] **Step 2: Commit if any changes**

```bash
git add -A && git commit -m "style(desktop): lint and format FolderCell fixes"
```

---

## Summary

| Task | Changes                                          |
| ---- | ------------------------------------------------ |
| 1    | Moved `draggable` from outer div to `FolderCell` |
| 2    | Added CSS rotation animation to arrow icon       |
| 3    | Added Framer Motion expand/collapse animation    |
| 4    | Added `onClick` to Cell, cursor styles           |
| 5    | Lint and format                                  |
