import { AgentType } from '@acme-ai/core'
import type { AgentMessage } from '@acme-ai/core'

import { AgentBase } from '../base/agent-base'

/**
 * Acmex Agent Configuration
 * Based on vercel/ai and pi-mono implementation
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
 * Self-developed Agent, uses vercel/ai for model access
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

		// TODO: Integrate vercel/ai implementation
		// Reference pi-mono's agent-loop.ts implementation
		// Use streamSimple or similar API
	}
}
