import type { AgentEvent } from './events'

/**
 * Agent 类型枚举
 */
export enum AgentType {
  ClaudeCode = 'claude-code',
  Codex = 'codex',
  Acmex = 'acmex',
}

/**
 * Agent 模式
 */
export interface AgentMode {
  value: string
  label: string
  description?: string
}

/**
 * 统一的 Agent 接口
 * 所有 Agent 实现必须实现此接口
 */
export interface IAgent {
  readonly id: string
  readonly name: string
  readonly type: AgentType

  /** 启动 Agent */
  start(): Promise<void>

  /** 停止 Agent */
  stop(): Promise<void>

  /** 发送消息 */
  sendMessage(content: string): Promise<void>

  /** 订阅事件 */
  onEvent(handler: (event: AgentEvent) => void): () => void
}

/**
 * Agent 配置
 */
export interface AgentConfig {
  id?: string
  name: string
  type: AgentType
  mode: AgentMode
  providerId?: string
}

/**
 * 扩展现有 Agent 接口
 */
export interface Agent {
  id: string
  name: string
  type: AgentType
  mode: AgentMode
  providerId?: string
  createdAt: Date
  updatedAt: Date
}
