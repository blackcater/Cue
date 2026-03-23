export type AgentEvent =
  // Agent 生命周期
  | { type: 'agent_start' }
  | { type: 'agent_end' }
  | { type: 'agent_error'; error: string }
  // Turn 生命周期
  | { type: 'turn_start' }
  | { type: 'turn_end' }
  // 消息生命周期
  | { type: 'message_start'; message: Message }
  | { type: 'message_update'; message: Message; delta: string }
  | { type: 'message_end'; message: Message }
  // Tool 执行生命周期
  | { type: 'tool_execution_start'; toolCallId: string; toolName: string; args: unknown }
  | { type: 'tool_execution_update'; toolCallId: string; partialResult: unknown }
  | { type: 'tool_execution_end'; toolCallId: string; result: unknown; isError: boolean }

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: Date
}
