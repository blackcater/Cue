import { spawn, ChildProcess } from 'child_process'
import type { McpServer, McpTool } from './types'

export class McpRunner {
  private _servers: Map<string, McpServer> = new Map()
  private _processes: Map<string, ChildProcess> = new Map()

  constructor() {}

  /**
   * 添加 MCP Server
   */
  addServer(server: McpServer): void {
    this._servers.set(server.id, server)
  }

  /**
   * 启动 MCP Server
   */
  async startServer(id: string): Promise<void> {
    const server = this._servers.get(id)
    if (!server) {
      throw new Error(`MCP Server not found: ${id}`)
    }

    if (server.running) return

    const proc = spawn(server.command, server.args || [], {
      env: { ...process.env, ...server.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    this._processes.set(id, proc)
    server.running = true
  }

  /**
   * 停止 MCP Server
   */
  async stopServer(id: string): Promise<void> {
    const server = this._servers.get(id)
    const proc = this._processes.get(id)

    if (proc) {
      proc.kill()
      this._processes.delete(id)
    }

    if (server) {
      server.running = false
    }
  }

  /**
   * 获取 Server
   */
  getServer(id: string): McpServer | undefined {
    return this._servers.get(id)
  }

  /**
   * 列出所有 Servers
   */
  listServers(): McpServer[] {
    return Array.from(this._servers.values())
  }

  /**
   * 列出所有运行中的 Servers
   */
  listRunningServers(): McpServer[] {
    return this.listServers().filter((s) => s.running)
  }
}
