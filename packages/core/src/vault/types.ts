/**
 * Vault represents a project
 */
export interface Vault {
	id: string
	name: string
	rootPath: string
	description?: string
	icon?: string
	settings: VaultSettings
	createdAt: Date
	lastVisitedAt?: Date
}

export interface VaultSettings {
	defaultProviderId?: string
	defaultModelId?: string
}

/**
 * Vault 类型定义
 */
export interface VaultType {
  id: string
  name: string
  path: string
  createdAt: Date
  updatedAt: Date
}

export interface VaultConfig {
  skills?: string[]
  agents?: string[]
  plugins?: string[]
  commands?: string[]
  // 覆盖全局配置
  [key: string]: unknown
}
