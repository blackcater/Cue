import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import type { GlobalSettings, VaultSettings } from './types'

const DEFAULT_SETTINGS: GlobalSettings = {
  ui: { theme: 'system' },
}

export class ConfigManager {
  private _homeDir: string
  private _globalSettings: GlobalSettings | null = null
  private _vaultSettings: Map<string, VaultSettings> = new Map()

  constructor(homeDir: string) {
    this._homeDir = homeDir
  }

  /**
   * 获取全局配置
   */
  async getGlobalSettings(): Promise<GlobalSettings> {
    if (this._globalSettings) {
      return this._globalSettings
    }

    const settingsPath = join(this._homeDir, 'settings.json')

    try {
      const content = await readFile(settingsPath, 'utf-8')
      this._globalSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(content) }
    } catch {
      this._globalSettings = { ...DEFAULT_SETTINGS }
    }

    return this._globalSettings!
  }

  /**
   * 保存全局配置
   */
  async saveGlobalSettings(settings: GlobalSettings): Promise<void> {
    const settingsPath = join(this._homeDir, 'settings.json')
    await this._ensureDir(this._homeDir)
    await writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf-8')
    this._globalSettings = settings
  }

  /**
   * 获取 Vault 配置
   */
  async getVaultSettings(vaultId: string): Promise<VaultSettings> {
    if (this._vaultSettings.has(vaultId)) {
      return this._vaultSettings.get(vaultId)!
    }

    const vaultPath = join(this._homeDir, 'vaults', vaultId)
    const settingsPath = join(vaultPath, 'settings.json')

    try {
      const content = await readFile(settingsPath, 'utf-8')
      const settings = JSON.parse(content) as VaultSettings
      this._vaultSettings.set(vaultId, settings)
      return settings
    } catch {
      return {}
    }
  }

  /**
   * 保存 Vault 配置
   */
  async saveVaultSettings(vaultId: string, settings: VaultSettings): Promise<void> {
    const vaultPath = join(this._homeDir, 'vaults', vaultId)
    const settingsPath = join(vaultPath, 'settings.json')
    await this._ensureDir(vaultPath)
    await writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf-8')
    this._vaultSettings.set(vaultId, settings)
  }

  /**
   * 获取合并后的配置（Vault 配置覆盖全局配置）
   */
  async getMergedSettings(vaultId: string): Promise<GlobalSettings & VaultSettings> {
    const globalSettings = await this.getGlobalSettings()
    const vaultSettings = await this.getVaultSettings(vaultId)
    return { ...globalSettings, ...vaultSettings }
  }

  private async _ensureDir(dir: string): Promise<void> {
    try {
      await mkdir(dir, { recursive: true })
    } catch {
      // Ignore
    }
  }
}