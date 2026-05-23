import { useAppPreferences } from '../../skill-manager/preferences'
import { type BuiltInDirectoryState, type SourceIcon } from '../../skill-manager/types'
import { SkillDirectoryConfig } from './SkillDirectoryConfig'

export function AgentSkillConfigPanel({
  builtInDirectories,
  configuredDirectories,
  feedbackMessage,
  hasTitlebarInset,
  inputDisabled,
  sourceIcons,
  skillCount,
  userConfiguredDirectories,
  onRefresh,
  onRemoveDirectory,
  onSaveSourceIcon,
  onSetFeedbackMessage,
  onSelectDirectory,
}: {
  builtInDirectories: BuiltInDirectoryState[]
  configuredDirectories: string[]
  feedbackMessage: string | null
  hasTitlebarInset: boolean
  inputDisabled: boolean
  sourceIcons: Record<string, SourceIcon>
  skillCount: number
  userConfiguredDirectories: string[]
  onRefresh: () => void
  onRemoveDirectory: (directory: string) => void
  onSaveSourceIcon: (directory: string, icon: SourceIcon | null) => void
  onSetFeedbackMessage: (message: string) => void
  onSelectDirectory: (directory: string) => void
}) {
  const { t } = useAppPreferences()

  return (
    <section
      className={`m-2 mb-2 min-h-0 overflow-y-auto rounded-[8px] bg-[var(--surface)] p-5 shadow-minimal ${
        hasTitlebarInset ? 'mt-10' : 'mt-2'
      }`}
    >
      <div className="mb-6">
        <p className="text-[12px] text-foreground/52">{t('directories.eyebrow')}</p>
      </div>

      <div className="mb-8 rounded-[8px]">
        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold text-foreground">{t('directories.title')}</h2>
          <p className="mt-2 text-[14px] leading-7 text-foreground/56">
            {t('directories.description')}
          </p>
        </div>
      </div>

      <SkillDirectoryConfig
        builtInDirectories={builtInDirectories}
        configuredDirectories={configuredDirectories}
        feedbackMessage={feedbackMessage}
        inputDisabled={inputDisabled}
        sourceIcons={sourceIcons}
        skillCount={skillCount}
        userConfiguredDirectories={userConfiguredDirectories}
        onRefresh={onRefresh}
        onRemoveDirectory={onRemoveDirectory}
        onSaveSourceIcon={onSaveSourceIcon}
        onSetFeedbackMessage={onSetFeedbackMessage}
        onSelectDirectory={onSelectDirectory}
      />
    </section>
  )
}
