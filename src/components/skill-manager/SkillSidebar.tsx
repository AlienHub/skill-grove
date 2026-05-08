import { useMemo, useState } from 'react'
import { useAppPreferences } from '../../skill-manager/preferences'
import { type LibraryFilter, type LibraryVisitState, type SkillGroup } from '../../skill-manager/types'
import { groupMatchesLibraryFilter } from '../../skill-manager/libraryInsights'
import { filterLabelKey, filterShortLabelKey, libraryFilters } from '../../skill-manager/libraryPresentation'
import { SettingsEntry } from './SettingsEntry'

export function SkillSidebar({
  activeFilter,
  filteredSkillGroups,
  skillGroups,
  multiSourceGroupCount,
  hasPendingUpdate,
  visitState,
  selectedGroupId,
  selectedPanel,
  skillSearchQuery,
  onFilterChange,
  onSearchChange,
  onSelectHome,
  onSelectAgentSkillConfig,
  onSelectSettings,
  onSelectSkillGroup,
}: {
  activeFilter: LibraryFilter
  filteredSkillGroups: SkillGroup[]
  skillGroups: SkillGroup[]
  multiSourceGroupCount: number
  hasPendingUpdate: boolean
  visitState: LibraryVisitState
  selectedGroupId: string | null
  selectedPanel: 'home' | 'skill' | 'agent-skill-config' | 'settings'
  skillSearchQuery: string
  onFilterChange: (filter: LibraryFilter) => void
  onSearchChange: (query: string) => void
  onSelectHome: () => void
  onSelectAgentSkillConfig: () => void
  onSelectSettings: () => void
  onSelectSkillGroup: (group: SkillGroup) => void
}) {
  const { t } = useAppPreferences()
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const filterCounts = useMemo(
    () =>
      libraryFilters.reduce<Record<LibraryFilter, number>>((counts, filter) => {
        counts[filter] =
          filter === 'all'
            ? skillGroups.length
            : skillGroups.filter((group) => groupMatchesLibraryFilter(group, filter, visitState)).length
        return counts
      }, {} as Record<LibraryFilter, number>),
    [skillGroups, visitState]
  )
  const activeFilterLabel = activeFilter === 'all' ? null : t(filterShortLabelKey(activeFilter), {
    count: filterCounts[activeFilter],
  })

  const handleFilterSelect = (filter: LibraryFilter) => {
    onFilterChange(activeFilter === filter ? 'all' : filter)
    setIsFilterOpen(false)
  }

  return (
    <aside className="flex h-full flex-col overflow-hidden rounded-[8px] bg-[var(--surface)] shadow-minimal">
      <div className="border-b border-border/50 px-4 py-4">
        <div className="flex items-end justify-between gap-3">
          <h1 className="text-[14px] font-semibold text-foreground">{t('app.library')}</h1>
          <span className="text-[12px] text-foreground/45">
            {filteredSkillGroups.length === skillGroups.length
              ? t('app.count', { count: skillGroups.length })
              : t('app.filteredCount', {
                  filtered: filteredSkillGroups.length,
                  total: skillGroups.length,
                })}
          </span>
        </div>
        {multiSourceGroupCount > 0 ? (
          <p className="mt-1 text-[11px] text-foreground/40">
            {t('app.multiSourceCount', { count: multiSourceGroupCount })}
          </p>
        ) : null}
        <div className="relative mt-3 flex gap-1.5">
          <input
            className="h-8 min-w-0 flex-1 rounded-[8px] border border-border/50 bg-[var(--surface-muted)] px-3 text-[12px] text-foreground outline-none placeholder:text-foreground/35 focus:border-foreground/18"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t('app.searchPlaceholder')}
            type="search"
            value={skillSearchQuery}
          />
          <button
            aria-label={t('library.filterButton')}
            className={`relative flex size-8 shrink-0 items-center justify-center rounded-[8px] border border-border/50 transition-colors ${
              activeFilter === 'all'
                ? 'bg-[var(--surface-muted)] text-foreground/48 hover:text-foreground'
                : 'bg-foreground text-background'
            }`}
            onClick={() => setIsFilterOpen((isOpen) => !isOpen)}
            title={t('library.filterButton')}
            type="button"
          >
            <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
              <path
                d="M4.75 6.25h14.5l-5.5 6.35v4.65l-3.5 1.75V12.6L4.75 6.25Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
            {activeFilterLabel ? (
              <span className="absolute -right-1 -top-1 size-2 rounded-full bg-accent" />
            ) : null}
          </button>
          {isFilterOpen ? (
            <div className="absolute right-0 top-9 z-dropdown w-[210px] rounded-[8px] border border-border/50 bg-[var(--surface)] p-1.5 shadow-modal-small">
              <div className="px-2 py-1.5 text-[11px] font-medium text-foreground/42">
                {activeFilterLabel ?? t('library.filterAllActive')}
              </div>
              {libraryFilters.map((filter) => {
                const isChecked = activeFilter === filter
                return (
                  <button
                    className="flex w-full items-center gap-2 rounded-[6px] px-2 py-2 text-left text-[12px] text-foreground/64 transition-colors hover:bg-[var(--surface-muted)] hover:text-foreground"
                    key={filter}
                    onClick={() => handleFilterSelect(filter)}
                    type="button"
                  >
                    <span
                      className={`flex size-4 shrink-0 items-center justify-center rounded-[4px] border ${
                        isChecked
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border bg-[var(--surface)]'
                      }`}
                    >
                      {isChecked ? (
                        <svg aria-hidden="true" className="size-3" fill="none" viewBox="0 0 24 24">
                          <path
                            d="m5 12.5 4.2 4.2L19 6.8"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.2"
                          />
                        </svg>
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">{t(filterLabelKey(filter), { count: filterCounts[filter] })}</span>
                  </button>
                )
              })}
            </div>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {skillGroups.length === 0 ? (
          <div className="px-4 py-6 text-[12px] text-foreground/56">{t('app.emptySkills')}</div>
        ) : filteredSkillGroups.length === 0 ? (
          <div className="px-4 py-6 text-[12px] text-foreground/56">
            {activeFilter === 'all' ? t('app.emptySearch') : t('library.emptyFilter')}
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {filteredSkillGroups.map((group) => {
              const isSelected = selectedPanel === 'skill' && group.id === selectedGroupId

              return (
                <li
                  className={`relative px-3 py-1.5 ${isSelected ? 'before:absolute before:inset-y-1.5 before:left-0 before:w-[2px] before:rounded-full before:bg-[#8d7cff]' : ''}`}
                  key={group.id}
                >
                  <button
                    className="relative w-full cursor-pointer text-left"
                    onClick={() => onSelectSkillGroup(group)}
                    type="button"
                  >
                    <div
                      className={`rounded-[8px] px-4 py-3 transition-colors ${
                        isSelected
                          ? 'bg-[color-mix(in_srgb,var(--foreground)_3%,var(--background))]'
                          : 'bg-transparent hover:bg-[color-mix(in_srgb,var(--foreground)_1.5%,var(--background))]'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-2">
                          <h2 className="min-w-0 flex-1 truncate text-[14px] font-semibold text-foreground">
                            {group.name}
                          </h2>
                          {group.variantCount > 1 ? (
                            <span className="shrink-0 rounded-full bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface))] px-2 py-0.5 text-[10px] font-medium text-accent">
                              {t('app.variantBadge', { count: group.variantCount })}
                            </span>
                          ) : group.sourceCount > 1 ? (
                            <span className="shrink-0 rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-medium text-foreground/48">
                              {t('app.sourceBadge', { count: group.sourceCount })}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 truncate text-[12px] text-foreground/52">
                          {group.description || '—'}
                        </p>
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="p-3 pt-2">
        <div className="space-y-1">
          <SettingsEntry
            icon="home"
            isSelected={selectedPanel === 'home'}
            label={t('app.home')}
            onClick={onSelectHome}
          />
          <SettingsEntry
            icon="agent-skill"
            isSelected={selectedPanel === 'agent-skill-config'}
            label={t('app.agentSkillConfig')}
            onClick={onSelectAgentSkillConfig}
          />
          <SettingsEntry
            badge={hasPendingUpdate ? t('updates.restartBadge') : undefined}
            isSelected={selectedPanel === 'settings'}
            label={t('app.settings')}
            onClick={onSelectSettings}
          />
        </div>
      </div>
    </aside>
  )
}
