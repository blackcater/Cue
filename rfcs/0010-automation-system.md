# RFC 0010: Automation System

## Summary

This document defines the automation system for Acme, enabling scheduled and triggered tasks that run autonomously.

## Automation Concept

An **Automation** is a scheduled task that:
1. Executes a prompt on a schedule or trigger
2. Can modify files, run commands, create PRs
3. Reports results to the user

## Use Cases

| Automation             | Description                          |
| ---------------------- | ------------------------------------ |
| **Error monitoring**   | Check logs for errors, propose fixes |
| **Dependency updates** | Check for outdated dependencies      |
| **Code review**        | Run nightly code reviews             |
| **Reporting**          | Generate daily/weekly status reports |
| **Cleanup**            | Remove stale branches, old artifacts |

## Automation Configuration

```typescript
interface Automation {
  id: string;
  name: string;
  description?: string;

  // What to run
  prompt: string;
  skills?: string[];

  // When to run
  schedule: AutomationSchedule;

  // Where to run
  projectId?: string;
  worktreePath?: string;

  // Permissions
  permissions: AutomationPermissions;

  // Notifications
  notifyOnComplete: boolean;
  notifyOnError: boolean;

  // Runtime
  enabled: boolean;
  lastRun?: Date;
  lastResult?: AutomationResult;

  createdAt: Date;
  updatedAt: Date;
}

type AutomationSchedule =
  | { type: 'interval'; minutes: number }
  | { type: 'cron'; expression: string }
  | { type: 'manual' };
```

## Schedule Types

### Interval

```typescript
{ type: 'interval', minutes: 60 }  // Every hour
```

### Cron Expression

```typescript
{
  type: 'cron',
  expression: '0 9 * * *'  // Every day at 9 AM
}
```

Cron fields: `minute hour day month weekday`

### Manual

```typescript
{ type: 'manual' }  // User-triggered only
```

## Automation Runner

### Architecture

```
┌─────────────────────────────────────────────────────┐
│              Automation Scheduler                    │
│  (Manages schedules, triggers executions)          │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              Automation Runner                       │
│  (Spawns worktree, runs agent, handles results)     │
└──────────────────────┬──────────────────────────────┘
                       │
           ┌───────────┴───────────┐
           ▼                       ▼
┌─────────────────────┐  ┌─────────────────────┐
│   Agent Execution   │  │   Result Handler     │
│  (Run prompt)      │  │  (Notify, archive)    │
└─────────────────────┘  └─────────────────────┘
```

### Execution Flow

```
Schedule triggers
    │
    ▼
┌─────────────────────┐
│ Create worktree     │ ── Dedicated automation worktree
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Initialize agent   │ ── Load skills, context
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Execute prompt      │ ── Stream responses
└──────┬──────────────┘
       │
       ├──────────────────────┐
       │                      │
       ▼                      ▼
┌──────────────┐      ┌──────────────┐
│   Success    │      │    Error    │
└──────┬───────┘      └──────┬──────┘
       │                      │
       ▼                      ▼
┌──────────────┐      ┌──────────────┐
│ Notify user  │      │ Notify user  │
│ Archive worktree│    │ with error  │
└──────────────┘      └──────────────┘
```

### Worktree Isolation

Automations run in dedicated worktrees:
- Isolated from main development
- Can run in parallel with user sessions
- Changes can be reviewed before merging

```typescript
interface AutomationWorktree {
  automationId: string;
  worktreePath: string;
  branchName: string;
  status: 'running' | 'completed' | 'failed';
}
```

## Permissions

### Scope Levels

```typescript
type AutomationPermissionScope =
  | 'read-only'       // Read files, no modifications
  | 'project'         // Modify project files
  | 'full';           // Full access including Git push

interface AutomationPermissions {
  scope: AutomationPermissionScope;
  allowedCommands?: string[];    // Shell commands allowed
  allowedPaths?: string[];      // Paths that can be modified
  networkAccess?: boolean;
  gitPush?: boolean;
  requireApproval?: ApprovalConfig;
}
```

### Approval Requirements

```typescript
interface ApprovalConfig {
  require: boolean;
  scope: 'always' | 'destructive' | 'never';

  // Destructive actions
  maxFilesChanged?: number;
  blockedPatterns?: string[];
}
```

## UI Components

### Automation List

```
Automations
├ 🔄 Daily Code Review
│   Schedule: 0 9 * * * (Daily 9 AM)
│   Last run: Yesterday 9:15 AM ✓
│   [Run Now] [Edit] [Delete]
│
├ 🔄 Dependency Check
│   Schedule: Every 6 hours
│   Last run: 2 hours ago ✓
│   [Run Now] [Edit] [Delete]
│
└ [+ New Automation]
```

### Automation Editor

```
┌─────────────────────────────────────────────────────┐
│ Create Automation                                    │
├─────────────────────────────────────────────────────┤
│ Name: [______________________________]              │
│ Description: [__________________________]          │
│                                                      │
│ Prompt:                                             │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Check for security vulnerabilities in:         │ │
│ │ {{packages}}                                     │ │
│ │                                                 │ │
│ │ Report any found vulnerabilities.              │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ Schedule: ○ Interval  ○ Cron  ● Manual              │
│                                                      │
│ Project: [my-app________________________▼]          │
│                                                      │
│ Permissions:                                         │
│ ○ Read only  ● Project  ○ Full                      │
│                                                      │
│ ☑ Notify on completion                              │
│ ☑ Notify on error                                   │
│                                                      │
│                         [Cancel] [Create]           │
└─────────────────────────────────────────────────────┘
```

## Result Storage

```typescript
interface AutomationResult {
  id: string;
  automationId: string;

  startedAt: Date;
  completedAt: Date;
  duration: number;  // milliseconds

  status: 'success' | 'error' | 'cancelled';

  // Stats
  messagesCount: number;
  filesChanged: number;
  commandsRun: number;

  // Output
  summary: string;
  changes?: ChangeSummary[];
  error?: string;
}
```

## Open Questions

1. Should we support webhooks as triggers?
2. How to handle automation that takes very long?
3. Should we implement automation chaining?

---

**Status**: Draft
**Related RFCs**: 0007 (Worktree), 0009 (MCP & Skills)
**Reviewers**: (to be assigned)
