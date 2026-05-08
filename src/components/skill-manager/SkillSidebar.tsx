import { useAppPreferences } from '../../skill-manager/preferences'
import { type SkillGroup } from '../../skill-manager/types'
import { SettingsEntry } from './SettingsEntry'

export function SkillSidebar({
  filteredSkillGroups,
  skillGroups,
  multiSourceGroupCount,
  hasPendingUpdate,
  selectedGroupId,
  selectedPanel,
  skillSearchQuery,
  onSearchChange,
  onSelectAgentSkillConfig,
  onSelectSettings,
  onSelectSkillGroup,
}: {
  filteredSkillGroups: SkillGroup[]
  skillGroups: SkillGroup[]
  multiSourceGroupCount: number
  hasPendingUpdate: boolean
  selectedGroupId: string | null
  selectedPanel: 'skill' | 'agent-skill-config' | 'settings'
  skillSearchQuery: string
  onSearchChange: (query: string) => void
  onSelectAgentSkillConfig: () => void
  onSelectSettings: () => void
  onSelectSkillGroup: (group: SkillGroup) => void
}) {
  const { t } = useAppPreferences()

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
        <input
          className="mt-3 h-8 w-full rounded-[8px] border border-border/50 bg-[var(--surface-muted)] px-3 text-[12px] text-foreground outline-none placeholder:text-foreground/35 focus:border-foreground/18"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t('app.searchPlaceholder')}
          type="search"
          value={skillSearchQuery}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {skillGroups.length === 0 ? (
          <div className="px-4 py-6 text-[12px] text-foreground/56">{t('app.emptySkills')}</div>
        ) : filteredSkillGroups.length === 0 ? (
          <div className="px-4 py-6 text-[12px] text-foreground/56">{t('app.emptySearch')}</div>
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
