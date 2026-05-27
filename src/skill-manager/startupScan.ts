import { type Skill } from './types'

export function resolvedSkillDirectoriesForStartupScan(skills: Skill[]) {
  return [...new Set(skills.map((skill) => skill.resolvedSkillDirectory).filter(Boolean))]
}
