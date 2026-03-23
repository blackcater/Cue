import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

import type { Skill, SkillManifest } from '@acme-ai/core'

export class SkillLoader {
	constructor() {}

	/**
	 * Load all Skills in the directory
	 */
	async loadSkills(skillsPath: string): Promise<Skill[]> {
		const skills: Skill[] = []

		try {
			const entries = await readdir(skillsPath, { withFileTypes: true })

			for (const entry of entries) {
				if (!entry.isDirectory()) continue

				const skillPath = join(skillsPath, entry.name)
				const manifestPath = join(skillPath, 'SKILL.md')

				try {
					// Check if SKILL.md exists
					await readFile(manifestPath, 'utf-8')

					const skill: Skill = {
						id: entry.name,
						name: entry.name,
						description: '',
						path: skillPath,
						enabled: true,
					}

					skills.push(skill)
				} catch {
					// Skip invalid Skill
				}
			}
		} catch {
			// Directory does not exist, return empty array
		}

		return skills
	}

	/**
	 * Load a single Skill's Manifest
	 */
	async loadManifest(skillPath: string): Promise<SkillManifest | null> {
		const manifestPath = join(skillPath, 'SKILL.md')

		try {
			const _content = await readFile(manifestPath, 'utf-8')
			// SKILL.md is Markdown, parse metadata from it
			// TODO: Implement actual parsing logic
			return null
		} catch {
			return null
		}
	}
}
