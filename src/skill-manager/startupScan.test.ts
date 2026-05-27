import { describe, expect, test } from 'bun:test'
import { resolvedSkillDirectoriesForStartupScan } from './startupScan'
import { type Skill } from './types'

function skill(resolvedSkillDirectory: string): Skill {
  return {
    id: resolvedSkillDirectory,
    slug: 'planner',
    name: 'planner',
    description: 'Plans focused implementation steps.',
    content: '',
    location: 'planner/SKILL.md',
    sourceDirectory: '/Users/alice/.codex/skills',
    skillDirectory: resolvedSkillDirectory,
    resolvedSourceDirectory: '/Users/alice/.codex/skills',
    resolvedSkillDirectory,
    contentHash: 'abc123',
    agentId: 'codex',
    agentName: 'Codex',
    agentIcon: null,
    metadata: {},
  } as Skill
}

describe('resolvedSkillDirectoriesForStartupScan', () => {
  test('returns unique resolved skill directories in first-seen order', () => {
    expect(
      resolvedSkillDirectoriesForStartupScan([
        skill('/Users/alice/.codex/skills/planner'),
        skill('/Users/alice/.claude/skills/writer'),
        skill('/Users/alice/.codex/skills/planner'),
      ])
    ).toEqual([
      '/Users/alice/.codex/skills/planner',
      '/Users/alice/.claude/skills/writer',
    ])
  })
})
