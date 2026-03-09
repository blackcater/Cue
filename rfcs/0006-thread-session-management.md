# RFC 0006: Thread & Session Management

## Summary

This document defines how Acme manages conversation threads and AI agent sessions, including lifecycle management, state handling, and UI integration.

## Thread Concept

A **Thread** represents a single conversation with an AI coding assistant. It contains:
- All messages (user prompts, assistant responses)
- Associated tasks (TodoWrite items)
- Metadata (status, mode, model, etc.)

## Thread Lifecycle

```
┌─────────────┐
│  CREATED    │ ── User starts new thread
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   ACTIVE    │ ── Agent is processing messages
└──────┬──────┘
       │
       ├────────────────────┬────────────────────┐
       │                    │                    │
       ▼                    ▼                    ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   PAUSED    │    │  COMPLETED  │    │  ARCHIVED   │
│ (by user)   │    │(natural end)│    │ (by user)   │
└─────────────┘    └─────────────┘    └─────────────┘
```

## Thread States

```typescript
type ThreadStatus =
  | 'idle'        // No active session
  | 'starting'    // Initializing provider session
  | 'active'      // Agent is processing
  | 'waiting'    // Waiting for user approval
  | 'paused'     // User paused
  | 'completed'  // Task finished
  | 'error'      // Error occurred
  | 'archived';  // Archived by user
```

## Thread Operations

### Create Thread

```typescript
interface CreateThreadRequest {
  projectId: string;
  title?: string;
  providerId?: string;
  model?: string;
  mode: 'local' | 'worktree' | 'cloud';
  initialMessage?: string;
}
```

### Send Message

```typescript
interface SendMessageRequest {
  threadId: string;
  content: string;           // Text content
  attachments?: Attachment[]; // Files/images
  options?: {
    mode?: 'queue' | 'steer'; // How to handle if thread is active
    skills?: string[];       // Skills to apply
  };
}
```

**Message Flow:**

```
User Input
    │
    ▼
┌─────────────────┐
│ Validate Input  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create Message  │ ── Persist to DB
│   (role: user)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Provider Send   │ ── Stream to AI
└────────┬────────┘
         │
    ┌────┴────┐
    │ Stream  │
    │ Events  │
    └────┬────┘
         │
    ┌────┴────────────────────┐
    │                         │
    ▼                         ▼
┌─────────┐            ┌──────────────┐
│ Tool    │            │ Content      │
│ Call    │            │ (text/code)  │
└────┬────┘            └──────┬───────┘
     │                        │
     ▼                        ▼
┌─────────────┐          ┌──────────────┐
│ Execute     │          │ Render       │
│ Tool        │          │ Message      │
└──────┬──────┘          └──────────────┘
       │
       ▼
┌─────────────────┐
│ Tool Result     │ ── Stream back to AI
└─────────────────┘
```

### Thread Controls

| Control     | Description                        |
| ----------- | ---------------------------------- |
| **Stop**    | Interrupt the current operation    |
| **Pause**   | Pause the thread (can resume)      |
| **Resume**  | Continue a paused thread           |
| **Rewind**  | Roll back to a previous checkpoint |
| **Fork**    | Create a copy of this thread       |
| **Rename**  | Change thread title                |
| **Archive** | Hide from active list              |

## Checkpoints & Rewind

Acme automatically creates checkpoints at regular intervals:

```typescript
interface Checkpoint {
  id: string;
  threadId: string;
  messageIndex: number;  // How many messages in
  createdAt: Date;
  snapshot: {
    messages: Message[];
    tasks: Task[];
  };
}
```

**Rewind Flow:**

```
User selects checkpoint
    │
    ▼
Confirm rewind
    │
    ▼
Truncate messages after checkpoint
    │
    ▼
Create new checkpoint (rollback point)
    │
    ▼
Resume from checkpoint
```

## Multi-turn Handling

### Queue Mode (Default)

When a thread is active and user sends a new message:
- New message is queued
- Processed after current operation completes

### Steer Mode

When a thread is active and user sends a new message:
- Current operation is interrupted
- New message is processed immediately

```typescript
interface SendOptions {
  mode: 'queue' | 'steer';
}
```

**Keyboard Shortcut:** `Shift+Enter` sends in opposite mode for single message.

## Split Screen

Acme supports side-by-side threads:

```
┌─────────────────────┬─────────────────────┐
│ Thread A            │ Thread B            │
│ ─────────────────── │ ─────────────────── │
│                     │                     │
│ [Messages...]       │ [Messages...]       │
│                     │                     │
│                     │                     │
├─────────────────────┴─────────────────────┤
│ [Composer]                                 │
└────────────────────────────────────────────┘
```

## Session Persistence

### Auto-save

Messages are saved to SQLite after:
- Every user message
- Every assistant message chunk
- Every tool result

### Resume on Startup

When Acme starts:
1. Load all active/paused threads
2. Reconnect to provider sessions
3. Refresh thread state from provider

```typescript
interface ResumeSessionRequest {
  threadId: string;
}
```

## Open Questions

1. Should we limit concurrent active threads?
2. How to handle very long threads (1000+ messages)?
3. Should we implement thread sharing/export?

---

**Status**: Draft
**Related RFCs**: 0004 (Data Models), 0005 (Project Management)
**Reviewers**: (to be assigned)
