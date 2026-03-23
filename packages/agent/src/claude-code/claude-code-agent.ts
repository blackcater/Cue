import { AgentType } from '@acme-ai/core'

import { AgentBase } from '../base/agent-base'

/**
 * Claude Code Agent Configuration
 */
export interface ClaudeCodeAgentConfig {
	id?: string
	name?: string
	workingDirectory?: string
}

/**
 * Claude Code Agent
 * Based on Claude Code Agent SDK implementation
 */
export class ClaudeCodeAgent extends AgentBase {
	private _config: ClaudeCodeAgentConfig

	constructor(config: ClaudeCodeAgentConfig = {}) {
		const id = config.id || `claude-code-${Date.now()}`
		const name = config.name || 'Claude Code'
		super(id, name, AgentType.ClaudeCode)
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

		// TODO: Integrate Claude Code Agent SDK
		// This needs to be implemented based on the actual SDK API
		// Example pseudocode:
		// const session = await claudeCode.createSession({
		//   workingDirectory: this._config.workingDirectory,
		// })
		// const response = await session.sendMessage(content)
	}
}
