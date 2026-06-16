import { describe, expect, test } from 'bun:test'
import type { AgentCatalogProfile } from './types'
import { dailySkillUsageForProfile, usageSourceKeyForAgent } from './skillUsageHelpers'

const baseSkill = {
  slug: '',
  description: '',
  content: '',
  location: '',
  sourceDirectory: '',
  sourcePath: '',
  sourceLabel: '',
  sourceIcon: null,
  agentId: 'codex',
  agentName: 'Codex',
  agentIcon: null,
  metadata: {},
  contentHash: '',
  relativePath: '',
  fileName: 'SKILL.md',
  resolvedSourceDirectory: '',
  frontmatter: {},
  body: '',
}

describe('usageSourceKeyForAgent', () => {
  test('maps app profile ids to transcript source ids', () => {
    expect(usageSourceKeyForAgent('claude')).toBe('claude-code')
    expect(usageSourceKeyForAgent('craft_agents')).toBe('craft-agents')
    expect(usageSourceKeyForAgent('codex')).toBe('codex')
  })
})

describe('dailySkillUsageForProfile', () => {
  test('builds daily bars for skills in the selected app profile only', () => {
    const codexSkill = {
      ...baseSkill,
      id: 'codex-dws',
      name: 'dws',
      skillDirectory: '/skills/dws',
      resolvedSkillDirectory: '/skills/dws',
    }
    const otherSkill = {
      ...baseSkill,
      id: 'codex-other',
      name: 'other',
      skillDirectory: '/skills/other',
      resolvedSkillDirectory: '/skills/other',
    }
    const profile: AgentCatalogProfile = {
      agentId: 'codex',
      agentIcon: null,
      agentName: 'Codex',
      provider: {
        provider: 'codex',
        supportsCatalog: true,
        supportsDescription: true,
        supportsWhenToUse: true,
        supportsDisableModelInvocation: true,
        implicitInvocationField: null,
        supportsUserInvocable: true,
        supportsPaths: false,
        supportLevel: 'native',
        evidence: 'observed',
      },
      skills: [
        {
          id: codexSkill.id,
          name: codexSkill.name,
          sourcePath: codexSkill.skillDirectory,
          catalogDisclosure: 'included',
          modelInvocation: 'enabled',
          userInvocation: 'unknown',
          residentCatalogTokens: 1,
          includedInEstimate: true,
          sourceField: null,
          filteredReason: null,
          confidence: 'high',
        },
      ],
      lastCheckedAt: '2026-06-14T00:00:00Z',
      includedSkillCount: 1,
      disabledSkillCount: 0,
      invalidSkillCount: 0,
      unsupportedSkillCount: 0,
      unconfirmedSkillCount: 0,
      includedTokenEstimate: 1,
      confirmedTokenEstimate: 1,
      disabledTokenEstimate: 0,
      invalidTokenEstimate: 0,
      unconfirmedTokenEstimate: 0,
      topSkills: [],
    }

    const bars = dailySkillUsageForProfile(
      profile,
      new Map([
        [codexSkill.id, codexSkill],
        [otherSkill.id, otherSkill],
      ]),
      {
        version: 1,
        countsBySkillMdPath: {},
        countsBySkillMdPathBySource: {},
        countsByDayBySource: {
          codex: {
            '2026-06-13': {
              '/skills/dws/SKILL.md': 2,
              '/skills/other/SKILL.md': 5,
            },
            '2026-06-14': {
              '/skills/dws/SKILL.md': 3,
            },
          },
        },
        lastScanAt: '2026-06-14T00:00:00Z',
        scanNote: null,
      }
    )

    expect(bars).toEqual([
      {
        date: '2026-06-13',
        total: 2,
        segments: [{ skillId: 'codex-dws', skillName: 'dws', count: 2, colorIndex: 0 }],
      },
      {
        date: '2026-06-14',
        total: 3,
        segments: [{ skillId: 'codex-dws', skillName: 'dws', count: 3, colorIndex: 0 }],
      },
    ])
  })
})
