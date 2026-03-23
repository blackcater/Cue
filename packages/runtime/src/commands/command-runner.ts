import { CommandLoader } from './loader'
import type { Command } from './types'

export class CommandRunner {
	private _loader: CommandLoader
	private _commands: Map<string, Command> = new Map()

	constructor() {
		this._loader = new CommandLoader()
	}

	/**
	 * Load Commands
	 */
	async loadCommands(commandsPath: string): Promise<Command[]> {
		const commands = await this._loader.loadCommands(commandsPath)
		for (const command of commands) {
			this._commands.set(command.name, command)
		}
		return commands
	}

	/**
	 * Execute Command
	 */
	async execute(name: string, args: string[] = []): Promise<string> {
		const command = this._commands.get(name)
		if (!command) {
			throw new Error(`Command not found: ${name}`)
		}
		return command.handler(args)
	}

	/**
	 * Get Command
	 */
	getCommand(name: string): Command | undefined {
		return this._commands.get(name)
	}

	/**
	 * List all Commands
	 */
	listCommands(): Command[] {
		return Array.from(this._commands.values())
	}
}
