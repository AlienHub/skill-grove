import {
  type LibraryChange,
  type LibraryFilter,
  type LibraryVisitState,
  type Skill,
  type SkillGroup,
  type SkillSuggestion,
} from './types'
import { isRealSkillSource } from './skillGrouping'

const SNAPSHOT_STORAGE_KEY = 'skill-grove.librarySnapshot.v1'
const SESSION_INSIGHTS_KEY = 'skill-grove.libraryVisitInsights.v1'
const SNAPSHOT_SCHEMA_VERSION = 1
const LONG_INSTRUCTIONS_CHARACTER_COUNT = 12000

type SnapshotSource = {
  skillDirectory: string
  sourceDirectory: string
  agentId: string
  agentName: string
  contentHash: string
  resolvedSkillDirectory: string
  isSymlink: boolean
}

type SnapshotSkill = {
  id: string
  name: string
  description: string
  variantHashes: string[]
  sources: SnapshotSource[]
}

type LibrarySnapshot = {
  schemaVersion: number
  capturedAt: string
  fingerprint: string
  skills: SnapshotSkill[]
}

type StoredSessionInsights = {
  fingerprint: string
  capturedAt: string
  previousCapturedAt: string | null
  hasPreviousSnapshot: boolean
  changes: LibraryChange[]
}

function safeParseJson<T>(value: string | null): T | null {
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function byValue(left: string, right: string) {
  return left.localeCompare(right, 'zh-CN')
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort(byValue)
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }

  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([leftKey], [rightKey]) => byValue(leftKey, rightKey))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(',')}}`
  }

  return JSON.stringify(value)
}

function stableHash(value: string) {
  let hash = 0x811c9dc5

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }

  return (hash >>> 0).toString(16).padStart(8, '0')
}

function sourceSnapshot(skill: Skill): SnapshotSource {
  return {
    skillDirectory: skill.skillDirectory,
    sourceDirectory: skill.sourceDirectory,
    agentId: skill.agentId,
    agentName: skill.agentName,
    contentHash: skill.contentHash,
    resolvedSkillDirectory: skill.resolvedSkillDirectory,
    isSymlink: !isRealSkillSource(skill),
  }
}

export function buildLibrarySnapshot(skillGroups: SkillGroup[]): LibrarySnapshot {
  const capturedAt = new Date().toISOString()
  const skills = skillGroups
    .map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      variantHashes: uniqueSorted(group.variants.map((variant) => variant.primarySkill.contentHash)),
      sources: group.skills.map(sourceSnapshot).sort((left, right) => byValue(left.skillDirectory, right.skillDirectory)),
    }))
    .sort((left, right) => byValue(left.id, right.id))
  const fingerprint = stableHash(
    stableStringify(
      skills.map((skill) => ({
        id: skill.id,
        description: skill.description,
        variantHashes: skill.variantHashes,
        sources: skill.sources,
      }))
    )
  )

  return {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    capturedAt,
    fingerprint,
    skills,
  }
}

function isLibrarySnapshot(value: unknown): value is LibrarySnapshot {
  const candidate = value as Partial<LibrarySnapshot> | null
  return Boolean(
    candidate &&
      candidate.schemaVersion === SNAPSHOT_SCHEMA_VERSION &&
      typeof candidate.capturedAt === 'string' &&
      typeof candidate.fingerprint === 'string' &&
      Array.isArray(candidate.skills)
  )
}

function sourceKey(source: SnapshotSource) {
  return source.skillDirectory
}

function sameStringSet(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false
  }

  return left.every((value, index) => value === right[index])
}

function buildChangeIndexes(changes: LibraryChange[]) {
  return changes.reduce<Record<string, LibraryChange[]>>((indexes, change) => {
    indexes[change.skillId] = [...(indexes[change.skillId] ?? []), change]
    return indexes
  }, {})
}

function buildSuggestionIndexes(suggestions: SkillSuggestion[]) {
  return suggestions.reduce<Record<string, SkillSuggestion[]>>((indexes, suggestion) => {
    indexes[suggestion.skillId] = [...(indexes[suggestion.skillId] ?? []), suggestion]
    return indexes
  }, {})
}

function diffSnapshots(previousSnapshot: LibrarySnapshot, currentSnapshot: LibrarySnapshot): LibraryChange[] {
  const changes: LibraryChange[] = []
  const previousSkills = new Map(previousSnapshot.skills.map((skill) => [skill.id, skill]))
  const currentSkills = new Map(currentSnapshot.skills.map((skill) => [skill.id, skill]))

  for (const currentSkill of currentSnapshot.skills) {
    const previousSkill = previousSkills.get(currentSkill.id)

    if (!previousSkill) {
      changes.push({
        type: 'skill-added',
        skillId: currentSkill.id,
        skillName: currentSkill.name,
      })
      continue
    }

    if (previousSkill.variantHashes.length !== currentSkill.variantHashes.length) {
      changes.push({
        type: 'variant-count-changed',
        skillId: currentSkill.id,
        skillName: currentSkill.name,
        previousCount: previousSkill.variantHashes.length,
        currentCount: currentSkill.variantHashes.length,
      })
    } else if (!sameStringSet(previousSkill.variantHashes, currentSkill.variantHashes)) {
      changes.push({
        type: 'content-changed',
        skillId: currentSkill.id,
        skillName: currentSkill.name,
      })
    }

    const previousSources = new Map(previousSkill.sources.map((source) => [sourceKey(source), source]))
    const currentSources = new Map(currentSkill.sources.map((source) => [sourceKey(source), source]))

    for (const currentSource of currentSkill.sources) {
      const previousSource = previousSources.get(sourceKey(currentSource))

      if (!previousSource) {
        changes.push({
          type: 'source-added',
          skillId: currentSkill.id,
          skillName: currentSkill.name,
          sourcePath: currentSource.skillDirectory,
          agentName: currentSource.agentName,
        })
        continue
      }

      if (
        previousSource.isSymlink !== currentSource.isSymlink ||
        previousSource.resolvedSkillDirectory !== currentSource.resolvedSkillDirectory
      ) {
        changes.push({
          type: 'symlink-state-changed',
          skillId: currentSkill.id,
          skillName: currentSkill.name,
          sourcePath: currentSource.skillDirectory,
          agentName: currentSource.agentName,
        })
      }
    }

    for (const previousSource of previousSkill.sources) {
      if (!currentSources.has(sourceKey(previousSource))) {
        changes.push({
          type: 'source-removed',
          skillId: currentSkill.id,
          skillName: currentSkill.name,
          sourcePath: previousSource.skillDirectory,
          agentName: previousSource.agentName,
        })
      }
    }
  }

  for (const previousSkill of previousSnapshot.skills) {
    if (!currentSkills.has(previousSkill.id)) {
      changes.push({
        type: 'skill-removed',
        skillId: previousSkill.id,
        skillName: previousSkill.name,
      })
    }
  }

  return changes
}

export function buildSkillSuggestions(skillGroups: SkillGroup[]): SkillSuggestion[] {
  return skillGroups
    .flatMap((group) => {
      const suggestions: SkillSuggestion[] = []

      if (group.variantCount > 1) {
        suggestions.push({
          type: 'multiple-variants',
          skillId: group.id,
          skillName: group.name,
          severity: 3,
          messageKey: 'suggestions.multipleVariants',
          actionKey: 'suggestions.reviewSources',
          params: { count: group.variantCount },
        })

        suggestions.push({
          type: 'content-inconsistent',
          skillId: group.id,
          skillName: group.name,
          severity: 2,
          messageKey: 'suggestions.contentInconsistent',
          actionKey: 'suggestions.reviewSources',
        })
      }

      if (!group.description.trim()) {
        suggestions.push({
          type: 'missing-description',
          skillId: group.id,
          skillName: group.name,
          severity: 2,
          messageKey: 'suggestions.missingDescription',
          actionKey: 'suggestions.reviewMetadata',
        })
      }

      const longestSkill = [...group.skills].sort((left, right) => right.content.length - left.content.length)[0]
      if (longestSkill && longestSkill.content.length > LONG_INSTRUCTIONS_CHARACTER_COUNT) {
        suggestions.push({
          type: 'long-instructions',
          skillId: group.id,
          skillName: group.name,
          sourcePath: longestSkill.skillDirectory,
          severity: 1,
          messageKey: 'suggestions.longInstructions',
          actionKey: 'suggestions.reviewInstructions',
          params: { count: Math.round(longestSkill.content.length / 1000) },
        })
      }

      if (group.skills.some((skill) => skill.agentId === 'unknown')) {
        suggestions.push({
          type: 'custom-source',
          skillId: group.id,
          skillName: group.name,
          severity: 1,
          messageKey: 'suggestions.customSource',
          actionKey: 'suggestions.reviewSources',
        })
      }

      return suggestions
    })
    .sort((left, right) => {
      if (left.severity !== right.severity) {
        return right.severity - left.severity
      }

      return byValue(left.skillName, right.skillName)
    })
}

function emptyVisitState(currentSnapshot: LibrarySnapshot | null, suggestions: SkillSuggestion[]): LibraryVisitState {
  return {
    capturedAt: currentSnapshot?.capturedAt ?? null,
    previousCapturedAt: null,
    hasPreviousSnapshot: false,
    changes: [],
    changesBySkillId: {},
    suggestions,
    suggestionsBySkillId: buildSuggestionIndexes(suggestions),
  }
}

function visitStateFromChanges({
  currentSnapshot,
  previousCapturedAt,
  hasPreviousSnapshot,
  changes,
  suggestions,
}: {
  currentSnapshot: LibrarySnapshot
  previousCapturedAt: string | null
  hasPreviousSnapshot: boolean
  changes: LibraryChange[]
  suggestions: SkillSuggestion[]
}): LibraryVisitState {
  return {
    capturedAt: currentSnapshot.capturedAt,
    previousCapturedAt,
    hasPreviousSnapshot,
    changes,
    changesBySkillId: buildChangeIndexes(changes),
    suggestions,
    suggestionsBySkillId: buildSuggestionIndexes(suggestions),
  }
}

export function readAndStoreLibraryVisitState(skillGroups: SkillGroup[]): LibraryVisitState {
  const currentSnapshot = buildLibrarySnapshot(skillGroups)
  const suggestions = buildSkillSuggestions(skillGroups)

  if (typeof window === 'undefined') {
    return emptyVisitState(currentSnapshot, suggestions)
  }

  const sessionInsights = safeParseJson<StoredSessionInsights>(sessionStorage.getItem(SESSION_INSIGHTS_KEY))
  if (sessionInsights?.fingerprint === currentSnapshot.fingerprint) {
    return visitStateFromChanges({
      currentSnapshot,
      previousCapturedAt: sessionInsights.previousCapturedAt,
      hasPreviousSnapshot: sessionInsights.hasPreviousSnapshot,
      changes: sessionInsights.changes,
      suggestions,
    })
  }

  const previousSnapshot = safeParseJson<LibrarySnapshot>(localStorage.getItem(SNAPSHOT_STORAGE_KEY))
  if (!isLibrarySnapshot(previousSnapshot)) {
    localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(currentSnapshot))
    sessionStorage.setItem(
      SESSION_INSIGHTS_KEY,
      JSON.stringify({
        fingerprint: currentSnapshot.fingerprint,
        capturedAt: currentSnapshot.capturedAt,
        previousCapturedAt: null,
        hasPreviousSnapshot: false,
        changes: [],
      } satisfies StoredSessionInsights)
    )
    return emptyVisitState(currentSnapshot, suggestions)
  }

  const changes =
    previousSnapshot.fingerprint === currentSnapshot.fingerprint
      ? []
      : diffSnapshots(previousSnapshot, currentSnapshot)

  localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(currentSnapshot))
  sessionStorage.setItem(
    SESSION_INSIGHTS_KEY,
    JSON.stringify({
      fingerprint: currentSnapshot.fingerprint,
      capturedAt: currentSnapshot.capturedAt,
      previousCapturedAt: previousSnapshot.capturedAt,
      hasPreviousSnapshot: true,
      changes,
    } satisfies StoredSessionInsights)
  )

  return visitStateFromChanges({
    currentSnapshot,
    previousCapturedAt: previousSnapshot.capturedAt,
    hasPreviousSnapshot: true,
    changes,
    suggestions,
  })
}

export function groupMatchesLibraryFilter(
  group: SkillGroup,
  filter: LibraryFilter,
  visitState: LibraryVisitState
) {
  if (filter === 'multi-source') {
    return group.sourceCount > 1
  }

  if (filter === 'variants') {
    return group.variantCount > 1
  }

  if (filter === 'recent') {
    return Boolean(visitState.changesBySkillId[group.id]?.length)
  }

  if (filter === 'worth') {
    return Boolean(visitState.suggestionsBySkillId[group.id]?.length)
  }

  return true
}
