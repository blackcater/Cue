import { AgentBase } from '../base/agent-base'
import { AgentType } from '@acme-ai/core'
import type { AgentEvent, AgentMessage } from '@acme-ai/core'

/**
 * Acmex Agent 配置
 * 基于 vercel/ai + 仿 pi-mono 实现
 */
export interface AcmexAgentConfig {
  id?: string
  name?: string
  model?: string
  apiKey?: string
  baseURL?: string
  workingDirectory?: string
}

/**
 * Acmex Agent
 * 自研 Agent，模型访问使用 vercel/ai
 */
export class AcmexAgent extends AgentBase {
  private _config: AcmexAgentConfig

  constructor(config: AcmexAgentConfig = {}) {
    const id = config.id || `acmex-${Date.now()}`
    const name = config.name || 'Acmex'
    super(id, name, AgentType.Acmex)
    this._config = config
  }

  async sendMessage(content: string): Promise<void> {
    if (!this._started) {
      throw new Error('Agent not started')
    }

    const userMessage: AgentMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date(),
    }

    this._emit({
      type: 'message_start',
      message: userMessage,
    })

    // TODO: 集成 vercel/ai 实现
    // 参考 pi-mono 的 agent-loop.ts 实现
    // 使用 streamSimple 或类似 API
  }
}
