import { AgentType } from '@acme-ai/core'

import { AgentBase } from '../base/agent-base'

/**
 * Codex Agent Configuration
 */
export interface CodexAgentConfig {
	id?: string
	name?: string
	model?: string
	workingDirectory?: string
}

/**
 * Codex Agent
 * Based on OpenAI Agent SDK implementation
 */
export class CodexAgent extends AgentBase {
	private _config: CodexAgentConfig

	constructor(config: CodexAgentConfig = {}) {
		const id = config.id || `codex-${Date.now()}`
		const name = config.name || 'Codex'
		super(id, name, AgentType.Codex)
		this._config = config
	}

	async sendMessage(content: string): Promise<void> {
		if (!this._started) {
			throw new Error('Agent not started')
		}

		this._emit({
			type: 'message_start',
			message: {
				id: `msg-${Date.now()}`,
				role: 'user',
				content,
				createdAt: new Date(),
			},
		})

		// TODO: Integrate OpenAI Agent SDK
		// This needs to be implemented based on the actual SDK API
	}
}
