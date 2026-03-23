/**
 * Tool definition for agent tool calling
 */
export interface ToolDefinition {
	name: string
	description?: string
	inputSchema: Record<string, unknown>
}

/**
 * A tool call made by the agent
 */
export interface ToolCall {
	id: string
	toolName: string
	input: Record<string, unknown>
}

/**
 * Result from executing a tool
 */
export interface ToolResult {
	toolCallId: string
	content: string
	isError?: boolean
}

/**
 * Tool 类型定义
 */
export interface ToolType {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

export interface ToolCallType {
  id: string
  toolName: string
  input: Record<string, unknown>
  output?: string
  createdAt: Date
}
