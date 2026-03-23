import { readdir } from 'fs/promises'
import { join } from 'path'
import type { Plugin } from './types'

export class PluginLoader {
  constructor() {}

  /**
   * 加载目录下的所有 Plugins
   */
  async loadPlugins(pluginsPath: string): Promise<Plugin[]> {
    const plugins: Plugin[] = []

    try {
      const entries = await readdir(pluginsPath, { withFileTypes: true })

      for (const entry of entries) {
        if (!entry.isDirectory()) continue

        const pluginPath = join(pluginsPath, entry.name)

        const plugin: Plugin = {
          id: entry.name,
          name: entry.name,
          version: '0.0.1',
          enabled: true,
        }

        plugins.push(plugin)
      }
    } catch {
      // 目录不存在
    }

    return plugins
  }
}
