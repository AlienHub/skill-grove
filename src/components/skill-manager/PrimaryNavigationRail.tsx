import { useAppPreferences } from '../../skill-manager/preferences'
import { SettingsEntry } from './SettingsEntry'

type SelectedPanel = 'home' | 'skill' | 'app' | 'agent-skill-config' | 'settings'

function RailButton({
  badge,
  icon,
  isCollapsed,
  isSelected,
  label,
  onClick,
  variant = 'default',
}: {
  badge?: string
  icon: 'agent-skill' | 'apps' | 'home' | 'settings' | 'skill'
  isCollapsed: boolean
  isSelected: boolean
  label: string
  onClick: () => void
  variant?: 'default' | 'compact'
}) {
  if (!isCollapsed) {
    return (
      <div className={variant === 'compact' ? 'min-w-0 flex-1' : undefined}>
        <SettingsEntry
          badge={badge}
          icon={icon}
          isSelected={isSelected}
          label={label}
          onClick={onClick}
        />
      </div>
    )
  }

  return (
    <button
      aria-label={label}
      className={`relative flex size-9 cursor-pointer items-center justify-center rounded-[8px] transition-colors ${
        isSelected
          ? 'bg-[color-mix(in_srgb,var(--foreground)_4%,var(--background))] text-foreground'
          : 'text-foreground/58 hover:bg-[color-mix(in_srgb,var(--foreground)_2%,var(--background))] hover:text-foreground'
      }`}
      onClick={onClick}
      title={label}
      type="button"
    >
      <SettingsEntryIcon icon={icon} />
      {badge ? <span className="absolute mt-[-28px] ml-[28px] size-2 rounded-full bg-accent" /> : null}
    </button>
  )
}

function SettingsEntryIcon({ icon }: { icon: 'agent-skill' | 'apps' | 'home' | 'settings' | 'skill' }) {
  const path = icon === 'agent-skill'
    ? 'M3.75 6.75a2 2 0 0 1 2-2h3.15c.44 0 .86.15 1.19.42l1.14.91c.33.27.75.42 1.18.42h5.84a2 2 0 0 1 2 2v1.25M4.5 9.75h15a1.5 1.5 0 0 1 1.47 1.8l-1.35 6.75a2 2 0 0 1-1.96 1.6H6.34a2 2 0 0 1-1.96-1.6L3.03 11.55a1.5 1.5 0 0 1 1.47-1.8Z'
    : icon === 'apps'
      ? 'M5.25 5.25h5.5v5.5h-5.5v-5.5ZM13.25 5.25h5.5v5.5h-5.5v-5.5ZM5.25 13.25h5.5v5.5h-5.5v-5.5ZM13.25 13.25h5.5v5.5h-5.5v-5.5Z'
      : icon === 'home'
        ? 'M3.75 10.75 12 4l8.25 6.75M5.75 9.75v8.5a1.5 1.5 0 0 0 1.5 1.5h9.5a1.5 1.5 0 0 0 1.5-1.5v-8.5'
        : icon === 'skill'
          ? 'M7.75 4.75h8.5a2 2 0 0 1 2 2v11.5l-3.25-2-3.25 2-3.25-2-3.25 2V6.75a2 2 0 0 1 2-2ZM8.75 8.5h6.5M8.75 11.5h4.5'
          : 'M10.325 4.317a1.724 1.724 0 0 1 3.35 0 1.724 1.724 0 0 0 2.573 1.066 1.724 1.724 0 0 1 2.898 1.93 1.724 1.724 0 0 0 .75 2.692 1.724 1.724 0 0 1 0 2.99 1.724 1.724 0 0 0-.75 2.692 1.724 1.724 0 0 1-2.898 1.93 1.724 1.724 0 0 0-2.573 1.066 1.724 1.724 0 0 1-3.35 0 1.724 1.724 0 0 0-2.573-1.066 1.724 1.724 0 0 1-2.898-1.93 1.724 1.724 0 0 0-.75-2.692 1.724 1.724 0 0 1 0-2.99 1.724 1.724 0 0 0 .75-2.692 1.724 1.724 0 0 1 2.898-1.93 1.724 1.724 0 0 0 2.573-1.066Z'

  return (
    <svg aria-hidden="true" className="size-4 shrink-0" fill="none" viewBox="0 0 24 24">
      <path d={path} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      {icon === 'settings' ? (
        <path
          d="M12 15.25A3.25 3.25 0 1 0 12 8.75a3.25 3.25 0 0 0 0 6.5Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      ) : null}
      {icon === 'home' ? (
        <path
          d="M9.75 19.75v-5.25h4.5v5.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      ) : null}
    </svg>
  )
}

export function PrimaryNavigationRail({
  hasTitlebarInset,
  hasPendingUpdate,
  isCollapsed,
  selectedPanel,
  onSelectAgentSkillConfig,
  onSelectAppView,
  onSelectHome,
  onSelectSettings,
  onSelectSkillView,
  onToggleCollapsed,
}: {
  hasTitlebarInset: boolean
  hasPendingUpdate: boolean
  isCollapsed: boolean
  selectedPanel: SelectedPanel
  onSelectAgentSkillConfig: () => void
  onSelectAppView: () => void
  onSelectHome: () => void
  onSelectSettings: () => void
  onSelectSkillView: () => void
  onToggleCollapsed: () => void
}) {
  const { t } = useAppPreferences()

  return (
    <aside
      className={`relative flex h-full shrink-0 flex-col overflow-hidden bg-[var(--background-elevated)] transition-[width] duration-200 ${
        isCollapsed ? 'w-[52px]' : 'w-[180px]'
      }`}
    >
      {isCollapsed ? (
        hasTitlebarInset ? <div className="h-9 shrink-0" /> : null
      ) : (
        <div className={`flex items-center border-b border-border/50 px-3 ${hasTitlebarInset ? 'h-20 pt-8' : 'h-12'}`}>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold text-foreground">{t('home.eyebrow')}</p>
            <p className="truncate text-[10px] text-foreground/38">{t('nav.workspace')}</p>
          </div>
        </div>
      )}

      <div className={`flex flex-1 flex-col gap-4 p-2 ${isCollapsed ? 'items-center' : ''}`}>
        <div className="space-y-1">
          <RailButton
            icon="skill"
            isCollapsed={isCollapsed}
            isSelected={selectedPanel === 'skill'}
            label={t('nav.skillView')}
            onClick={onSelectSkillView}
          />
          <RailButton
            icon="apps"
            isCollapsed={isCollapsed}
            isSelected={selectedPanel === 'app'}
            label={t('nav.appView')}
            onClick={onSelectAppView}
          />
        </div>

        <div className="space-y-1">
          {isCollapsed ? null : (
            <p className="px-4 pb-1 pt-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-foreground/32">
              {t('nav.navigation')}
            </p>
          )}
          <RailButton
            icon="agent-skill"
            isCollapsed={isCollapsed}
            isSelected={selectedPanel === 'agent-skill-config'}
            label={t('app.agentSkillConfig')}
            onClick={onSelectAgentSkillConfig}
          />
          <RailButton
            badge={hasPendingUpdate ? t('updates.restartBadge') : undefined}
            icon="settings"
            isCollapsed={isCollapsed}
            isSelected={selectedPanel === 'settings'}
            label={t('app.settings')}
            onClick={onSelectSettings}
          />
        </div>
      </div>

      <div className={`border-t border-border/50 p-2 ${isCollapsed ? 'flex flex-col items-center gap-1' : 'flex items-center gap-1'}`}>
        <RailButton
          icon="home"
          isCollapsed={isCollapsed}
          isSelected={selectedPanel === 'home'}
          label={t('app.home')}
          onClick={onSelectHome}
          variant="compact"
        />
        <button
          aria-label={isCollapsed ? t('common.expand') : t('common.collapse')}
          className={`flex size-8 cursor-pointer items-center justify-center rounded-[8px] text-foreground/54 transition-colors hover:bg-[var(--surface-muted)] hover:text-foreground ${
            isCollapsed ? '' : 'ml-auto'
          }`}
          onClick={onToggleCollapsed}
          title={isCollapsed ? t('common.expand') : t('common.collapse')}
          type="button"
        >
          <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
            <path
              d={isCollapsed ? 'M9.75 5.75 16 12l-6.25 6.25' : 'M14.25 5.75 8 12l6.25 6.25'}
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
        </button>
      </div>
    </aside>
  )
}
