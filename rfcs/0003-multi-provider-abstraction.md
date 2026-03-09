# RFC 0003: Multi-Provider Abstraction Layer

## Summary

This document defines the abstraction layer that allows Acme to support multiple AI coding providers (Codex, Claude Code, OpenCode) through a unified interface.

## Motivation

Each AI coding assistant has different:
- Authentication mechanisms
- Communication protocols (stdio, HTTP, MCP)
- Tool definitions and capabilities
- Configuration formats

We need a unified abstraction that allows the UI and business logic to work with any provider without knowing provider-specific details.

## Provider Interface

```typescript
// Core provider capabilities
interface IProvider {
  // Metadata
  readonly id: string;
  readonly name: string;
  readonly logo: string;

  // Connection
  connect(config: ProviderConfig): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // Session management
  createSession(options: SessionOptions): Promise<ProviderSession>;

  // Capabilities
  getCapabilities(): ProviderCapabilities;

  // Config UI
  renderConfigUI(): React.ReactNode;
}

// Session for individual conversations
interface IProviderSession {
  readonly id: string;
  readonly providerId: string;

  // Messaging
  sendMessage(content: string, options?: MessageOptions): Promise<void>;
  onMessage(handler: MessageHandler): () => void;

  // Control
  interrupt(): Promise<void>;
  resume(): Promise<void>;

  // Tools
  getAvailableTools(): Tool[];

  // State
  getState(): SessionState;

  // Lifecycle
  close(): Promise<void>;
}
```

## Supported Providers

### 1. OpenAI Codex

| Aspect   | Implementation                           |
| -------- | ---------------------------------------- |
| Protocol | `codex app-server` (JSON-RPC over stdio) |
| Auth     | `codex login` / API key                  |
| Config   | `$CODEX_HOME/config.toml`                |
| Tools    | Built-in Codex tools                     |
| Session  | Thread-based                             |

```typescript
class CodexProvider implements IProvider {
  async createSession(options: SessionOptions): Promise<ProviderSession> {
    // Spawn codex app-server process
    // Establish JSON-RPC communication
    // Return CodexSession wrapper
  }
}
```

### 2. Anthropic Claude Code

| Aspect   | Implementation                                 |
| -------- | ---------------------------------------------- |
| Protocol | Claude Agent SDK (`@anthropic-ai/claude-code`) |
| Auth     | `claude login` / API key                       |
| Config   | Claude config directory                        |
| Tools    | Agent SDK tools                                |
| Session  | Conversation-based                             |

```typescript
class ClaudeCodeProvider implements IProvider {
  async createSession(options: SessionOptions): Promise<ProviderSession> {
    // Use Claude Agent SDK
    // Create conversation with cwd
    // Return ClaudeSession wrapper
  }
}
```

### 3. OpenCode

| Aspect   | Implementation  |
| -------- | --------------- |
| Protocol | MCP protocol    |
| Auth     | API key         |
| Config   | OpenCode config |
| Tools    | MCP tools       |
| Session  | Session-based   |

```typescript
class OpenCodeProvider implements IProvider {
  async createSession(options: SessionOptions): ProviderSession {
    // Connect via MCP
    // Return OpenCodeSession wrapper
  }
}
```

## Capability Model

```typescript
interface ProviderCapabilities {
  // Thread/Session
  supportsThreads: boolean;
  supportsWorktrees: boolean;

  // Tools
  supportsShell: boolean;
  supportsFileEdit: boolean;
  supportsWebSearch: boolean;
  supportsImageVision: boolean;

  // Advanced
  supportsSkills: boolean;
  supportsMCP: boolean;
  supportsAutomations: boolean;

  // Collaboration
  supportsMultiAgent: boolean;
  supportsRemote: boolean;

  // Input
  supportsVoiceDictation: boolean;
  supportsMultimodal: boolean;
}
```

## Provider Selection

### Per-Project Configuration

```typescript
interface ProjectConfig {
  providerId: string;
  model?: string;
  mode?: 'local' | 'cloud' | 'worktree';
  permissions?: PermissionConfig;
}
```

### Per-Thread Override

Users can override the provider for individual threads, enabling:
- Comparing different providers on the same task
- Using specific providers for specific tasks

## Error Handling

```typescript
interface ProviderError {
  code: string;
  message: string;
  provider: string;
  recoverable: boolean;
  suggestion?: string;
}

// Error codes
const ErrorCodes = {
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PROCESS_CRASHED: 'PROCESS_CRASHED',
  TOOL_PERMISSION_DENIED: 'TOOL_PERMISSION_DENIED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
} as const;
```

## Configuration Storage

```typescript
interface StoredProviderConfig {
  id: string;
  type: 'codex' | 'claude-code' | 'opencode' | 'custom';
  name: string;
  config: {
    // Provider-specific config
    apiKey?: string;
    endpoint?: string;
    customBinaryPath?: string;
  };
  enabled: boolean;
}
```

## Migration Path

1. **Phase 1**: Implement Codex and Claude Code support
2. **Phase 2**: Add OpenCode support
3. **Phase 3**: Support custom MCP-based providers

## Open Questions

1. Should we support multiple concurrent sessions from different providers?
2. How to handle provider-specific file formats (e.g., Claude's session files)?
3. Should we allow third-party provider plugins?

---

**Status**: Draft
**Related RFCs**: 0002 (System Architecture), 0004 (Data Models)
**Reviewers**: (to be assigned)
