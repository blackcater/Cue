import type { IAgent } from '@acme-ai/core'

import { CommandRunner } from '../commands/command-runner'
import { ConfigManager } from '../config/config-manager'
import { McpRunner } from '../mcp/mcp-runner'
import { PluginRunner } from '../plugins/plugin-runner'
import { SkillRunner } from '../skills/skill-runner'
import type { RuntimeConfig, ThreadRuntime } from './types'

export class AgentRuntime {
	private _config: RuntimeConfig
	private _configManager: ConfigManager
	private _agents: Map<string, IAgent> = new Map()
	private _threads: Map<string, ThreadRuntime> = new Map()
	private _started = false

	// Runtime extensions
	readonly skills: SkillRunner
	readonly commands: CommandRunner
	readonly plugins: PluginRunner
	readonly mcp: McpRunner

	constructor(config: RuntimeConfig) {
		this._config = config
		this._configManager = new ConfigManager(config.homeDir)
		this.skills = new SkillRunner()
		this.commands = new CommandRunner()
		this.plugins = new PluginRunner()
		this.mcp = new McpRunner()
	}

	get configManager(): ConfigManager {
		return this._configManager
	}

	get started(): boolean {
		return this._started
	}

	/**
	 * Start Runtime
	 */
	async start(): Promise<void> {
		if (this._started) return
		this._started = true

		// Load global extensions
		const settings = await this._configManager.getGlobalSettings()

		// Load Skills
		const globalSkillsPath = `${this._config.homeDir}/skills`
		await this.skills.loadSkills(globalSkillsPath)

		// Load Commands
		const globalCommandsPath = `${this._config.homeDir}/commands`
		await this.commands.loadCommands(globalCommandsPath)

		// Load Plugins
		const globalPluginsPath = `${this._config.homeDir}/plugins`
		await this.plugins.loadPlugins(globalPluginsPath)

		// Load MCP Servers
		if (settings.mcpServers) {
			for (const server of settings.mcpServers) {
				this.mcp.addServer({
					id: server.name,
					name: server.name,
					command: server.command,
					args: server.args,
					env: server.env,
					running: false,
				})
			}
		}
	}

	/**
	 * Stop Runtime
	 */
	async stop(): Promise<void> {
		if (!this._started) return

		// Stop all MCP Servers
		for (const server of this.mcp.listRunningServers()) {
			await this.mcp.stopServer(server.id)
		}

		// Stop all threads
		for (const thread of this._threads.values()) {
			await thread.agent.stop()
		}
		this._threads.clear()

		// Stop all Agents
		for (const agent of this._agents.values()) {
			await agent.stop()
		}
		this._agents.clear()

		this._started = false
	}

	/**
	 * Register Agent
	 */
	registerAgent(agent: IAgent): void {
		this._agents.set(agent.id, agent)
	}

	/**
	 * Unregister Agent
	 */
	unregisterAgent(agentId: string): void {
		this._agents.delete(agentId)
	}

	/**
	 * Get Agent
	 */
	getAgent(agentId: string): IAgent | undefined {
		return this._agents.get(agentId)
	}

	/**
	 * List all Agents
	 */
	listAgents(): IAgent[] {
		return Array.from(this._agents.values())
	}

	/**
	 * Create Thread
	 */
	createThread(vaultId: string, agentId: string): string {
		const agent = this._agents.get(agentId)
		if (!agent) {
			throw new Error(`Agent not found: ${agentId}`)
		}

		const threadId = `thread-${Date.now()}`
		this._threads.set(threadId, {
			id: threadId,
			agent,
			vaultId,
			messages: [],
		})

		return threadId
	}

	/**
	 * Get Thread
	 */
	getThread(threadId: string): ThreadRuntime | undefined {
		return this._threads.get(threadId)
	}

	/**
	 * Send message to Thread
	 */
	async sendMessage(threadId: string, content: string): Promise<void> {
		const thread = this._threads.get(threadId)
		if (!thread) {
			throw new Error(`Thread not found: ${threadId}`)
		}

		await thread.agent.sendMessage(content)
	}

	/**
	 * Destroy Thread
	 */
	async destroyThread(threadId: string): Promise<void> {
		const thread = this._threads.get(threadId)
		if (thread) {
			await thread.agent.stop()
			this._threads.delete(threadId)
		}
	}
}
