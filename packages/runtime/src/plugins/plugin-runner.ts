import { PluginLoader } from './loader'
import type { Plugin } from './types'

export class PluginRunner {
	private _loader: PluginLoader
	private _plugins: Map<string, Plugin> = new Map()

	constructor() {
		this._loader = new PluginLoader()
	}

	/**
	 * Load Plugins
	 */
	async loadPlugins(pluginsPath: string): Promise<Plugin[]> {
		const plugins = await this._loader.loadPlugins(pluginsPath)
		for (const plugin of plugins) {
			this._plugins.set(plugin.id, plugin)
		}
		return plugins
	}

	/**
	 * Enable Plugin
	 */
	async enablePlugin(id: string): Promise<void> {
		const plugin = this._plugins.get(id)
		if (plugin) {
			plugin.enabled = true
			await plugin.onLoad?.()
		}
	}

	/**
	 * Disable Plugin
	 */
	async disablePlugin(id: string): Promise<void> {
		const plugin = this._plugins.get(id)
		if (plugin) {
			plugin.enabled = false
			await plugin.onUnload?.()
		}
	}

	/**
	 * Get Plugin
	 */
	getPlugin(id: string): Plugin | undefined {
		return this._plugins.get(id)
	}

	/**
	 * List all Plugins
	 */
	listPlugins(): Plugin[] {
		return Array.from(this._plugins.values())
	}
}
