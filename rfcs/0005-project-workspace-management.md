# RFC 0005: Project & Workspace Management

## Summary

This document defines how Acme manages projects and workspaces, including project creation, configuration, and lifecycle management.

## Concept Overview

### Project vs Workspace

| Term          | Definition                                                                                           |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| **Project**   | A root directory that Acme manages. Represents a codebase or working directory.                      |
| **Workspace** | The UI container that holds multiple projects. Users can switch between projects within a workspace. |

In practice:
- A **Project** = a folder on disk that contains code
- The **Workspace** = the entire Acme application window showing the sidebar with projects

## Project Management

### Adding a Project

```typescript
interface AddProjectRequest {
  path: string;           // Absolute path to project root
  name?: string;         // Optional display name (defaults to folder name)
  providerId?: string;   // Optional preferred provider
  mode?: 'local' | 'worktree' | 'cloud';
}
```

**Flow:**
1. User selects directory via native file picker
2. Validate directory exists and is readable
3. Detect project type (Node.js, Python, Go, etc.)
4. Create project record in database
5. Initialize provider for project
6. Add to sidebar

### Project Settings

```typescript
interface ProjectSettings {
  // Provider
  providerId?: string;
  model?: string;

  // Execution
  mode: 'local' | 'worktree' | 'cloud';
  worktreePrefix?: string;

  // Permissions
  permissions: PermissionConfig;

  // Context
  contextFiles?: string[];  // Files to always include in context
  excludePatterns?: string[];

  // Advanced
  customRules?: string[];
  environmentVariables?: Record<string, string>;
}
```

### Project Operations

| Operation    | Description                              |
| ------------ | ---------------------------------------- |
| **Open**     | Open project in current window           |
| **Reveal**   | Show in Finder/Explorer                  |
| **Settings** | Open project settings                    |
| **Remove**   | Remove from Acme (does not delete files) |
| **Fork**     | Create a copy in new location            |

## Sidebar Structure

```
┌─────────────────────────────────────┐
│ Acme                           ─ □ × │
├─────────────────────────────────────┤
│ 🔍 Search...                    ⌘K  │
├─────────────────────────────────────┤
│ Projects                    + Add   │
│ ├ 📁 my-app                    ⋮    │
│ ├ 📁 api-service               ⋮    │
│ └ 📁 mobile-app                ⋮    │
├─────────────────────────────────────┤
│ Threads                            │
│ ├ 💬 Fix login bug              ⋮  │
│ ├ 💬 Add dark mode              ⋮  │
│ └ 💬 Refactor auth              ⋮  │
├─────────────────────────────────────┤
│ ─────────────────────────────     │
│ 🤖 Models  ⚙️ Settings  📦 MCP    │
└─────────────────────────────────────┘
```

## Project Types

### Local Mode

The default mode. The agent works directly in the project directory.

```
Project Root/
├── .git/
├── src/
├── package.json
└── ...
```

### Worktree Mode

Creates a Git worktree for isolated changes. Useful for:
- Trying new ideas without touching main code
- Running multiple agents in the same project

```
Project Root/
├── .git/
├── worktrees/
│   └── acme-feature-123/
│       ├── src/
│       └── package.json
└── main/
    ├── src/
    └── package.json
```

**Worktree Management:**

```typescript
interface WorktreeOperations {
  create(threadId: string, branchName: string): Promise<string>;
  // Creates worktree at: ~/.acme/worktrees/{project-id}/{branch}

  list(): WorktreeInfo[];

  delete(worktreePath: string): Promise<void>;

  merge(worktreePath: string, targetBranch: string): Promise<void>;
}
```

### Cloud Mode

Runs the agent in a configured cloud environment. Useful for:
- Resource-intensive tasks
- CI/CD pipelines

```typescript
interface CloudConfig {
  provider: 'aws' | 'gcp' | 'azure' | 'custom';
  instanceType: string;
  region: string;
  credentials?: CloudCredentials;
}
```

## Context Management

### Automatic Context

Acme automatically includes relevant context:

1. **IDE Context** (if IDE extension installed):
   - Currently open files
   - Active file's imports
   - Recent files

2. **Project Context**:
   - `AGENTS.md` - Agent instructions
   - `package.json` / `pyproject.toml` - Dependencies
   - `tsconfig.json` - TypeScript config
   - `.git/config` - Git remote

3. **Manual Context**:
   - Files explicitly attached by user
   - @mentioned files in prompts

### Context Limits

```typescript
interface ContextLimits {
  maxTokens: number;           // Default: 200K
  maxFiles: number;           // Default: 100
  compactionThreshold: number; // When to trigger compaction
}
```

## Open Questions

1. Should we support nested projects (monorepo support)?
2. How to handle projects on remote filesystems (SSHFS)?
3. Should we implement project templates?

---

**Status**: Draft
**Related RFCs**: 0001 (Product Vision), 0004 (Data Models), 0007 (Worktree)
**Reviewers**: (to be assigned)
