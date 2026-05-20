import type { Skill, SkillGroup } from './types'

function normalizeFsPath(p: string): string {
  return p.replace(/\\/g, '/').replace(/\/+$/, '')
}

export function skillMdPathForLookup(skill: Skill): string {
  return `${normalizeFsPath(skill.resolvedSkillDirectory)}/SKILL.md`
}

/**
 * Map persisted usage counts to this skill variant only.
 * Must NOT use a loose `endsWith(location/SKILL.md)` match — all sources in a group share the same
 * `location` slug, so that would pick the same arbitrary `counts` entry for every agent (fake ties).
 */
export function usageCountForSkill(counts: Record<string, number>, skill: Skill): number {
  const resolved = normalizeFsPath(skill.resolvedSkillDirectory)
  const primary = `${resolved}/SKILL.md`

  const tryExact = (key: string): number | undefined => {
    if (counts[key] != null) {
      return counts[key]
    }
    const lower = key.toLowerCase()
    for (const [k, val] of Object.entries(counts)) {
      if (k.toLowerCase() === lower) {
        return val
      }
    }
    return undefined
  }

  const direct = tryExact(primary)
  if (direct != null) {
    return direct
  }

  for (const [k, val] of Object.entries(counts)) {
    const kn = normalizeFsPath(k)
    const idx = kn.toLowerCase().lastIndexOf('/skill.md')
    if (idx <= 0) {
      continue
    }
    const parent = kn.slice(0, idx).replace(/\/+$/, '')
    if (parent === resolved) {
      return val
    }
  }

  const skillDir = normalizeFsPath(skill.skillDirectory)
  if (skillDir !== resolved) {
    const second = `${skillDir}/SKILL.md`
    const v2 = tryExact(second)
    if (v2 != null) {
      return v2
    }
    for (const [k, val] of Object.entries(counts)) {
      const kn = normalizeFsPath(k)
      const idx = kn.toLowerCase().lastIndexOf('/skill.md')
      if (idx <= 0) {
        continue
      }
      const parent = kn.slice(0, idx).replace(/\/+$/, '')
      if (parent === skillDir) {
        return val
      }
    }
  }

  return 0
}

export type SkillUsageAgentRow = {
  agentId: string
  agentName: string
  count: number
}

function usageCountForGroup(
  group: SkillGroup,
  countsBySkillMdPath: Record<string, number>,
): number {
  const seen = new Set<string>()
  let count = 0

  for (const skill of group.skills) {
    const lookupPath = skillMdPathForLookup(skill)
    const dedupeKey = lookupPath.toLowerCase()
    if (seen.has(dedupeKey)) {
      continue
    }
    seen.add(dedupeKey)
    count += usageCountForSkill(countsBySkillMdPath, skill)
  }

  return count
}

export function usageByAgentForGroup(
  group: SkillGroup,
  countsBySkillMdPathBySource: Record<string, Record<string, number>>,
  fallbackCountsBySkillMdPath: Record<string, number>,
): SkillUsageAgentRow[] {
  const claudeCounts = countsBySkillMdPathBySource['claude-code'] ?? fallbackCountsBySkillMdPath
  const codexCounts = countsBySkillMdPathBySource.codex ?? {}
  const openclawCounts = countsBySkillMdPathBySource.openclaw ?? {}

  return [
    {
      agentId: 'claude-code',
      agentName: 'Claude Code',
      count: usageCountForGroup(group, claudeCounts),
    },
    {
      agentId: 'codex',
      agentName: 'Codex',
      count: usageCountForGroup(group, codexCounts),
    },
    {
      agentId: 'openclaw',
      agentName: 'OpenClaw',
      count: usageCountForGroup(group, openclawCounts),
    },
  ]
}
