import type { IAgent, AgentEvent, AgentType, AgentConfig } from '@acme-ai/core'
import { ConfigManager } from '../config/config-manager'
import type { RuntimeConfig, ThreadRuntime } from './types'

export class AgentRuntime {
  private _config: RuntimeConfig
  private _configManager: ConfigManager
  private _agents: Map<string, IAgent> = new Map()
  private _threads: Map<string, ThreadRuntime> = new Map()
  private _started = false

  constructor(config: RuntimeConfig) {
    this._config = config
    this._configManager = new ConfigManager(config.homeDir)
  }

  get configManager(): ConfigManager {
    return this._configManager
  }

  get started(): boolean {
    return this._started
  }

  /**
   * 启动 Runtime
   */
  async start(): Promise<void> {
    if (this._started) return
    this._started = true
  }

  /**
   * 停止 Runtime
   */
  async stop(): Promise<void> {
    if (!this._started) return

    // 停止所有线程
    for (const thread of this._threads.values()) {
      await thread.agent.stop()
    }
    this._threads.clear()

    // 停止所有 Agent
    for (const agent of this._agents.values()) {
      await agent.stop()
    }
    this._agents.clear()

    this._started = false
  }

  /**
   * 注册 Agent
   */
  registerAgent(agent: IAgent): void {
    this._agents.set(agent.id, agent)
  }

  /**
   * 注销 Agent
   */
  unregisterAgent(agentId: string): void {
    this._agents.delete(agentId)
  }

  /**
   * 获取 Agent
   */
  getAgent(agentId: string): IAgent | undefined {
    return this._agents.get(agentId)
  }

  /**
   * 列出所有 Agent
   */
  listAgents(): IAgent[] {
    return Array.from(this._agents.values())
  }

  /**
   * 创建 Thread
   */
  createThread(vaultId: string, agentId: string): string {
    const agent = this._agents.get(agentId)
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`)
    }

    const threadId = `thread-${Date.now()}`
    this._threads.set(threadId, {
      id: threadId,
      agent,
      vaultId,
      messages: [],
    })

    return threadId
  }

  /**
   * 获取 Thread
   */
  getThread(threadId: string): ThreadRuntime | undefined {
    return this._threads.get(threadId)
  }

  /**
   * 发送消息到 Thread
   */
  async sendMessage(threadId: string, content: string): Promise<void> {
    const thread = this._threads.get(threadId)
    if (!thread) {
      throw new Error(`Thread not found: ${threadId}`)
    }

    await thread.agent.sendMessage(content)
  }

  /**
   * 销毁 Thread
   */
  async destroyThread(threadId: string): Promise<void> {
    const thread = this._threads.get(threadId)
    if (thread) {
      await thread.agent.stop()
      this._threads.delete(threadId)
    }
  }
}