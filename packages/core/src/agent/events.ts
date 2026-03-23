export type AgentEvent =
	// Agent lifecycle
	| { type: 'agent_start' }
	| { type: 'agent_end' }
	| { type: 'agent_error'; error: string }
	// Turn lifecycle
	| { type: 'turn_start' }
	| { type: 'turn_end' }
	// Message lifecycle
	| { type: 'message_start'; message: AgentMessage }
	| { type: 'message_update'; message: AgentMessage; delta: string }
	| { type: 'message_end'; message: AgentMessage }
	// Tool execution lifecycle
	| {
			type: 'tool_execution_start'
			toolCallId: string
			toolName: string
			args: unknown
	  }
	| {
			type: 'tool_execution_update'
			toolCallId: string
			partialResult: unknown
	  }
	| {
			type: 'tool_execution_end'
			toolCallId: string
			result: unknown
			isError: boolean
	  }

export interface AgentMessage {
	id: string
	role: 'user' | 'assistant' | 'system'
	content: string
	createdAt: Date
}
