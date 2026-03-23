export interface Skill {
	id: string
	scope: 'global' | 'vault'
	vaultId?: string
	name: string
	description?: string
	icon?: string
	prompt: string
	isEnabled: boolean
	createdAt: Date
	updatedAt: Date
}

/**
 * Skill Manifest 类型定义
 */
export interface SkillType {
  id: string
  name: string
  description: string
  path: string
  enabled: boolean
}

export interface SkillManifest {
  name: string
  description: string
  version: string
  main: string
  tools?: string[]
  commands?: string[]
}
