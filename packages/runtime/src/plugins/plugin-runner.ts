import type { Plugin } from './types'
import { PluginLoader } from './loader'

export class PluginRunner {
  private _loader: PluginLoader
  private _plugins: Map<string, Plugin> = new Map()

  constructor() {
    this._loader = new PluginLoader()
  }

  /**
   * 加载 Plugins
   */
  async loadPlugins(pluginsPath: string): Promise<Plugin[]> {
    const plugins = await this._loader.loadPlugins(pluginsPath)
    for (const plugin of plugins) {
      this._plugins.set(plugin.id, plugin)
    }
    return plugins
  }

  /**
   * 启用 Plugin
   */
  async enablePlugin(id: string): Promise<void> {
    const plugin = this._plugins.get(id)
    if (plugin) {
      plugin.enabled = true
      await plugin.onLoad?.()
    }
  }

  /**
   * 禁用 Plugin
   */
  async disablePlugin(id: string): Promise<void> {
    const plugin = this._plugins.get(id)
    if (plugin) {
      plugin.enabled = false
      await plugin.onUnload?.()
    }
  }

  /**
   * 获取 Plugin
   */
  getPlugin(id: string): Plugin | undefined {
    return this._plugins.get(id)
  }

  /**
   * 列出所有 Plugins
   */
  listPlugins(): Plugin[] {
    return Array.from(this._plugins.values())
  }
}
