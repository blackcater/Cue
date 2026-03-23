import type { IAgent, AgentEvent } from '@acme-ai/core'

export interface RuntimeConfig {
  homeDir: string
}

export interface ThreadRuntime {
  id: string
  agent: IAgent
  vaultId: string
  messages: AgentEvent[]
}