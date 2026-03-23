import type { AgentEvent } from './events'

/**
 * Agent type enumeration
 */
export enum AgentType {
	ClaudeCode = 'claude-code',
	Codex = 'codex',
	Acmex = 'acmex',
}

/**
 * Agent mode
 */
export interface AgentMode {
	value: string
	label: string
	description?: string
}

/**
 * Unified Agent interface
 * All Agent implementations must implement this interface
 */
export interface IAgent {
	readonly id: string
	readonly name: string
	readonly type: AgentType

	/** Start the Agent */
	start(): Promise<void>

	/** Stop the Agent */
	stop(): Promise<void>

	/** Send a message */
	sendMessage(content: string): Promise<void>

	/** Subscribe to events */
	onEvent(handler: (event: AgentEvent) => void): () => void
}

/**
 * Agent configuration
 */
export interface AgentConfig {
	id?: string
	name: string
	type: AgentType
	mode: AgentMode
	providerId?: string
}

/**
 * Extended Agent interface
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
