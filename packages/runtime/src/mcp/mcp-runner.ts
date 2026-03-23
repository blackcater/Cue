import { spawn, ChildProcess } from 'child_process'

import type { McpServer } from './types'

export class McpRunner {
	private _servers: Map<string, McpServer> = new Map()
	private _processes: Map<string, ChildProcess> = new Map()

	constructor() {}

	/**
	 * Add MCP Server
	 */
	addServer(server: McpServer): void {
		this._servers.set(server.id, server)
	}

	/**
	 * Start MCP Server
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
	 * Stop MCP Server
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
	 * Get Server
	 */
	getServer(id: string): McpServer | undefined {
		return this._servers.get(id)
	}

	/**
	 * List all Servers
	 */
	listServers(): McpServer[] {
		return Array.from(this._servers.values())
	}

	/**
	 * List all running Servers
	 */
	listRunningServers(): McpServer[] {
		return this.listServers().filter((s) => s.running)
	}
}
