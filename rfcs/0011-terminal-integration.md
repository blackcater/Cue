# RFC 0011: Terminal Integration

## Summary

This document defines the integrated terminal feature in Acme, providing shell access within the application for running commands, scripts, and development workflows.

## Terminal Overview

The integrated terminal allows users to:
- Run commands in the project context
- Validate changes
- Perform Git operations
- Access project tools

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Terminal Panel                     │
│  (xterm.js rendering, input handling)              │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              PTY Process Manager                    │
│  (Spawn, manage, resize PTY processes)             │
└──────────────────────┬──────────────────────────────┘
                       │
           ┌───────────┴───────────┐
           ▼                      ─────────────────────┐ ▼
┌  ┌─────────────────────┐
│  Local Shell       │  │  Remote Shell       │
│  (spawned process) │  │  (SSH connection)   │
└─────────────────────┘  └─────────────────────┘
```

## Terminal Interface

```typescript
interface TerminalService {
  // Lifecycle
  spawn(options: TerminalOptions): Promise<TerminalId>;
  write(id: TerminalId, data: string): void;
  resize(id: TerminalId, cols: number, rows: number): void;
  close(id: TerminalId): Promise<void>;

  // Multiple terminals
  list(): TerminalInfo[];
  createTab(parentId?: TerminalId): Promise<TerminalId>;
  closeTab(id: TerminalId): Promise<void>;
}

interface TerminalOptions {
  cwd: string;           // Working directory
  shell?: string;        // Shell to use
  env?: Record<string, string>;
  name?: string;         // Terminal name
}
```

## PTY Configuration

### Default Shells

| Platform | Default Shell    |
| -------- | ---------------- |
| macOS    | `/bin/zsh`       |
| Windows  | `powershell.exe` |
| Linux    | `/bin/bash`      |

### Shell Detection

```typescript
function detectShell(): string {
  if (process.platform === 'win32') {
    return process.env.COMSPEC || 'powershell.exe';
  }

  // Try user's login shell
  const shell = process.env.SHELL;
  if (shell && await exists(shell)) {
    return shell;
  }

  return '/bin/zsh';
}
```

## Terminal Panel

### Panel Behavior

```
┌─────────────────────────────────────────────────────┐
│ Terminal: main ×  +                           _ □×│
├─────────────────────────────────────────────────────┤
│ $ pnpm test                                        │
│                                                    │
│  PASS  src/auth/login.test.ts                      │
│  PASS  src/utils/helpers.test.ts                   │
│                                                    │
│  Test Suites:  2 passed, 2 total                   │
│  Tests:         12 passed, 12 total                 │
│                                                    │
│ $ █                                                │
└─────────────────────────────────────────────────────┘
```

### Features

| Feature        | Description                    |
| -------------- | ------------------------------ |
| **Tabs**       | Multiple terminal instances    |
| **Split**      | Horizontal/vertical splits     |
| **Search**     | Search terminal output         |
| **Clear**      | Clear terminal buffer          |
| **Copy/Paste** | Standard clipboard operations  |
| **Scrollback** | Configurable scrollback buffer |

### Keyboard Shortcuts

| Shortcut      | Action            |
| ------------- | ----------------- |
| `Cmd+K`       | Clear terminal    |
| `Cmd+Shift+K` | Clear scrollback  |
| `Cmd+C`       | Interrupt process |
| `Cmd+D`       | Close terminal    |

## Project-Scoped Terminal

Each terminal is scoped to a project:

```typescript
interface ProjectTerminal {
  projectId: string;
  projectPath: string;
  terminals: TerminalInstance[];
}
```

Terminals inherit:
- Working directory (project root or worktree)
- Environment variables
- PATH (including project tools)

## Actions

For frequently used commands, users can define **Actions**:

```typescript
interface Action {
  id: string;
  name: string;
  command: string;
  cwd?: string;
  icon?: string;

  // Scope
  scope: 'global' | 'project';
  projectId?: string;
}
```

**Action Example:**

```
┌─────────────────────────────────────────────────────┐
│ Project Actions                                + Add│
├─────────────────────────────────────────────────────┤
│ ▶ Run Tests                    pnpm test          │
│ ▶ Lint                       pnpm lint           │
│ ▶ Build                      pnpm build          │
│ ▶ Start Dev                  pnpm dev            │
└─────────────────────────────────────────────────────┘
```

Actions appear as buttons in the terminal panel header.

## Security Considerations

```typescript
interface TerminalSecurity {
  // Allowed commands
  allowedCommands?: string[];

  // Blocked patterns
  blockedPatterns?: RegExp[];

  // Timeout
  maxExecutionTime?: number;

  // Resource limits
  maxProcesses?: number;
}
```

## Remote Terminal (Future)

Support for remote development:

```typescript
interface RemoteTerminal {
  type: 'ssh';
  host: string;
  port: number;
  user: string;
  auth: 'password' | 'key';
}
```

## Open Questions

1. Should we support terminal profiles?
2. How to handle command suggestions/autocomplete?
3. Should we integrate with task runners (npm scripts)?

---

**Status**: Draft
**Related RFCs**: 0005 (Project Management), 0007 (Worktree)
**Reviewers**: (to be assigned)
