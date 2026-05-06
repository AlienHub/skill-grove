import { useMemo } from 'react'
import { AgentIcon } from '../../skill-manager/agentInfo'
import { isRealSkillSource } from '../../skill-manager/skillGrouping'
import { type Skill } from '../../skill-manager/types'
import { DefinitionTable } from './DefinitionTable'

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
    { label: '来源类型', value: isSoftLinkSource ? '软链接' : '真实文件' },
    { label: '扫描目录', value: skill.sourceDirectory },
    { label: 'Skill 目录', value: skill.skillDirectory },
    { label: '相对位置', value: skill.location },
    ...(isSoftLinkSource
      ? [{ label: '真实位置', value: skill.resolvedSkillDirectory }]
      : []),
    { label: '内容指纹', value: skill.contentHash },
  ]
}

export function SkillMetadataTable({ skill }: { skill: Skill }) {
  const rows = useMemo(() => buildMetadataRows(skill), [skill])

  return <DefinitionTable rows={rows} />
}

export function SkillSourceTable({ skill }: { skill: Skill }) {
  const rows = useMemo(() => buildSourceRows(skill), [skill])

  return <DefinitionTable rows={rows} />
}
