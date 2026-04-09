# Renderer Types Extraction Design

## Overview

Extract shared types from `hooks/` directory into the dedicated `types/` directory. This follows the principle that hooks should contain implementation logic only, not type definitions.

## Changes

### 1. Create `types/session.ts`

Contains `UIMessage` interface (moved from `hooks/chat/useOutline.ts`):

```typescript
export interface UIMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string | unknown[]
  timestamp?: number
  isStreaming?: boolean
  attachments?: unknown[]
  tool_calls?: Array<{ id?: string; name?: string; [key: string]: unknown }>
}
```

### 2. Create `types/outline.ts`

Contains `OutlineNodeType` and `OutlineNode` (moved from `hooks/chat/useOutline.ts`):

```typescript
export type OutlineNodeType = 'user' | 'assistant' | 'tool_call' | 'tool_result'

export interface OutlineNode {
  id: string
  type: OutlineNodeType
  label: string
  icon?: string
  messageId: string
  children?: OutlineNode[]
}
```

### 3. Update `types/index.ts`

Add exports for new modules:

```typescript
export * from './outline'
export * from './session'
```

### 4. Update `hooks/chat/useOutline.ts`

- Remove type definitions
- Keep only `useOutline` hook implementation
- No longer export types (exported from `types/` instead)

### 5. Update `hooks/chat/index.ts`

```typescript
// No change needed - already re-exports useOutline only
export { useOutline } from './useOutline'
```

### 6. Update consumers

Components in `components/chat/panel/outline/` should import from `@renderer/types/outline` and `@renderer/types/session` instead of from hooks.

## Files to Modify

| File | Action |
|------|--------|
| `types/session.ts` | Create (UIMessage) |
| `types/outline.ts` | Create (OutlineNodeType, OutlineNode) |
| `types/index.ts` | Add exports |
| `hooks/chat/useOutline.ts` | Remove type definitions |
| `hooks/chat/index.ts` | No change |
| `components/chat/panel/outline/*` | Update imports |
| `components/chat/panel/PanelRouter.tsx` | Update imports |
