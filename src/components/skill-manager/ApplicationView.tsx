import { AgentIcon } from '../../skill-manager/agentInfo'
import { displayAgentName } from '../../skill-manager/display'
import { useAppPreferences } from '../../skill-manager/preferences'
import { type AgentCatalogProfile, type SkillGroup } from '../../skill-manager/types'

function formatTokenEstimate(tokens: number) {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`
  }

  return String(tokens)
}

function uniqueSourceCount(profile: AgentCatalogProfile) {
  return new Set(profile.skills.map((skill) => skill.sourcePath)).size
}

export function ApplicationSidebar({
  hasTitlebarInset,
  profiles,
  selectedProfileId,
  onSelectProfile,
}: {
  hasTitlebarInset: boolean
  profiles: AgentCatalogProfile[]
  selectedProfileId: string | null
  onSelectProfile: (profile: AgentCatalogProfile) => void
}) {
  const { t } = useAppPreferences()

  return (
    <aside
      className={`m-2 mb-2 flex min-h-0 flex-col overflow-hidden rounded-[8px] bg-[var(--surface)] shadow-minimal ${
        hasTitlebarInset ? 'mt-10' : 'mt-2'
      }`}
    >
      <div className="border-b border-border/50 px-4 pb-4 pt-4">
        <div className="flex items-end justify-between gap-3">
          <h1 className="text-[14px] font-semibold text-foreground">{t('appView.title')}</h1>
          <span className="text-[12px] text-foreground/45">{t('appView.appCount', { count: profiles.length })}</span>
        </div>
        <p className="mt-1 text-[11px] text-foreground/40">{t('appView.sidebarHint')}</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {profiles.length === 0 ? (
          <div className="px-4 py-6 text-[12px] text-foreground/56">{t('appView.empty')}</div>
        ) : (
          <ul className="divide-y divide-border/50">
            {profiles.map((profile) => {
              const isSelected = profile.agentId === selectedProfileId
              const label = displayAgentName(profile.agentId, profile.agentName, t)
              const tokens = formatTokenEstimate(profile.includedTokenEstimate)

              return (
                <li
                  className={`relative px-2.5 py-1 ${isSelected ? 'before:absolute before:inset-y-1 before:left-0 before:w-[2px] before:rounded-full before:bg-[#8d7cff]' : ''}`}
                  key={profile.agentId}
                >
                  <button className="relative w-full cursor-pointer text-left" onClick={() => onSelectProfile(profile)} type="button">
                    <div
                      className={`rounded-[8px] px-3 py-2.5 transition-colors ${
                        isSelected
                          ? 'bg-[color-mix(in_srgb,var(--foreground)_3%,var(--background))]'
                          : 'bg-transparent hover:bg-[color-mix(in_srgb,var(--foreground)_1.5%,var(--background))]'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <AgentIcon
                          agentIcon={profile.agentIcon}
                          agentId={profile.agentId}
                          agentName={profile.agentName}
                          size={16}
                        />
                        <div className="min-w-0 flex-1">
                          <h2 className="truncate text-[13px] font-semibold text-foreground">{label}</h2>
                          <p className="mt-0.5 truncate text-[11px] text-foreground/48">
                            {t('appView.profileLine', {
                              count: profile.includedSkillCount,
                              tokens,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </aside>
  )
}

export function ApplicationDetailPanel({
  hasTitlebarInset,
  profile,
  skillGroupsBySkillId,
  onSelectSkillGroup,
}: {
  hasTitlebarInset: boolean
  profile: AgentCatalogProfile | null
  skillGroupsBySkillId: Map<string, SkillGroup>
  onSelectSkillGroup: (group: SkillGroup) => void
}) {
  const { t } = useAppPreferences()

  if (!profile) {
    return (
      <section
        className={`m-2 mb-2 flex min-h-0 items-center justify-center rounded-[8px] bg-[var(--surface)] text-[13px] text-foreground/52 shadow-minimal ${
          hasTitlebarInset ? 'mt-10' : 'mt-2'
        }`}
      >
        {t('appView.empty')}
      </section>
    )
  }

  const label = displayAgentName(profile.agentId, profile.agentName, t)
  const tokens = formatTokenEstimate(profile.includedTokenEstimate)
  const sourceCount = uniqueSourceCount(profile)
  const visibleSkills = profile.skills.slice(0, 80)
  const confirmedSkillCount = profile.skills.filter((skill) => skill.catalogDisclosure === 'included').length

  return (
    <section
      className={`scrollbar-hide m-2 mb-2 min-h-0 overflow-y-auto rounded-[8px] bg-[var(--surface)] shadow-minimal ${
        hasTitlebarInset ? 'mt-10' : 'mt-2'
      }`}
    >
      <div className="mx-auto max-w-[940px] px-7 py-7 sm:px-10 sm:py-9">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border/55 pb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-[8px] bg-[var(--surface)] shadow-minimal-flat">
                <AgentIcon
                  agentIcon={profile.agentIcon}
                  agentId={profile.agentId}
                  agentName={profile.agentName}
                  size={22}
                />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-foreground/38">{t('appView.eyebrow')}</p>
                <h2 className="truncate text-[24px] font-semibold leading-tight text-foreground">{label}</h2>
              </div>
            </div>
            <p className="mt-4 max-w-[680px] text-[13px] leading-6 text-foreground/58">
              {t('appView.description', {
                count: profile.includedSkillCount,
                tokens,
              })}
            </p>
          </div>
        </header>

        <div className="grid gap-2 py-5 sm:grid-cols-2">
          <Metric label={t('appView.metricSources')} value={sourceCount} />
          <Metric label={t('appView.metricTokens')} value={tokens} />
        </div>

        <section className="border-t border-border/55 pt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-[12px] font-semibold text-foreground/60">{t('appView.catalogHealth')}</h3>
            <span className="text-[11px] text-foreground/34">{profile.skills.length}</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            <StatusPill label={t('catalog.status.included')} value={confirmedSkillCount} />
            <StatusPill label={t('catalog.status.unknown')} value={profile.unconfirmedSkillCount} />
            <StatusPill label={t('catalog.status.disabled')} value={profile.disabledSkillCount} />
            <StatusPill label={t('catalog.status.invalid')} value={profile.invalidSkillCount} />
          </div>
        </section>

        <section className="mt-8 border-t border-border/55 pt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-[12px] font-semibold text-foreground/60">{t('appView.topSkills')}</h3>
            <span className="text-[11px] text-foreground/34">{t('catalog.tokensShort', { tokens })}</span>
          </div>
          {profile.topSkills.length ? (
            <div className="divide-y divide-border/45">
              {profile.topSkills.map((skill) => {
                const group = skillGroupsBySkillId.get(skill.id)
                return (
                  <button
                    className="w-full px-0 py-2.5 text-left transition-opacity hover:opacity-70 disabled:cursor-default"
                    disabled={!group}
                    key={skill.id}
                    onClick={() => group && onSelectSkillGroup(group)}
                    type="button"
                  >
                    <div className="flex min-w-0 items-baseline justify-between gap-3">
                      <p className="truncate text-[13px] font-medium text-foreground">{skill.name}</p>
                      <span className="shrink-0 text-[10px] text-foreground/34">
                        {formatTokenEstimate(skill.residentCatalogTokens)}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[12px] text-foreground/48">{skill.sourcePath}</p>
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="text-[12px] text-foreground/44">{t('catalog.emptyTopSkills')}</p>
          )}
        </section>

        <section className="mt-8 border-t border-border/55 pt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-[12px] font-semibold text-foreground/60">{t('appView.allSkills')}</h3>
            <span className="text-[11px] text-foreground/34">{visibleSkills.length}</span>
          </div>
          <div className="overflow-hidden rounded-[8px] bg-[var(--surface)] shadow-minimal-flat">
            <div className="divide-y divide-border/45">
              {visibleSkills.map((skill) => {
                const group = skillGroupsBySkillId.get(skill.id)
                return (
                  <button
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-muted)] disabled:cursor-default disabled:hover:bg-transparent"
                    disabled={!group}
                    key={skill.id}
                    onClick={() => group && onSelectSkillGroup(group)}
                    type="button"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent/70" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-foreground">{skill.name}</p>
                      <p className="mt-0.5 truncate text-[11px] text-foreground/42">{skill.sourcePath}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-foreground/38">
                      {formatTokenEstimate(skill.residentCatalogTokens)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>
      </div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[8px] bg-[var(--surface)] px-3 py-3 shadow-minimal-flat">
      <p className="text-[11px] text-foreground/42">{label}</p>
      <p className="mt-1 text-[18px] font-semibold text-foreground">{value}</p>
    </div>
  )
}

function StatusPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[8px] bg-[var(--surface)] px-3 py-3 shadow-minimal-flat">
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-[11px] text-foreground/48">{label}</span>
        <span className="text-[13px] font-semibold text-foreground">{value}</span>
      </div>
    </div>
  )
}
