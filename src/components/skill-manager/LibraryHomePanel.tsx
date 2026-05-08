import { type TranslationKey } from '../../skill-manager/i18n'
import { useAppPreferences } from '../../skill-manager/preferences'
import {
  changeMessageKeys,
  changeParams,
} from '../../skill-manager/libraryPresentation'
import { type LibraryVisitState, type SkillGroup } from '../../skill-manager/types'

function formatDate(value: string | null) {
  if (!value) {
    return null
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return null
  }
}

export function LibraryHomePanel({
  skillGroups,
  visitState,
  onOpenAgentSkillConfig,
  onOpenSettings,
  onSelectSkillGroup,
}: {
  skillGroups: SkillGroup[]
  visitState: LibraryVisitState
  onOpenAgentSkillConfig: () => void
  onOpenSettings: () => void
  onSelectSkillGroup: (group: SkillGroup) => void
}) {
  const { t } = useAppPreferences()
  const previousDate = formatDate(visitState.previousCapturedAt)
  const capturedDate = formatDate(visitState.capturedAt)
  const groupsById = new Map(skillGroups.map((group) => [group.id, group]))
  const visibleChanges = visitState.changes.slice(0, 12)
  const firstSkillGroup = skillGroups[0] ?? null
  const homeStatusKey = !visitState.hasPreviousSnapshot
    ? 'library.statusFirstVisit'
    : visitState.changes.length === 1
      ? 'library.statusChangedOne'
      : visitState.changes.length > 1
        ? 'library.statusChanged'
        : 'library.statusClean'

  return (
    <section className="h-full overflow-y-auto rounded-[8px] bg-[color-mix(in_srgb,var(--foreground)_1.5%,var(--background))] p-6 shadow-minimal">
      <div className="mb-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-[760px]">
            <p className="text-[12px] text-foreground/52">{t('home.eyebrow')}</p>
            <h2 className="mt-5 text-[22px] font-semibold leading-tight text-foreground">{t('home.title')}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-[8px] bg-foreground px-3 py-2 text-[12px] font-medium text-background transition-opacity hover:opacity-88 disabled:cursor-not-allowed disabled:opacity-45"
              disabled={!firstSkillGroup}
              onClick={() => firstSkillGroup && onSelectSkillGroup(firstSkillGroup)}
              type="button"
            >
              {t('home.openLibrary')}
            </button>
            <button
              className="rounded-[8px] bg-[var(--surface)] px-3 py-2 text-[12px] font-medium text-foreground/64 shadow-minimal-flat transition-colors hover:text-foreground"
              onClick={onOpenAgentSkillConfig}
              type="button"
            >
              {t('app.agentSkillConfig')}
            </button>
            <button
              className="rounded-[8px] bg-[var(--surface)] px-3 py-2 text-[12px] font-medium text-foreground/64 shadow-minimal-flat transition-colors hover:text-foreground"
              onClick={onOpenSettings}
              type="button"
            >
              {t('app.settings')}
            </button>
          </div>
        </div>
        <div className="mt-5 max-w-[760px]">
          <p className="mt-3 text-[14px] leading-7 text-foreground/58">
            {t(homeStatusKey, { count: visitState.changes.length })}
          </p>
          <p className="mt-2 text-[12px] text-foreground/38">
            {previousDate ? t('home.comparedSince', { date: previousDate }) : t('home.snapshotHint')}
            {capturedDate ? ` · ${t('home.updatedAt', { date: capturedDate })}` : ''}
          </p>
        </div>

        <div className="mt-6 grid gap-8 sm:grid-cols-2">
          <div>
            <p className="text-[11px] text-foreground/40">{t('home.totalSkills')}</p>
            <p className="mt-1 text-[20px] font-semibold text-foreground">{skillGroups.length}</p>
          </div>
          <div>
            <p className="text-[11px] text-foreground/40">{t('home.recentChanges')}</p>
            <p className="mt-1 text-[20px] font-semibold text-foreground">{visitState.changes.length}</p>
          </div>
        </div>
      </div>

      <div>
        <section className="rounded-[8px] border border-border/50 bg-[var(--surface)] p-4 shadow-minimal-flat">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-[14px] font-semibold text-foreground">{t('home.changeSection')}</h3>
            <span className="text-[11px] text-foreground/38">{visitState.changes.length}</span>
          </div>
          {visibleChanges.length ? (
            <div className="space-y-1">
              {visibleChanges.map((change, index) => {
                const group = groupsById.get(change.skillId)
                return (
                  <button
                    className="w-full rounded-[8px] px-3 py-2 text-left transition-colors hover:bg-[var(--surface-muted)]"
                    disabled={!group}
                    key={`${change.type}-${change.skillId}-${change.sourcePath ?? index}`}
                    onClick={() => group && onSelectSkillGroup(group)}
                    type="button"
                  >
                    <div className="flex min-w-0 items-center justify-between gap-3">
                      <p className="truncate text-[13px] font-medium text-foreground">{change.skillName}</p>
                      <span className="shrink-0 text-[10px] text-foreground/36">
                        {t(`changes.type.${change.type}` as TranslationKey)}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] leading-5 text-foreground/52">
                      {t(changeMessageKeys[change.type], changeParams(change))}
                    </p>
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="rounded-[8px] bg-[var(--surface-muted)] px-3 py-3 text-[12px] text-foreground/52">
              {t('home.emptyChanges')}
            </p>
          )}
        </section>
      </div>
    </section>
  )
}
