# RFC 0007: Worktree & Isolation

## Summary

This document defines how Acme manages worktrees for isolated agent execution, allowing parallel tasks without affecting the main codebase.

## Motivation

1. **Safety**: Prevent accidental modifications to production code
2. **Parallelism**: Run multiple agents in the same project simultaneously
3. **Experimentation**: Try risky changes without fear

## Worktree Architecture

```
~/.acme/
└── worktrees/
    └── {project-id}/
        ├── feature-abc/
        │   ├── src/
        │   └── package.json
        └── fix-login/
            ├── src/
            └── package.json
```

## Worktree Lifecycle

```
┌─────────────┐
│  CREATE     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  CHECKOUT   │ ── Create from branch
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  ACTIVE     │ ── Agent runs here
└──────┬──────┘
       │
       ├────────────────────────────┐
       │                            │
       ▼                            ▼
┌─────────────┐            ┌─────────────┐
│   MERGE     │            │   DISCARD   │
│  (apply PR) │            │  (delete)   │
└─────────────┘            └─────────────┘
```

## Worktree Operations

### Create Worktree

```typescript
interface CreateWorktreeRequest {
  projectId: string;
  branchName: string;
  baseBranch?: string;  // Default: current branch
  worktreePath?: string; // Custom path
}
```

**Flow:**

1. Check branch doesn't already exist
2. Create Git worktree: `git worktree add {path} -b {branch}`
3. Install dependencies (optional): `npm install`
4. Create worktree record in database

### Switch to Worktree Mode

```typescript
// When creating a thread in worktree mode:
interface WorktreeThreadOptions {
  mode: 'worktree';
  branchName: string;
  createIfNotExists: boolean;
}

// If createIfNotExists=true:
// 1. Create worktree if branch doesn't exist
// 2. Checkout branch
// 3. Create thread in worktree
```

### Merge Changes

```typescript
interface MergeWorktreeRequest {
  worktreePath: string;
  targetBranch: string;
  strategy: 'merge' | 'rebase' | 'squash';
  createPR?: boolean;
}
```

**Merge Flow:**

```
1. Check for uncommitted changes
   │
   ▼
2. Commit changes in worktree
   │
   ▼
3. Switch to target branch
   │
   ▼
4. Merge worktree branch
   │
   ▼
5. Handle conflicts (if any)
   │
   ▼
6. Push changes
   │
   ▼
7. Optional: Create PR
```

### Delete Worktree

```typescript
interface DeleteWorktreeRequest {
  worktreePath: string;
  force?: boolean;  // Skip uncommitted changes check
}
```

## UI Representation

### Thread Card with Worktree Badge

```
┌────────────────────────────────────────┐
│ 💬 Implement dark mode            [🌿] │
│ ─────────────────────────────────────  │
│ In worktree: feature/dark-mode    ⋮   │
│ Updated 2 hours ago                    │
└────────────────────────────────────────┘
```

### Worktree Panel

```
Worktrees
├ 🌿 feature/auth-fix    (2 commits)
│   [Checkout] [Merge] [Delete]
├ 🌿 experiment/mcp      (5 commits)
│   [Checkout] [Merge] [Delete]
└ [+ New Worktree]
```

## Permission Isolation

Worktrees inherit project permissions but can be overridden:

```typescript
interface WorktreePermissions {
  inheritFromProject: boolean;
  overrides?: PermissionConfig;
}
```

## Clone Mode (Alternative to Worktree)

For non-Git projects or when worktrees aren't desired:

```typescript
interface CloneOptions {
  type: 'clone';  // Full copy, not worktree
  targetPath: string;
  excludePatterns?: string[];
}
```

**Clone Flow:**

1. Copy project to new location using rsync/copy
2. Create thread in clone directory
3. Changes stay completely isolated

## Open Questions

1. Should we auto-cleanup worktrees after merge?
2. How to handle large repositories (git clone vs worktree)?
3. Should we support worktree templates?

---

**Status**: Draft
**Related RFCs**: 0005 (Project Management), 0006 (Thread Management)
**Reviewers**: (to be assigned)
