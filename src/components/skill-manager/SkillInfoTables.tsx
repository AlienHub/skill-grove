import { useMemo } from 'react'
import { AgentIcon } from '../../skill-manager/agentInfo'
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

function formatMetadataLabel(key: string) {
  const labels: Record<string, string> = {
    cli_version: 'CLI 版本',
    license: '许可证',
    version: '版本',
    author: '作者',
    metadata: '附加元数据',
  }

  return labels[key] ?? key
}

function buildMetadataRows(skill: Skill) {
  const reservedKeys = new Set(['name', 'description'])
  const extraRows = Object.entries(skill.metadata)
    .filter(([key]) => !reservedKeys.has(key))
    .map(([key, value]) => ({
      label: formatMetadataLabel(key),
      value: formatValue(value),
    }))

  return [
    { label: '标识符', value: skill.slug },
    { label: '名称', value: skill.name },
    { label: '描述', value: skill.description || '—' },
    ...extraRows,
  ]
}

function buildSourceRows(skill: Skill) {
  const isSoftLinkSource = !isRealSkillSource(skill)
  return [
    {
      label: 'Agent 应用',
      value: (
        <span className="flex min-w-0 items-center gap-1.5">
          <AgentIcon
            agentIcon={skill.agentIcon}
            agentId={skill.agentId}
            agentName={skill.agentName}
            size={14}
          />
          <span className="min-w-0 truncate">{skill.agentName}</span>
        </span>
      ),
    },
    { label: '扫描目录', value: skill.sourceDirectory },
    { label: 'Skill 目录', value: skill.skillDirectory },
    { label: '相对位置', value: skill.location },
    ...(isSoftLinkSource
      ? [
          { label: '来源状态', value: '软链接' },
          { label: '真实位置', value: skill.resolvedSkillDirectory },
        ]
      : []),
    { label: '内容指纹', value: skill.contentHash },
  ]
}

export function SkillMetadataTable({ skill }: { skill: Skill }) {
  const rows = useMemo(() => buildMetadataRows(skill), [skill])

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
  const rows = useMemo(() => buildSourceRows(skill), [skill])

  return (
    <div className="relative z-30 rounded-[8px] border border-border/50 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-border/50 px-3 py-2">
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-foreground/68">当前来源</p>
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
