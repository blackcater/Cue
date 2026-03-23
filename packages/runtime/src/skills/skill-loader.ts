import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import type { Skill, SkillManifest } from '@acme-ai/core'

export class SkillLoader {
  constructor() {}

  /**
   * 加载目录下的所有 Skills
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
          // 验证 SKILL.md 是否存在
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
          // 跳过无效的 Skill
        }
      }
    } catch {
      // 目录不存在，返回空数组
    }

    return skills
  }

  /**
   * 加载单个 Skill 的 Manifest
   */
  async loadManifest(skillPath: string): Promise<SkillManifest | null> {
    const manifestPath = join(skillPath, 'SKILL.md')

    try {
      const content = await readFile(manifestPath, 'utf-8')
      // SKILL.md 是 Markdown，解析其中的元数据
      // TODO: 实现真正的解析逻辑
      return null
    } catch {
      return null
    }
  }
}
