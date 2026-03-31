# FolderCell UI Bugs Fix Design

## Overview

Fix several UI issues in `FolderView` and `FolderCell` components:
1. Restrict drag area to `FolderCell` only (exclude `ThreadCell`)
2. Add expand/collapse animation for folder content
3. Add arrow rotation animation
4. Ensure clicking anywhere on `FolderCell` toggles expand/collapse

## Design

### 1. Drag Restriction

**Current**: Entire `div` wrapping both `FolderCell` and `ThreadCell` is draggable.

**Fix**: Move `draggable` attribute from outer `div` to `FolderCell` component in `FolderView`.

```tsx
// FolderView.tsx - Before
<div
  key={folder.id}
  className="flex flex-col gap-0.5"
  draggable  // ❌ Too broad
  onDragStart={(e) => handleDragStart(e, folder.id)}
  ...
>
  <FolderCell ... />
  {isOpen && <ThreadCell ... />}
</div>

// After
<div
  key={folder.id}
  className="flex flex-col gap-0.5"
  // No draggable here
  ...
>
  <FolderCell
    draggable  // ✅ Only FolderCell is draggable
    onDragStart={(e) => handleDragStart(e, folder.id)}
    ...
  />
  {isOpen && <ThreadCell ... />}
</div>
```

Also pass `onDragStart` handler to `FolderCell`.

### 2. Arrow Rotation Animation

**Current**: Arrow icon toggles instantly without animation.

**Fix**: Use CSS `transition-transform` with Tailwind classes.

```tsx
// FolderCell.tsx
<HugeiconsIcon
  icon={ArrowRight01Icon}
  className={cn(
    "size-3.5 transition-transform duration-200",
    isExpanded ? "rotate-90" : "rotate-0"
  )}
/>
```

When expanded, rotate 90deg (pointing down). When collapsed, rotate 0deg (pointing right).

### 3. Expand/Collapse Animation

**Current**: Folder content toggles instantly.

**Fix**: Use Framer Motion with `motion.div` and `AnimatePresence`.

```tsx
// FolderView.tsx
import { motion, AnimatePresence } from 'framer-motion'

{isOpen && (
  <AnimatePresence>
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
  </AnimatePresence>
)}
```

### 4. Click to Toggle + Drag Cursor

**Current**: Cell has no cursor style. `onClick` toggles via `CellIcon`.

**Fix**:
- Add `cursor-grab` to `FolderCell` for draggable state
- Add `cursor-grabbing` when actually dragging
- Ensure entire `Cell` area is clickable (not just icon)

```tsx
// FolderCell.tsx
<Cell
  className={cn(
    'hover:bg-black/10 dark:hover:bg-white/10',
    isDragging && 'cursor-grabbing',
    className
  )}
  onClick={() => onToggle(id)}  // Add onClick to Cell
>
```

Remove `onClick` from `CellIcon` since the entire cell is now clickable.

### 5. Cursor Style on Drag

Since draggable state is now on `FolderCell` only, add grab cursor:

- Default: `cursor-grab` (when draggable but not actively dragging)
- During drag: `cursor-grabbing`

Pass `isDragging` prop to `FolderCell` for the active dragging state.

## Files to Modify

1. `apps/desktop/src/renderer/src/components/app-shell/sidebar/thread/FolderView.tsx`
   - Move `draggable` to `FolderCell`
   - Add Framer Motion animation wrapper

2. `apps/desktop/src/renderer/src/components/app-shell/sidebar/cell/FolderCell.tsx`
   - Add `draggable` attribute
   - Add `onDragStart` handler
   - Add CSS rotation for arrow
   - Add `onClick` to Cell for toggle
   - Add cursor styles

3. `apps/desktop/src/renderer/src/components/app-shell/sidebar/cell/Cell.tsx`
   - No changes needed (already handles `onClick` passthrough)

## Implementation Order

1. Fix drag restriction (move `draggable`)
2. Add arrow rotation animation
3. Add Framer Motion expand/collapse animation
4. Add click handler and cursor styles
