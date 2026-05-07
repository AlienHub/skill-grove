import { useMemo } from 'react'
import { AgentIcon } from '../../skill-manager/agentInfo'
import { displayAgentName } from '../../skill-manager/display'
import { useAppPreferences } from '../../skill-manager/preferences'
import { isRealSkillSource } from '../../skill-manager/skillGrouping'
import { type DirectoryOpenTarget, type Skill } from '../../skill-manager/types'
import { DefinitionTable } from './DefinitionTable'
import { SkillSourceActions, SkillSourceRemoveButton } from './SkillSourceActions'

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
  openDirectoryTargets,
  skill,
  sourceCount,
  onRemoveSource,
}: {
  openDirectoryTargets: DirectoryOpenTarget[]
  skill: Skill
  sourceCount: number
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
