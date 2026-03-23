export interface McpServer {
  id: string
  name: string
  command: string
  args?: string[]
  env?: Record<string, string>
  running: boolean
}

export interface McpTool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}
