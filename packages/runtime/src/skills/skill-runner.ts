import type { Skill } from '@acme-ai/core'

import { SkillLoader } from './skill-loader'

export class SkillRunner {
	private _loader: SkillLoader
	private _skills: Map<string, Skill> = new Map()

	constructor() {
		this._loader = new SkillLoader()
	}

	/**
	 * Load Skills
	 */
	async loadSkills(skillsPath: string): Promise<Skill[]> {
		const skills = await this._loader.loadSkills(skillsPath)
		for (const skill of skills) {
			this._skills.set(skill.id, skill)
		}
		return skills
	}

	/**
	 * 获取 Skill
	 */
	getSkill(id: string): Skill | undefined {
		return this._skills.get(id)
	}

	/**
	 * 列出所有 Skills
	 */
	listSkills(): Skill[] {
		return Array.from(this._skills.values())
	}
}
