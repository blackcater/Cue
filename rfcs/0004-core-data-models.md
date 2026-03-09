# RFC 0004: Core Data Models

## Summary

This document defines the core data structures and models for Acme, including database schema, TypeScript interfaces, and data flow.

## Database Overview

Acme uses SQLite with WAL mode for local persistence. All data stays on the user's machine.

**Data Location**: `~/.acme/acme.db` (dev mode: `./data/acme.db`)

## Schema Overview

```sql
-- Core tables
providers          -- AI provider configurations
projects           -- Workspace/project definitions
threads            -- Conversation threads
messages           -- Individual messages in threads
tasks              -- TodoWrite tasks within threads

-- Extension tables
mcp_servers        -- MCP server configurations
skills             -- Custom skill definitions
automations        -- Automation schedules

-- Integration tables
git_repos          -- Git repository metadata
prompt_library     -- Saved prompts

-- User data
settings           -- Key-value settings
media              -- Generated images/media
```

## Core Tables

### providers

```sql
CREATE TABLE providers (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,           -- 'codex' | 'claude-code' | 'opencode' | 'custom'
  name TEXT NOT NULL,
  config TEXT NOT NULL,         -- JSON blob
  enabled INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### projects

```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,     -- Absolute path
  provider_id TEXT REFERENCES providers(id),
  provider_config TEXT,         -- Provider-specific overrides
  mode TEXT DEFAULT 'local',   -- 'local' | 'worktree' | 'cloud'
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### threads

```sql
CREATE TABLE threads (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  provider_id TEXT REFERENCES providers(id),
  title TEXT,
  status TEXT DEFAULT 'active', -- 'active' | 'paused' | 'completed' | 'archived'
  mode TEXT DEFAULT 'local',    -- 'local' | 'worktree' | 'cloud'
  worktree_path TEXT,           -- If mode = 'worktree'
  model TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_message_at TEXT
);
```

### messages

```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES threads(id),
  role TEXT NOT NULL,           -- 'user' | 'assistant' | 'system'
  content TEXT NOT NULL,        -- JSON array (multi-modal)
  tools TEXT,                   -- JSON array of tool calls
  tool_results TEXT,            -- JSON array of tool results
  tokens_used INTEGER,
  reasoning TEXT,              -- Reasoning effort display
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### tasks

```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES threads(id),
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending' | 'in_progress' | 'completed'
  priority TEXT DEFAULT 'medium',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);
```

## TypeScript Interfaces

### Provider

```typescript
interface Provider {
  id: string;
  type: 'codex' | 'claude-code' | 'opencode' | 'custom';
  name: string;
  config: ProviderConfig;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ProviderConfig {
  // Common
  apiKey?: string;
  endpoint?: string;

  // Codex-specific
  codexPath?: string;

  // Claude Code-specific
  claudePath?: string;

  // Custom
  customBinaryPath?: string;
}
```

### Project

```typescript
interface Project {
  id: string;
  name: string;
  path: string;
  providerId?: string;
  providerConfig?: Record<string, unknown>;
  mode: 'local' | 'worktree' | 'cloud';
  createdAt: Date;
  updatedAt: Date;
}
```

### Thread

```typescript
interface Thread {
  id: string;
  projectId: string;
  providerId?: string;
  title?: string;
  status: ThreadStatus;
  mode: ThreadMode;
  worktreePath?: string;
  model?: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
}

type ThreadStatus = 'active' | 'paused' | 'completed' | 'archived';
type ThreadMode = 'local' | 'worktree' | 'cloud';
```

### Message

```typescript
interface Message {
  id: string;
  threadId: string;
  role: 'user' | 'assistant' | 'system';
  content: MessageContent[];
  tools?: ToolCall[];
  toolResults?: ToolResult[];
  tokensUsed?: number;
  reasoning?: string;
  createdAt: Date;
}

type MessageContent =
  | { type: 'text'; text: string }
  | { type: 'image'; source: 'url' | 'base64'; data: string }
  | { type: 'file'; path: string };

interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

interface ToolResult {
  toolCallId: string;
  output: string;
  error?: string;
}
```

### MCP Server

```typescript
interface MCPServer {
  id: string;
  name: string;
  type: 'stdio' | 'sse' | 'http';
  config: MCPServerConfig;
  enabled: boolean;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastError?: string;
}

interface MCPServerConfig {
  command?: string;          // For stdio
  args?: string[];
  url?: string;              // For sse/http
  env?: Record<string, string>;
}
```

### Skill

```typescript
interface Skill {
  id: string;
  name: string;
  description?: string;
  prompt: string;
  scope: 'global' | 'project';
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Automation

```typescript
interface Automation {
  id: string;
  name: string;
  description?: string;
  prompt: string;
  schedule: AutomationSchedule;
  enabled: boolean;
  projectId?: string;
  lastRun?: Date;
  lastResult?: AutomationResult;
  createdAt: Date;
  updatedAt: Date;
}

type AutomationSchedule =
  | { type: 'interval'; minutes: number }
  | { type: 'cron'; expression: string }
  | { type: 'manual' };

interface AutomationResult {
  success: boolean;
  messageCount: number;
  error?: string;
}
```

## Indexes

```sql
CREATE INDEX idx_threads_project ON threads(project_id);
CREATE INDEX idx_threads_status ON threads(status);
CREATE INDEX idx_messages_thread ON messages(thread_id);
CREATE INDEX idx_tasks_thread ON tasks(thread_id);
CREATE INDEX idx_projects_path ON projects(path);
```

## Data Migration

```typescript
interface Migration {
  version: number;
  up(): void;
  down(): void;
}

// Example migration
const migrations: Migration[] = [
  {
    version: 1,
    up: () => {
      db.exec(`
        CREATE TABLE providers (...);
        CREATE TABLE projects (...);
      `);
    },
    down: () => {
      db.exec('DROP TABLE IF EXISTS projects');
      db.exec('DROP TABLE IF EXISTS providers');
    }
  }
];
```

## Open Questions

1. Should we implement soft delete for threads/messages?
2. How to handle large message content (streaming, pagination)?
3. Should we encrypt sensitive config (API keys)?

---

**Status**: Draft
**Related RFCs**: 0002 (System Architecture), 0003 (Provider Abstraction)
**Reviewers**: (to be assigned)
