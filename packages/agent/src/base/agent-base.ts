import type { IAgent, AgentEvent, AgentType } from '@acme-ai/core'

/**
 * Agent event handler type
 */
type AgentEventHandler = (event: AgentEvent) => void

/**
 * Agent base class, implements common logic
 */
export abstract class AgentBase implements IAgent {
	readonly id: string
	readonly name: string
	readonly type: AgentType

	protected _started = false
	protected _handlers: Set<AgentEventHandler> = new Set()

	constructor(id: string, name: string, type: AgentType) {
		this.id = id
		this.name = name
		this.type = type
	}

	get started(): boolean {
		return this._started
	}

	/**
	 * Start the Agent
	 */
	async start(): Promise<void> {
		if (this._started) return
		this._started = true
		this._emit({ type: 'agent_start' })
	}

	/**
	 * Stop the Agent
	 */
	async stop(): Promise<void> {
		if (!this._started) return
		this._started = false
		this._emit({ type: 'agent_end' })
	}

	/**
	 * Send a message - implemented by subclass
	 */
	abstract sendMessage(content: string): Promise<void>

	/**
	 * Subscribe to events
	 * @returns Unsubscribe function
	 */
	onEvent(handler: AgentEventHandler): () => void {
		this._handlers.add(handler)
		return () => {
			this._handlers.delete(handler)
		}
	}

	/**
	 * Send event to all subscribers
	 */
	protected _emit(event: AgentEvent): void {
		for (const handler of this._handlers) {
			try {
				handler(event)
			} catch (error) {
				console.error('Error in agent event handler:', error)
			}
		}
	}
}
