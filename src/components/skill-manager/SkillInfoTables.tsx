import { useMemo, useState } from 'react'
import { AgentIcon } from '../../skill-manager/agentInfo'
import { displayAgentName } from '../../skill-manager/display'
import { useAppPreferences } from '../../skill-manager/preferences'
import { isRealSkillSource, isResolvedSkillUnderPrimaryRepository } from '../../skill-manager/skillGrouping'
import { type DirectoryOpenTarget, type Skill, type SkillGroup } from '../../skill-manager/types'
import { DefinitionTable } from './DefinitionTable'
import { SkillSourceActions, SkillSourceRemoveButton } from './SkillSourceActions'
import { Ripple } from '../ui/Ripple'

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : '—'
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}

function formatMetadataLabel(key: string, t: ReturnType<typeof useAppPreferences>['t']) {
  const labels: Record<string, string> = {
    cli_version: t('table.cliVersion'),
    license: t('table.license'),
    version: t('table.version'),
    author: t('table.author'),
    metadata: t('table.metadata'),
  }

  return labels[key] ?? key
}

function buildMetadataRows(skill: Skill, t: ReturnType<typeof useAppPreferences>['t']) {
  const reservedKeys = new Set(['name', 'description'])
  const extraRows = Object.entries(skill.metadata)
    .filter(([key]) => !reservedKeys.has(key))
    .map(([key, value]) => ({
      label: formatMetadataLabel(key, t),
      value: formatValue(value),
    }))

  return [
    { label: t('table.identifier'), value: skill.slug },
    { label: t('table.name'), value: skill.name },
    { label: t('table.description'), value: skill.description || t('common.noValue') },
    ...extraRows,
  ]
}

function buildSourceRows(skill: Skill, t: ReturnType<typeof useAppPreferences>['t']) {
  const isSoftLinkSource = !isRealSkillSource(skill)
  const agentName = displayAgentName(skill.agentId, skill.agentName, t)
  return [
    {
      label: t('table.agentApp'),
      value: (
        <span className="flex min-w-0 items-center gap-1.5">
          <AgentIcon
            agentIcon={skill.agentIcon}
            agentId={skill.agentId}
            agentName={skill.agentName}
            size={14}
          />
          <span className="min-w-0 truncate">{agentName}</span>
        </span>
      ),
    },
    { label: t('table.scanDirectory'), value: skill.sourceDirectory },
    { label: t('table.skillDirectory'), value: skill.skillDirectory },
    { label: t('table.relativeLocation'), value: skill.location },
    ...(isSoftLinkSource
      ? [
          { label: t('table.sourceStatus'), value: t('source.softLink') },
          { label: t('table.realLocation'), value: skill.resolvedSkillDirectory },
        ]
      : []),
    { label: t('table.contentHash'), value: skill.contentHash },
  ]
}

export function SkillMetadataTable({ skill }: { skill: Skill }) {
  const { t } = useAppPreferences()
  const rows = useMemo(() => buildMetadataRows(skill, t), [skill, t])

  return <DefinitionTable rows={rows} />
}

export function SkillSourceTable({
  configuredDirectories,
  openDirectoryTargets,
  primarySkillRepository,
  skill,
  skillGroup,
  sourceCount,
  onCreateSymlink,
  onConvertToSymlink,
  onExportZip,
  onMigrateToPrimary,
  onRemoveSource,
}: {
  configuredDirectories: string[]
  openDirectoryTargets: DirectoryOpenTarget[]
  primarySkillRepository: string
  skill: Skill
  skillGroup: SkillGroup
  sourceCount: number
  onCreateSymlink: (skill: Skill, targetSourceDirectory: string) => Promise<void>
  onConvertToSymlink: (skill: Skill, targetSkill: Skill) => Promise<void>
  onExportZip: (skill: Skill) => Promise<void>
  onMigrateToPrimary: (skill: Skill) => Promise<void>
  onRemoveSource: (skill: Skill) => Promise<void>
}) {
  const { t } = useAppPreferences()
  const rows = useMemo(() => buildSourceRows(skill, t), [skill, t])

  return (
    <div className="relative z-30 rounded-[8px] border border-border/50 bg-[var(--surface)]">
      <div className="flex items-center justify-between gap-3 border-b border-border/50 px-3 py-2">
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-foreground/68">{t('table.currentSource')}</p>
          <p className="mt-0.5 truncate text-[11px] text-foreground/38">{skill.skillDirectory}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <SkillSourceGovernanceActions
            configuredDirectories={configuredDirectories}
            primarySkillRepository={primarySkillRepository}
            skill={skill}
            skillGroup={skillGroup}
            onCreateSymlink={onCreateSymlink}
            onConvertToSymlink={onConvertToSymlink}
            onExportZip={onExportZip}
            onMigrateToPrimary={onMigrateToPrimary}
          />
          <SkillSourceRemoveButton
            skill={skill}
            sourceCount={sourceCount}
            onRemoveSource={onRemoveSource}
          />
          <SkillSourceActions
            openDirectoryTargets={openDirectoryTargets}
            skill={skill}
          />
        </div>
      </div>
      <dl className="divide-y divide-border/50">
        {rows.map((row) => (
          <div
            className="grid grid-cols-[84px_minmax(0,1fr)] gap-3 px-3 py-2 sm:grid-cols-[96px_minmax(0,1fr)]"
            key={row.label}
          >
            <dt className="text-[12px] text-foreground/48">{row.label}</dt>
            <dd className="min-w-0 whitespace-pre-wrap break-words text-[12px] text-foreground/84">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function directoryLabel(directory: string, skillGroup: SkillGroup, t: ReturnType<typeof useAppPreferences>['t']) {
  const sourceSkill = skillGroup.skills.find((item) => item.sourceDirectory === directory)
  if (sourceSkill) {
    return displayAgentName(sourceSkill.agentId, sourceSkill.agentName, t)
  }

  const directoryName = directory.split('/').filter(Boolean).at(-1)
  return directoryName ?? directory
}

function errorText(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim()
  }

  if (typeof error === 'string' && error.trim()) {
    return error.trim()
  }

  return fallback
}

function SkillSourceGovernanceActions({
  configuredDirectories,
  primarySkillRepository,
  skill,
  skillGroup,
  onCreateSymlink,
  onConvertToSymlink,
  onExportZip,
  onMigrateToPrimary,
}: {
  configuredDirectories: string[]
  primarySkillRepository: string
  skill: Skill
  skillGroup: SkillGroup
  onCreateSymlink: (skill: Skill, targetSourceDirectory: string) => Promise<void>
  onConvertToSymlink: (skill: Skill, targetSkill: Skill) => Promise<void>
  onExportZip: (skill: Skill) => Promise<void>
  onMigrateToPrimary: (skill: Skill) => Promise<void>
}) {
  const { t } = useAppPreferences()
  const [mode, setMode] = useState<'share' | 'convert' | 'migratePrimary' | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const isRealSource = isRealSkillSource(skill)
  const shareTargets = isRealSource
    ? configuredDirectories.filter((directory) => directory !== skill.sourceDirectory)
    : []
  const currentVariant = skillGroup.variants.find((variant) =>
    variant.skills.some((variantSkill) => variantSkill.id === skill.id)
  )
  const convertTargets = isRealSource
    ? (currentVariant?.skills ?? []).filter((candidate) =>
        candidate.id !== skill.id &&
        candidate.contentHash === skill.contentHash &&
        isRealSkillSource(candidate) &&
        candidate.resolvedSkillDirectory !== skill.resolvedSkillDirectory
      )
    : []
  const hasShareTargets = shareTargets.length > 0
  const hasConvertTargets = convertTargets.length > 0
  const canMigrateToPrimary =
    isRealSource && !isResolvedSkillUnderPrimaryRepository(skill.resolvedSkillDirectory, primarySkillRepository)

  if (!isRealSource) {
    return null
  }

  const close = () => {
    if (isProcessing) {
      return
    }

    setMode(null)
    setErrorMessage(null)
  }

  const handleShare = (targetSourceDirectory: string) => {
    setIsProcessing(true)
    setErrorMessage(null)

    void onCreateSymlink(skill, targetSourceDirectory)
      .then(() => setMode(null))
      .catch((error) => setErrorMessage(errorText(error, t('source.shareFailed'))))
      .finally(() => setIsProcessing(false))
  }

  const handleConvert = (targetSkill: Skill) => {
    setIsProcessing(true)
    setErrorMessage(null)

    void onConvertToSymlink(skill, targetSkill)
      .then(() => setMode(null))
      .catch((error) => setErrorMessage(errorText(error, t('source.convertToSoftLinkFailed'))))
      .finally(() => setIsProcessing(false))
  }

  const handleExportZip = () => {
    setIsExporting(true)
    setErrorMessage(null)

    void onExportZip(skill)
      .catch((error) => setErrorMessage(errorText(error, t('source.exportZipFailed'))))
      .finally(() => setIsExporting(false))
  }

  const handleMigrateToPrimary = () => {
    setIsProcessing(true)
    setErrorMessage(null)

    void onMigrateToPrimary(skill)
      .then(() => setMode(null))
      .catch((error) => setErrorMessage(errorText(error, t('source.migrateToPrimaryFailed'))))
      .finally(() => setIsProcessing(false))
  }

  return (
    <>
      <button
        className="flex h-8 cursor-pointer items-center gap-1.5 rounded-[8px] px-3 text-[12px] font-medium text-foreground/52 transition-colors hover:bg-foreground/5 hover:text-foreground disabled:cursor-default disabled:opacity-55"
        disabled={isExporting}
        onClick={handleExportZip}
        type="button"
      >
        {isExporting ? <Ripple className="text-foreground/48" size={12} /> : null}
        <span>{t('source.exportZip')}</span>
      </button>
      {hasShareTargets ? (
        <button
          className="h-8 cursor-pointer rounded-[8px] px-3 text-[12px] font-medium text-foreground/52 transition-colors hover:bg-foreground/5 hover:text-foreground"
          onClick={() => {
            setErrorMessage(null)
            setMode('share')
          }}
          type="button"
        >
          {t('source.share')}
        </button>
      ) : null}
      {hasConvertTargets ? (
        <button
          className="h-8 cursor-pointer rounded-[8px] px-3 text-[12px] font-medium text-foreground/52 transition-colors hover:bg-foreground/5 hover:text-foreground"
          onClick={() => {
            setErrorMessage(null)
            setMode('convert')
          }}
          type="button"
        >
          {t('source.convertToSoftLink')}
        </button>
      ) : null}
      {canMigrateToPrimary ? (
        <button
          className="h-8 cursor-pointer rounded-[8px] px-3 text-[12px] font-medium text-foreground/52 transition-colors hover:bg-foreground/5 hover:text-foreground"
          onClick={() => {
            setErrorMessage(null)
            setMode('migratePrimary')
          }}
          type="button"
        >
          {t('source.migrateToPrimary')}
        </button>
      ) : null}

      {mode ? (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/22 px-4">
          <div className="w-full max-w-[480px] rounded-[8px] border border-border/60 bg-[var(--surface)] p-5 shadow-strong">
            <h4 className="text-[14px] font-semibold text-foreground">
              {mode === 'share'
                ? t('source.shareTitle')
                : mode === 'convert'
                  ? t('source.convertToSoftLinkTitle')
                  : t('source.migrateToPrimaryTitle')}
            </h4>
            <p className="mt-2 text-[12px] leading-5 text-foreground/56">
              {mode === 'share'
                ? t('source.shareDescription')
                : mode === 'convert'
                  ? t('source.convertToSoftLinkDescription')
                  : t('source.migrateToPrimaryDescription', { path: primarySkillRepository })}
            </p>
            {mode === 'share' || mode === 'convert' ? (
              <div className="mt-4 max-h-[260px] space-y-1 overflow-y-auto">
                {mode === 'share'
                  ? shareTargets.map((directory) => (
                      <button
                        className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-[8px] px-3 py-2 text-left transition-colors hover:bg-foreground/5 disabled:cursor-default disabled:opacity-55"
                        disabled={isProcessing}
                        key={directory}
                        onClick={() => handleShare(directory)}
                        type="button"
                      >
                        <span className="min-w-0">
                          <span className="block text-[12px] font-medium text-foreground/78">
                            {directoryLabel(directory, skillGroup, t)}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-foreground/42">{directory}</span>
                        </span>
                        {isProcessing ? <Ripple className="text-foreground/48" size={14} /> : null}
                      </button>
                    ))
                  : convertTargets.map((targetSkill) => (
                      <button
                        className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-[8px] px-3 py-2 text-left transition-colors hover:bg-foreground/5 disabled:cursor-default disabled:opacity-55"
                        disabled={isProcessing}
                        key={targetSkill.id}
                        onClick={() => handleConvert(targetSkill)}
                        type="button"
                      >
                        <span className="min-w-0">
                          <span className="block text-[12px] font-medium text-foreground/78">
                            {displayAgentName(targetSkill.agentId, targetSkill.agentName, t)}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-foreground/42">
                            {targetSkill.skillDirectory}
                          </span>
                        </span>
                        {isProcessing ? <Ripple className="text-foreground/48" size={14} /> : null}
                      </button>
                    ))}
              </div>
            ) : null}
            {errorMessage ? (
              <p className="mt-3 rounded-[8px] border border-[#b04a3a]/25 bg-[#b04a3a]/7 px-3 py-2 text-[12px] text-[#8f3f33]">
                {errorMessage}
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                className="h-8 cursor-pointer rounded-[8px] border border-border/50 bg-[var(--surface)] px-3 text-[12px] font-medium text-foreground/64 transition-colors hover:bg-foreground/5 hover:text-foreground disabled:cursor-default disabled:opacity-55"
                disabled={isProcessing}
                onClick={close}
                type="button"
              >
                {t('common.cancel')}
              </button>
              {mode === 'migratePrimary' ? (
                <button
                  className="flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-[8px] bg-foreground px-3 text-[12px] font-medium text-background transition-opacity hover:opacity-88 disabled:cursor-default disabled:opacity-55"
                  disabled={isProcessing}
                  onClick={handleMigrateToPrimary}
                  type="button"
                >
                  {isProcessing ? <Ripple className="text-background/72" size={12} /> : null}
                  {t('source.migrateToPrimaryConfirm')}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      {errorMessage && !mode ? (
        <p className="fixed bottom-5 right-5 z-[650] max-w-[360px] rounded-[8px] border border-[#b04a3a]/25 bg-[var(--surface)] px-3 py-2 text-[12px] text-[#8f3f33] shadow-strong">
          {errorMessage}
        </p>
      ) : null}
    </>
  )
}
