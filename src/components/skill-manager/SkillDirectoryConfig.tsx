import { useRef, useState } from 'react'
import { open } from '@tauri-apps/plugin-dialog'
import { AgentIcon, getAgentInfoFromDirectory } from '../../skill-manager/agentInfo'
import { displayAgentName } from '../../skill-manager/display'
import {
  normalizeSelectedDirectoryPath,
  readFileAsDataUrl,
} from '../../skill-manager/fileSelection'
import { useAppPreferences } from '../../skill-manager/preferences'
import { directoryScanEnabled } from '../../skill-manager/scanDirectories'
import { type BuiltInDirectoryState, type SourceIcon } from '../../skill-manager/types'
import { Ripple } from '../ui/Ripple'

export function SkillDirectoryConfig({
  builtInDirectories,
  configuredDirectories,
  disabledScanDirectories,
  skillCount,
  sourceIcons,
  userConfiguredDirectories,
  inputDisabled,
  pendingScanDirectory,
  feedbackMessage,
  onRemoveDirectory,
  onRefresh,
  onSaveSourceIcon,
  onSetDirectoryScanEnabled,
  onSelectDirectory,
  onSetFeedbackMessage,
}: {
  builtInDirectories: BuiltInDirectoryState[]
  configuredDirectories: string[]
  disabledScanDirectories: string[]
  skillCount: number
  sourceIcons: Record<string, SourceIcon>
  userConfiguredDirectories: string[]
  inputDisabled: boolean
  pendingScanDirectory: string | null
  feedbackMessage: string | null
  onRemoveDirectory: (directory: string) => void
  onRefresh: () => void
  onSaveSourceIcon: (directory: string, icon: SourceIcon | null) => void
  onSetDirectoryScanEnabled: (directory: string, enabled: boolean) => void
  onSelectDirectory: (directory: string) => void
  onSetFeedbackMessage: (message: string) => void
}) {
  const { t } = useAppPreferences()
  const directoryInputRef = useRef<HTMLInputElement>(null)
  const iconInputRef = useRef<HTMLInputElement>(null)
  const [selectedIconDirectory, setSelectedIconDirectory] = useState<string | null>(null)
  const [isUnavailableExpanded, setIsUnavailableExpanded] = useState(false)
  const scanButtonLabel = inputDisabled ? t('directories.scanning') : t('directories.rescan')
  const chooseButtonLabel = inputDisabled ? t('directories.processing') : t('directories.chooseFolder')
  const installedBuiltInDirectories = builtInDirectories.filter((directory) => directory.installed)
  const unavailableBuiltInDirectories = builtInDirectories.filter((directory) => !directory.installed)

  const renderScanToggle = (directory: string, enabled: boolean, disabled = false) => (
    <button
      aria-checked={enabled}
      aria-label={enabled ? t('directories.disableScan') : t('directories.enableScan')}
      className={`inline-flex h-6 w-11 cursor-pointer items-center rounded-full border p-0.5 transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
        enabled
          ? 'justify-end border-foreground/12 bg-foreground/64 hover:bg-foreground/72'
          : 'justify-start border-border/55 bg-foreground/6 hover:bg-foreground/10'
      }`}
      disabled={inputDisabled || disabled || pendingScanDirectory === directory}
      onClick={() => onSetDirectoryScanEnabled(directory, !enabled)}
      role="switch"
      title={enabled ? t('directories.disableScan') : t('directories.enableScan')}
      type="button"
    >
      <span
        className={`size-4 rounded-full shadow-minimal-flat transition-colors ${
          enabled ? 'bg-[var(--surface)]' : 'bg-foreground/34'
        }`}
      />
    </button>
  )

  const handleChooseDirectory = () => {
    void open({
      directory: true,
      multiple: false,
    }).then((selectedDirectory) => {
      if (typeof selectedDirectory === 'string') {
        onSelectDirectory(selectedDirectory)
        return
      }

      directoryInputRef.current?.click()
    }).catch(() => {
      directoryInputRef.current?.click()
    })
  }

  const handleDirectorySelection = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      onSelectDirectory(selectedDirectory)
    }

    event.target.value = ''
  }

  const handleChooseIcon = (directory: string) => {
    setSelectedIconDirectory(directory)
    iconInputRef.current?.click()
  }

  const handleIconSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    const directory = selectedIconDirectory
    event.target.value = ''

    if (!selectedFile || !directory) {
      return
    }

    const fileName = selectedFile.name.toLowerCase()
    const isSupportedIcon =
      selectedFile.type === 'image/png' ||
      selectedFile.type === 'image/svg+xml' ||
      fileName.endsWith('.png') ||
      fileName.endsWith('.svg')

    if (!isSupportedIcon) {
      onSetFeedbackMessage(t('directories.iconTypeError'))
      return
    }

    void readFileAsDataUrl(selectedFile).then((value) => {
      onSaveSourceIcon(directory, { type: 'dataUrl', value })
      setSelectedIconDirectory(null)
    }).catch(() => {
      onSetFeedbackMessage(t('directories.iconReadError'))
    })
  }

  return (
    <div>
      <section>
        <input
          ref={directoryInputRef}
          className="hidden"
          multiple
          onChange={handleDirectorySelection}
          type="file"
          {...({ webkitdirectory: 'true' } as Record<string, string>)}
        />
        <input
          ref={iconInputRef}
          accept=".png,.svg,image/png,image/svg+xml"
          className="hidden"
          onChange={handleIconSelection}
          type="file"
        />

        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[14px] font-semibold text-foreground">{t('directories.scanTitle')}</h3>
            <p className="mt-1 text-[12px] text-foreground/52">
              {t('directories.scanSummary', {
                directoryCount: configuredDirectories.length,
                skillCount,
              })}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              className="inline-flex cursor-pointer items-center gap-2 rounded-[8px] bg-foreground px-3 py-2 text-[12px] font-medium text-background transition-opacity hover:opacity-88 disabled:cursor-not-allowed disabled:opacity-45"
              disabled={inputDisabled}
              onClick={handleChooseDirectory}
              type="button"
            >
              {inputDisabled ? <Ripple size={13} /> : null}
              {chooseButtonLabel}
            </button>
            <button
              className="inline-flex cursor-pointer items-center gap-2 rounded-[8px] border border-border/50 bg-[var(--surface)] px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:text-foreground/35"
              disabled={inputDisabled}
              onClick={onRefresh}
              type="button"
            >
              {inputDisabled ? <Ripple size={13} /> : null}
              {scanButtonLabel}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="text-[12px] font-medium text-foreground/70">{t('directories.customDirectories')}</div>
              <div className="text-[11px] text-foreground/40">{t('app.count', { count: userConfiguredDirectories.length })}</div>
            </div>
            <div className="space-y-2">
              {userConfiguredDirectories.length === 0 ? (
                <div className="rounded-[8px] border border-border/50 bg-[var(--surface)] px-4 py-3 text-[12px] text-foreground/52 shadow-minimal-flat">
                  {t('directories.emptyCustom')}
                </div>
              ) : (
                userConfiguredDirectories.map((directory) => {
                  const agentInfo = getAgentInfoFromDirectory(directory)
                  const agentName = displayAgentName(agentInfo.agentId, agentInfo.agentName, t)
                  const sourceIcon = sourceIcons[directory]
                  const scanEnabled = directoryScanEnabled(directory, disabledScanDirectories)

                  return (
                    <div
                      className={`flex items-center gap-3 rounded-[8px] border border-border/50 bg-[var(--surface)] px-4 py-3 shadow-minimal-flat ${
                        scanEnabled ? '' : 'text-foreground/55'
                      }`}
                      key={directory}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-[7px] border border-border/45 bg-[var(--surface-muted)]">
                          <AgentIcon
                            agentIcon={sourceIcon}
                            agentId={agentInfo.agentId}
                            agentName={agentInfo.agentName}
                            size={14}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[12px] font-medium text-foreground/82">{agentName}</div>
                          <div className="mt-0.5 truncate text-[12px] text-foreground/52">{directory}</div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {renderScanToggle(directory, scanEnabled)}
                        <button
                          className="cursor-pointer text-[12px] text-foreground/45 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:text-foreground/30"
                          disabled={inputDisabled}
                          onClick={() => handleChooseIcon(directory)}
                          type="button"
                        >
                          {t('directories.changeIcon')}
                        </button>
                        {sourceIcon ? (
                          <button
                            className="cursor-pointer text-[12px] text-foreground/45 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:text-foreground/30"
                            disabled={inputDisabled}
                            onClick={() => onSaveSourceIcon(directory, null)}
                            type="button"
                          >
                            {t('common.reset')}
                          </button>
                        ) : null}
                        <button
                          className="cursor-pointer text-[12px] text-foreground/45 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:text-foreground/30"
                          disabled={inputDisabled}
                          onClick={() => onRemoveDirectory(directory)}
                          type="button"
                        >
                          {t('common.delete')}
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="text-[12px] font-medium text-foreground/70">
                {t('directories.installedAgents', { count: installedBuiltInDirectories.length })}
              </div>
            </div>
            <div className="space-y-2">
              {installedBuiltInDirectories.length === 0 ? (
                <div className="rounded-[8px] border border-border/50 bg-[var(--surface)] px-4 py-3 text-[12px] text-foreground/52 shadow-minimal-flat">
                  {t('directories.emptyInstalled')}
                </div>
              ) : (
                installedBuiltInDirectories.map((directory) => {
                  const sourceIcon = sourceIcons[directory.directory]

                  return (
                    <div
                      className={`flex items-center gap-3 rounded-[8px] border border-border/50 bg-[var(--surface)] px-4 py-3 shadow-minimal-flat ${
                        directory.scanEnabled ? '' : 'text-foreground/55'
                      }`}
                      key={directory.directory}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-[7px] border border-border/45 bg-[var(--surface-muted)]">
                          <AgentIcon
                            agentIcon={sourceIcon}
                            agentId={directory.agentId}
                            agentName={directory.agentName}
                            size={14}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[12px] font-medium text-foreground/82">{directory.agentName}</div>
                          <div className="mt-0.5 truncate text-[12px] text-foreground/52">{directory.directory}</div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {renderScanToggle(directory.directory, directory.scanEnabled, !directory.directoryExists)}
                        <button
                          className="cursor-pointer text-[12px] text-foreground/45 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:text-foreground/30"
                          disabled={inputDisabled || !directory.scanEnabled}
                          onClick={() => handleChooseIcon(directory.directory)}
                          type="button"
                        >
                          {t('directories.changeIcon')}
                        </button>
                        {sourceIcon ? (
                          <button
                            className="cursor-pointer text-[12px] text-foreground/45 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:text-foreground/30"
                            disabled={inputDisabled}
                            onClick={() => onSaveSourceIcon(directory.directory, null)}
                            type="button"
                          >
                            {t('common.reset')}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="text-[12px] font-medium text-foreground/70">
                {t('directories.unavailableAgents', { count: unavailableBuiltInDirectories.length })}
              </div>
              <button
                aria-expanded={isUnavailableExpanded}
                className="cursor-pointer text-[11px] text-foreground/45 transition-colors hover:text-foreground"
                onClick={() => setIsUnavailableExpanded((isExpanded) => !isExpanded)}
                type="button"
              >
                {isUnavailableExpanded ? t('common.collapse') : t('common.expand')}
              </button>
            </div>
            {isUnavailableExpanded ? (
              <div className="space-y-2">
                {unavailableBuiltInDirectories.map((directory) => (
                  <div
                    className="flex items-center gap-3 rounded-[8px] border border-border/35 bg-[var(--surface-subtle)] px-4 py-3 text-foreground/45 shadow-minimal-flat"
                    key={directory.directory}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-[7px] border border-border/35 bg-[var(--surface-muted)]">
                        <AgentIcon
                          agentIcon={null}
                          agentId={directory.agentId}
                          agentName={directory.agentName}
                          size={14}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[12px] font-medium">{directory.agentName}</div>
                        <div className="mt-0.5 truncate text-[12px]">{directory.directory}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {feedbackMessage ? <p className="mt-3 text-[12px] text-foreground/52">{feedbackMessage}</p> : null}
      </section>
    </div>
  )
}
