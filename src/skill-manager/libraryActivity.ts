import { type SkillGroup } from './types'

const ACTIVITY_STORAGE_KEY = 'skill-grove.libraryActivity.v1'
const MAX_RECENTLY_VIEWED = 24

export type LibraryActivityState = {
  pinnedSkillIds: string[]
  recentlyViewedSkillIds: string[]
}

function safeParseActivity(value: string | null): LibraryActivityState {
  if (!value) {
    return {
      pinnedSkillIds: [],
      recentlyViewedSkillIds: [],
    }
  }

  try {
    const parsed = JSON.parse(value) as Partial<LibraryActivityState>
    return {
      pinnedSkillIds: Array.isArray(parsed.pinnedSkillIds)
        ? parsed.pinnedSkillIds.filter((id): id is string => typeof id === 'string')
        : [],
      recentlyViewedSkillIds: Array.isArray(parsed.recentlyViewedSkillIds)
        ? parsed.recentlyViewedSkillIds.filter((id): id is string => typeof id === 'string')
        : [],
    }
  } catch {
    return {
      pinnedSkillIds: [],
      recentlyViewedSkillIds: [],
    }
  }
}

export function readLibraryActivity() {
  if (typeof window === 'undefined') {
    return safeParseActivity(null)
  }

  return safeParseActivity(localStorage.getItem(ACTIVITY_STORAGE_KEY))
}

export function writeLibraryActivity(activity: LibraryActivityState) {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(activity))
}

export function togglePinnedSkill(activity: LibraryActivityState, skillId: string) {
  const isPinned = activity.pinnedSkillIds.includes(skillId)
  return {
    ...activity,
    pinnedSkillIds: isPinned
      ? activity.pinnedSkillIds.filter((id) => id !== skillId)
      : [skillId, ...activity.pinnedSkillIds],
  }
}

export function recordRecentlyViewedSkill(activity: LibraryActivityState, skillId: string) {
  return {
    ...activity,
    recentlyViewedSkillIds: [
      skillId,
      ...activity.recentlyViewedSkillIds.filter((id) => id !== skillId),
    ].slice(0, MAX_RECENTLY_VIEWED),
  }
}

export function sortSkillGroupsByActivity(
  groups: SkillGroup[],
  activity: LibraryActivityState
) {
  const pinnedOrder = new Map(activity.pinnedSkillIds.map((id, index) => [id, index]))

  return [...groups].sort((left, right) => {
    const leftPinned = pinnedOrder.has(left.id)
    const rightPinned = pinnedOrder.has(right.id)
    if (leftPinned !== rightPinned) {
      return leftPinned ? -1 : 1
    }

    if (leftPinned && rightPinned) {
      return (pinnedOrder.get(left.id) ?? 0) - (pinnedOrder.get(right.id) ?? 0)
    }

    return 0
  })
}
