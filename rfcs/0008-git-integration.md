# RFC 0008: Git Integration

## Summary

This document defines the built-in Git tools and GitHub integration in Acme, providing version control functionality directly within the application.

## Git Features Overview

| Category       | Features                       |
| -------------- | ------------------------------ |
| **Repository** | Init, clone, status            |
| **Branching**  | List, create, checkout, delete |
| **Changes**    | Diff, stage, unstage, revert   |
| **Commit**     | Commit, amend                  |
| **Remote**     | Pull, push, fetch              |
| **History**    | Log, blame                     |
| **GitHub**     | Issues, PRs, reviews           |

## Architecture

```
┌─────────────────────────────────────────┐
│              UI Layer                    │
│  (GitPanel, DiffViewer, BranchList)     │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│           Git Service Layer              │
│  (Git operations, formatting)           │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│         Git CLI Adapter                 │
│  (spawn git process, parse output)      │
└─────────────────────────────────────────┘
```

## Git Service Interface

```typescript
interface GitService {
  // Status
  status(cwd: string): Promise<GitStatus>;

  // Branches
  listBranches(cwd: string): Promise<Branch[]>;
  createBranch(cwd: string, name: string, checkout?: boolean): Promise<void>;
  checkout(cwd: string, branch: string): Promise<void>;

  // Changes
  diff(cwd: string, options?: DiffOptions): Promise<DiffResult[]>;
  stage(cwd: string, files: string[]): Promise<void>;
  unstage(cwd: string, files: string[]): Promise<void>;
  revert(cwd: string, files: string[]): Promise<void>;

  // Commit
  commit(cwd: string, message: string, files?: string[]): Promise<string>;
  amend(message?: string): Promise<void>;

  // Remote
  push(cwd: string, options?: PushOptions): Promise<void>;
  pull(cwd: string, options?: PullOptions): Promise<void>;
  fetch(cwd: string): Promise<void>;

  // History
  log(cwd: string, options?: LogOptions): Promise<Commit[]>;
  diffCommit(cwd: string, commitHash: string): Promise<DiffResult[]>;
}
```

## UI Components

### Git Status Panel

```
Changes                    [Commit] [Pull] [Push]
─────────────────────────────────────────────────
M  src/auth/login.ts       Stage | Discard
M  src/components/Button.tsx
??  new-file.ts
```

### Diff Viewer

```typescript
interface DiffViewerProps {
  diff: DiffResult;
  theme: 'light' | 'dark';
  contextLines?: number;
  onStage?: (file: string) => void;
  onDiscard?: (file: string) => void;
}
```

### Branch List

```
Branches
├ main          (ahead 2)  [Checkout]
├ develop       (behind 3) [Checkout]
└ feature/auth  (diverged) [Checkout] [Merge]

[+ New Branch]
```

## GitHub Integration

### Authentication

```typescript
interface GitHubAuth {
  type: 'gh-cli' | 'token';

  // gh-cli: Use `gh auth status`
  // token: Use provided PAT
}
```

### Issues

```typescript
interface GitHubIssues {
  list(owner: string, repo: string, options?: {
    state?: 'open' | 'closed' | 'all';
    labels?: string[];
  }): Promise<Issue[]>;

  get(owner: string, repo: string, number: number): Promise<Issue>;

  create(owner: string, repo: string, data: CreateIssue): Promise<Issue>;
}
```

### Pull Requests

```typescript
interface GitHubPRs {
  list(owner: string, repo: string, options?: {
    state?: 'open' | 'closed' | 'all';
  }): Promise<PullRequest[]>;

  get(owner: string, repo: string, number: number): Promise<PullRequest>;

  getDiff(owner: string, repo: string, number: number): Promise<string>;

  getComments(owner: string, repo: string, number: number): Promise<Comment[]>;

  create(owner: string, repo: string, data: CreatePR): Promise<PullRequest>;
}
```

### PR Composer

```
┌─────────────────────────────────────────────┐
│ Create Pull Request                        │
├─────────────────────────────────────────────┤
│ Base: main          Compare: feature/auth  │
├─────────────────────────────────────────────┤
│ Title: [Fix login redirect issue         ] │
│                                             │
│ Description:                               │
│ ┌─────────────────────────────────────────┐│
│ │ Fixes #123                              ││
│ │                                         ││
│ │ - Fixed redirect after login           ││
│ │ - Added validation for email           ││
│ └─────────────────────────────────────────┘│
│                                             │
│ Reviewers: [@user1] [+ Add]               │
│ Labels: [bug] [+ Add]                      │
│                                             │
│                      [Cancel] [Create PR] │
└─────────────────────────────────────────────┘
```

## Inline Comments for Agent

Allow users to add inline comments that the agent should address:

```typescript
interface InlineComment {
  file: string;
  line: number;
  content: string;
  resolved: boolean;
}
```

These comments are included in the agent's context when working on that file.

## Agent Git Tools

The AI agent has access to Git tools:

| Tool         | Description          |
| ------------ | -------------------- |
| `git_status` | Check current status |
| `git_diff`   | View changes         |
| `git_commit` | Commit changes       |
| `git_branch` | Manage branches      |
| `git_push`   | Push to remote       |
| `git_pull`   | Pull from remote     |
| `gh_pr`      | GitHub PR operations |

## Open Questions

1. Should we support other Git hosting providers (GitLab, Bitbucket)?
2. How to handle large repositories (partial clone)?
3. Should we implement conflict resolution UI?

---

**Status**: Draft
**Related RFCs**: 0005 (Project Management), 0006 (Thread Management)
**Reviewers**: (to be assigned)
