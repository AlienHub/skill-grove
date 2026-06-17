import {
  type DirectoryOpenTarget,
  type UpdateCheckState,
  type UpdateCheckStatus,
  type UpdateInstallStatus,
} from '../../skill-manager/types'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { open } from '@tauri-apps/plugin-dialog'
import {
  useAppPreferences,
  type LanguagePreference,
  type ThemePreference,
} from '../../skill-manager/preferences'
import { normalizeSelectedDirectoryPath } from '../../skill-manager/fileSelection'
import { Button, Input, Select, SegmentedControl } from '@najafi/design-system'
import { VersionUpdatePanel } from './VersionUpdatePanel'

export function AppSettingsPanel({
  currentVersion,
  hasTitlebarInset,
  isSavingPrimaryRepository,
  openDirectoryTargets,
  primaryRepositoryError,
  primarySkillRepository,
  updateCheck,
  updateCheckError,
  updateCheckStatus,
  updateInstallError,
  updateInstallStatus,
  onCheckForUpdates,
  onInstallUpdate,
  onOpenExternalUrl,
  onSavePrimaryRepository,
}: {
  currentVersion: string
  hasTitlebarInset: boolean
  isSavingPrimaryRepository: boolean
  openDirectoryTargets: DirectoryOpenTarget[]
  primaryRepositoryError: string | null
  primarySkillRepository: string
  updateCheck: UpdateCheckState | null
  updateCheckError: string | null
  updateCheckStatus: UpdateCheckStatus
  updateInstallError: string | null
  updateInstallStatus: UpdateInstallStatus
  onCheckForUpdates: () => void
  onInstallUpdate: () => void
  onOpenExternalUrl: (url: string) => void
  onSavePrimaryRepository: (path: string) => void | Promise<void>
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
  const directoryInputRef = useRef<HTMLInputElement>(null)
  const [draftPrimaryRepository, setDraftPrimaryRepository] = useState(primarySkillRepository)

  useEffect(() => {
    setDraftPrimaryRepository(primarySkillRepository)
  }, [primarySkillRepository])

  const isPrimaryRepositoryDirty =
    draftPrimaryRepository.trim() !== primarySkillRepository.trim()

  const handleChoosePrimaryRepositoryFolder = () => {
    void open({
      directory: true,
      multiple: false,
    })
      .then((selectedDirectory) => {
        if (typeof selectedDirectory === 'string') {
          setDraftPrimaryRepository(selectedDirectory)
          return
        }

        directoryInputRef.current?.click()
      })
      .catch(() => {
        directoryInputRef.current?.click()
      })
  }

  const handlePrimaryRepositoryDirectorySelection = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] as
      | (File & { path?: string; webkitRelativePath?: string })
      | undefined

    if (!selectedFile) {
      return
    }

    const selectedDirectory = normalizeSelectedDirectoryPath(
      selectedFile.path ?? '',
      selectedFile.webkitRelativePath
    )

    if (selectedDirectory) {
      setDraftPrimaryRepository(selectedDirectory)
    }

    event.target.value = ''
  }

  return (
    <section
      className={`m-2 mb-2 min-h-0 overflow-y-auto rounded-[8px] bg-[var(--surface)] p-5 shadow-minimal ${
        hasTitlebarInset ? 'mt-10' : 'mt-2'
      }`}
    >
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
                aria-label={t('settings.appearanceTitle')}
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
                aria-label={t('settings.languageTitle')}
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
              <Select
                aria-label={t('settings.openTargetTitle')}
                onChange={(event) => setDefaultOpenTargetId(event.target.value === 'default' ? null : event.target.value)}
                value={defaultOpenTargetValue}
              >
                {openTargetOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-[14px] font-semibold text-foreground">{t('settings.primaryRepositoryTitle')}</h3>
          <div className="rounded-[8px] border border-border/50 bg-[var(--surface)] px-4 py-3 shadow-minimal-flat">
            <p className="mb-3 text-[12px] text-foreground/52">{t('settings.primaryRepositoryDescription')}</p>
            <input
              aria-hidden="true"
              className="hidden"
              onChange={handlePrimaryRepositoryDirectorySelection}
              ref={directoryInputRef}
              type="file"
              {...({ webkitdirectory: 'true' } as Record<string, string>)}
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                aria-label={t('settings.primaryRepositoryTitle')}
                className="min-w-0 flex-1 font-mono text-foreground/88"
                onChange={(event) => setDraftPrimaryRepository(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' || !isPrimaryRepositoryDirty || isSavingPrimaryRepository) {
                    return
                  }

                  event.preventDefault()
                  void onSavePrimaryRepository(draftPrimaryRepository)
                }}
                spellCheck={false}
                type="text"
                value={draftPrimaryRepository}
              />
              <div className="flex shrink-0 flex-wrap gap-2">
                {isPrimaryRepositoryDirty || isSavingPrimaryRepository ? (
                  <Button
                    loading={isSavingPrimaryRepository}
                    disabled={!isPrimaryRepositoryDirty}
                    onClick={() => void onSavePrimaryRepository(draftPrimaryRepository)}
                  >
                    {isSavingPrimaryRepository
                      ? t('settings.primaryRepositorySaving')
                      : t('settings.primaryRepositorySave')}
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  disabled={isSavingPrimaryRepository}
                  onClick={handleChoosePrimaryRepositoryFolder}
                >
                  {t('settings.primaryRepositoryChooseFolder')}
                </Button>
                <Button
                  variant="outline"
                  disabled={isSavingPrimaryRepository}
                  onClick={() => void onSavePrimaryRepository('~/.agents/skills')}
                >
                  {t('settings.primaryRepositoryResetDefault')}
                </Button>
              </div>
            </div>
            {primaryRepositoryError ? (
              <p className="mt-2 text-[12px] text-destructive">{primaryRepositoryError}</p>
            ) : null}
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
