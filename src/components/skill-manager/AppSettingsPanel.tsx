import {
  type DirectoryOpenTarget,
  type UpdateCheckState,
  type UpdateCheckStatus,
  type UpdateInstallStatus,
} from '../../skill-manager/types'
import {
  useAppPreferences,
  type LanguagePreference,
  type ThemePreference,
} from '../../skill-manager/preferences'
import { VersionUpdatePanel } from './VersionUpdatePanel'

function SegmentedControl<TValue extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Array<{ label: string; value: TValue }>
  value: TValue
  onChange: (value: TValue) => void
}) {
  return (
    <div aria-label={label} className="flex overflow-hidden rounded-[8px] border border-border/50 bg-[var(--surface-muted)] p-0.5">
      {options.map((option) => {
        const isSelected = option.value === value

        return (
          <button
            aria-pressed={isSelected}
            className={`h-7 cursor-pointer rounded-[7px] px-3 text-[12px] font-medium transition-colors ${
              isSelected
                ? 'bg-[var(--surface)] text-foreground shadow-minimal-flat'
                : 'text-foreground/48 hover:text-foreground'
            }`}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function AppSettingsPanel({
  currentVersion,
  openDirectoryTargets,
  updateCheck,
  updateCheckError,
  updateCheckStatus,
  updateInstallError,
  updateInstallStatus,
  onCheckForUpdates,
  onInstallUpdate,
  onOpenExternalUrl,
}: {
  currentVersion: string
  openDirectoryTargets: DirectoryOpenTarget[]
  updateCheck: UpdateCheckState | null
  updateCheckError: string | null
  updateCheckStatus: UpdateCheckStatus
  updateInstallError: string | null
  updateInstallStatus: UpdateInstallStatus
  onCheckForUpdates: () => void
  onInstallUpdate: () => void
  onOpenExternalUrl: (url: string) => void
}) {
  const {
    defaultOpenTargetId,
    languagePreference,
    setDefaultOpenTargetId,
    setLanguagePreference,
    setThemePreference,
    t,
    themePreference,
  } = useAppPreferences()
  const themeOptions: Array<{ label: string; value: ThemePreference }> = [
    { label: t('settings.themeSystem'), value: 'system' },
    { label: t('settings.themeLight'), value: 'light' },
    { label: t('settings.themeDark'), value: 'dark' },
  ]
  const languageOptions: Array<{ label: string; value: LanguagePreference }> = [
    { label: t('settings.languageSystem'), value: 'system' },
    { label: t('settings.languageChinese'), value: 'zh-CN' },
    { label: t('settings.languageEnglish'), value: 'en-US' },
  ]
  const defaultOpenTargetValue = defaultOpenTargetId && openDirectoryTargets.some((target) => target.id === defaultOpenTargetId)
    ? defaultOpenTargetId
    : 'default'
  const openTargetOptions: Array<{ label: string; value: string }> = [
    { label: t('settings.openTargetFileManager'), value: 'default' },
    ...openDirectoryTargets
      .filter((target) => target.category === 'editor' || target.category === 'ide')
      .map((target) => ({ label: target.label, value: target.id })),
  ]

  return (
    <section className="overflow-y-auto rounded-[8px] bg-[color-mix(in_srgb,var(--foreground)_1.5%,var(--background))] p-5 shadow-minimal">
      <div className="mb-6">
        <p className="text-[12px] text-foreground/52">{t('settings.eyebrow')}</p>
      </div>

      <div className="mb-8 rounded-[8px]">
        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold text-foreground">{t('settings.title')}</h2>
          <p className="mt-2 text-[14px] leading-7 text-foreground/56">
            {t('settings.description')}
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <h3 className="mb-4 text-[14px] font-semibold text-foreground">{t('settings.appearanceTitle')}</h3>
          <div className="rounded-[8px] border border-border/50 bg-[var(--surface)] px-4 py-3 shadow-minimal-flat">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[12px] text-foreground/52">{t('settings.appearanceDescription')}</p>
              <SegmentedControl
                label={t('settings.appearanceTitle')}
                options={themeOptions}
                value={themePreference}
                onChange={setThemePreference}
              />
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-[14px] font-semibold text-foreground">{t('settings.languageTitle')}</h3>
          <div className="rounded-[8px] border border-border/50 bg-[var(--surface)] px-4 py-3 shadow-minimal-flat">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[12px] text-foreground/52">{t('settings.languageDescription')}</p>
              <SegmentedControl
                label={t('settings.languageTitle')}
                options={languageOptions}
                value={languagePreference}
                onChange={setLanguagePreference}
              />
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-[14px] font-semibold text-foreground">{t('settings.openTargetTitle')}</h3>
          <div className="rounded-[8px] border border-border/50 bg-[var(--surface)] px-4 py-3 shadow-minimal-flat">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[12px] text-foreground/52">{t('settings.openTargetDescription')}</p>
              <select
                aria-label={t('settings.openTargetTitle')}
                className="h-8 min-w-[180px] rounded-[8px] border border-border/50 bg-[var(--surface-muted)] px-2.5 text-[12px] font-medium text-foreground/72 outline-none focus:border-foreground/18"
                onChange={(event) => setDefaultOpenTargetId(event.target.value === 'default' ? null : event.target.value)}
                value={defaultOpenTargetValue}
              >
                {openTargetOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <VersionUpdatePanel
          currentVersion={currentVersion}
          updateCheck={updateCheck}
          updateCheckError={updateCheckError}
          updateCheckStatus={updateCheckStatus}
          updateInstallError={updateInstallError}
          updateInstallStatus={updateInstallStatus}
          onCheckForUpdates={onCheckForUpdates}
          onInstallUpdate={onInstallUpdate}
          onOpenExternalUrl={onOpenExternalUrl}
        />
      </div>
    </section>
  )
}
