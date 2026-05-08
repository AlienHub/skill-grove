import { type TranslationKey } from './i18n'
import { type LibraryChange, type LibraryFilter, type LibraryVisitState } from './types'

export const libraryFilters: LibraryFilter[] = ['all', 'multi-source', 'variants', 'recent', 'worth']

export const changeMessageKeys: Record<LibraryChange['type'], TranslationKey> = {
  'skill-added': 'changes.skillAdded',
  'skill-removed': 'changes.skillRemoved',
  'content-changed': 'changes.contentChanged',
  'source-added': 'changes.sourceAdded',
  'source-removed': 'changes.sourceRemoved',
  'variant-count-changed': 'changes.variantCountChanged',
  'symlink-state-changed': 'changes.symlinkStateChanged',
}

export function filterLabelKey(filter: LibraryFilter) {
  return `library.filter.${filter}` as TranslationKey
}

export function filterShortLabelKey(filter: LibraryFilter) {
  return `library.filterShort.${filter}` as TranslationKey
}

export function libraryStatusKey(visitState: LibraryVisitState) {
  if (!visitState.hasPreviousSnapshot) {
    return 'library.statusFirstVisit' as const
  }

  if (visitState.changes.length > 0) {
    return visitState.changes.length === 1 ? 'library.statusChangedOne' : 'library.statusChanged'
  }

  if (visitState.suggestions.length > 0) {
    return visitState.suggestions.length === 1 ? 'library.statusWorthOne' : 'library.statusWorth'
  }

  return 'library.statusClean' as const
}

export function changeParams(change: LibraryChange) {
  return {
    skillName: change.skillName,
    agentName: change.agentName ?? '',
    previousCount: change.previousCount ?? 0,
    currentCount: change.currentCount ?? 0,
  }
}
