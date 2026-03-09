# RFC 0009: MCP & Skills System

## Summary

This document defines the extensibility system for Acme through MCP (Model Context Protocol) servers and custom skills.

## MCP Overview

MCP (Model Context Protocol) allows AI models to interact with external tools and data sources. Acme supports MCP servers in three transport modes:

| Transport | Description                 | Use Case        |
| --------- | --------------------------- | --------------- |
| **stdio** | Child process communication | Local CLI tools |
| **sse**   | Server-Sent Events          | Web services    |
| **http**  | REST API                    | External APIs   |

## MCP Server Management

### Server Configuration

```typescript
interface MCPServer {
  id: string;
  name: string;
  description?: string;

  // Transport
  transport: 'stdio' | 'sse' | 'http';
  config: MCPServerConfig;

  // Scope
  scope: 'global' | 'project';
  projectId?: string;

  // Runtime
  enabled: boolean;
  status: MCPServerStatus;
}

interface MCPServerConfig {
  // stdio
  command?: string;
  args?: string[];
  env?: Record<string, string>;

  // sse/http
  url?: string;
  headers?: Record<string, string>;
}

type MCPServerStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';
```

### Server Lifecycle

```
┌──────────────┐
│  DISCONNECTED│
└──────┬───────┘
       │ enable
       ▼
┌──────────────┐
│  CONNECTING │ ── Spawn process / connect
└──────┬───────┘
       │
       ├──────────────┐
       │              │
       ▼              ▼
┌──────────────┐  ┌──────────┐
│  CONNECTED   │  │  ERROR   │
└──────┬───────┘  └──────────┘
       │ disable
       ▼
┌──────────────┐
│  DISCONNECTED│
└──────────────┘
```

### Recommended Servers

Acme provides one-click setup for popular MCP servers:

| Server     | Description            |
| ---------- | ---------------------- |
| Filesystem | Read/write local files |
| GitHub     | GitHub API integration |
| Puppeteer  | Browser automation     |
| PostgreSQL | Database queries       |
| Slack      | Slack notifications    |

## Skills System

### What is a Skill?

A **Skill** is a reusable prompt template that the agent can use. Skills provide:
- Structured instructions for common tasks
- Parameter placeholders
- Execution context

```typescript
interface Skill {
  id: string;
  name: string;
  description?: string;

  // Prompt template
  prompt: string;

  // Parameters
  parameters?: SkillParameter[];

  // Scope
  scope: 'global' | 'project';
  projectId?: string;

  // Metadata
  author?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface SkillParameter {
  name: string;
  description?: string;
  type: 'string' | 'number' | 'boolean' | 'choice';
  default?: unknown;
  choices?: string[];
  required?: boolean;
}
```

### Skill Examples

```yaml
# Skill: Review Code
name: review
description: Perform a code review
prompt: |
  Review the following code changes:

  {{changes}}

  Focus on:
  - Potential bugs
  - Security issues
  - Code quality
  - Performance concerns

  Provide a detailed review with specific suggestions.

parameters:
  - name: changes
    type: string
    required: true
    description: Git diff or files to review
```

```yaml
# Skill: Write Tests
name: write-tests
description: Generate unit tests
prompt: |
  Write comprehensive unit tests for:

  {{file}}

  Use {{framework}} testing framework.
  Coverage should include:
  - Happy path
  - Edge cases
  - Error handling

parameters:
  - name: file
    type: string
    required: true
  - name: framework
    type: choice
    default: vitest
    choices: [vitest, jest, mocha]
```

### Skill Invocation

Users can invoke skills in several ways:

1. **Slash Command**: `/skill-name param=value`
2. **Composer Autocomplete**: Type `$` to see available skills
3. **Sidebar**: Click skill from skills panel
4. **Thread Menu**: Apply skill to existing thread

### Skill Marketplace

```
┌─────────────────────────────────────────────┐
│ Skills Marketplace                    🔍   │
├─────────────────────────────────────────────┤
│ Search: [_________________________]         │
├─────────────────────────────────────────────┤
│ Featured                                    │
│ ├ 🔧 Fix Bug                    by @author │
│ │   Quickly identify and fix bugs        │
│ ├ 📝 Write Tests                 by @author│
│ │   Generate comprehensive test suites   │
│ └ 🎨 Refactor                   by @author │
│                                             │
│ Categories                                  │
│ ├ Testing (12)                              │
│ ├ Code Review (8)                           │
│ └ Documentation (5)                         │
└─────────────────────────────────────────────┘
```

## Integration with Provider

```typescript
interface ProviderMCPIntegration {
  // Get tools from MCP servers
  getTools(): Tool[];

  // Execute MCP tool
  executeTool(name: string, input: Record<string, unknown>): Promise<ToolResult>;

  // Handle MCP notifications
  onNotification(handler: (notification: MCPNotification) => void): void;
}
```

## Open Questions

1. Should we support skill versioning?
2. How to handle skill conflicts across projects?
3. Should we implement skill sharing via GitHub Gist?

---

**Status**: Draft
**Related RFCs**: 0002 (System Architecture), 0003 (Provider Abstraction), 0004 (Data Models)
**Reviewers**: (to be assigned)
