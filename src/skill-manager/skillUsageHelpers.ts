import type { AgentCatalogProfile, Skill, SkillGroup, SkillUsageSnapshot } from './types'

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

export type DailySkillUsageSegment = {
  skillId: string
  skillName: string
  count: number
  colorIndex: number
}

export type DailySkillUsageBar = {
  date: string
  total: number
  segments: DailySkillUsageSegment[]
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
  const craftAgentsCounts = countsBySkillMdPathBySource['craft-agents'] ?? {}

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
    {
      agentId: 'craft_agents',
      agentName: 'Craft Agents',
      count: usageCountForGroup(group, craftAgentsCounts),
    },
  ]
}

export function usageSourceKeyForAgent(agentId: string) {
  if (agentId === 'claude') {
    return 'claude-code'
  }

  if (agentId === 'craft_agents') {
    return 'craft-agents'
  }

  return agentId
}

export function dailySkillUsageForProfile(
  profile: AgentCatalogProfile,
  skillsById: Map<string, Skill>,
  skillUsage: SkillUsageSnapshot,
  dayLimit = 14,
  segmentLimit = 6,
): DailySkillUsageBar[] {
  const sourceKey = usageSourceKeyForAgent(profile.agentId)
  const dailyCounts = skillUsage.countsByDayBySource?.[sourceKey] ?? {}
  const trackedSkills = profile.skills
    .map((profileSkill) => skillsById.get(profileSkill.id))
    .filter((skill): skill is Skill => Boolean(skill))
  const colorIndexesBySkillId = new Map<string, number>()

  return Object.entries(dailyCounts)
    .map(([date, counts]) => {
      const rawSegments = trackedSkills
        .map((skill) => ({
          skillId: skill.id,
          skillName: skill.name || skill.slug || skill.location,
          count: usageCountForSkill(counts, skill),
          colorIndex: 0,
        }))
        .filter((segment) => segment.count > 0)
        .sort((left, right) => {
          if (left.count !== right.count) {
            return right.count - left.count
          }

          return left.skillName.localeCompare(right.skillName, 'zh-CN')
        })

      const visibleSegments = rawSegments.slice(0, segmentLimit)
      const otherCount = rawSegments
        .slice(segmentLimit)
        .reduce((sum, segment) => sum + segment.count, 0)
      const segments = otherCount > 0
        ? [
            ...visibleSegments,
            {
              skillId: `other-${date}`,
              skillName: 'Other',
              count: otherCount,
              colorIndex: 0,
            },
          ]
        : visibleSegments

      for (const segment of segments) {
        if (!colorIndexesBySkillId.has(segment.skillId)) {
          colorIndexesBySkillId.set(segment.skillId, colorIndexesBySkillId.size)
        }
        segment.colorIndex = colorIndexesBySkillId.get(segment.skillId) ?? 0
      }

      return {
        date,
        total: segments.reduce((sum, segment) => sum + segment.count, 0),
        segments,
      }
    })
    .filter((day) => day.total > 0)
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-dayLimit)
}
