import { type ComponentType, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import AmpIcon from '@lobehub/icons/es/Amp/components/Color'
import AntigravityIcon from '@lobehub/icons/es/Antigravity/components/Color'
import ClaudeCodeIcon from '@lobehub/icons/es/ClaudeCode/components/Color'
import CodexIcon from '@lobehub/icons/es/Codex/components/Color'
import CursorIcon from '@lobehub/icons/es/Cursor/components/Mono'
import GeminiCLIIcon from '@lobehub/icons/es/GeminiCLI/components/Color'
import GithubCopilotIcon from '@lobehub/icons/es/GithubCopilot/components/Mono'
import GooseIcon from '@lobehub/icons/es/Goose/components/Mono'
import HermesAgentIcon from '@lobehub/icons/es/HermesAgent/components/Mono'
import JunieIcon from '@lobehub/icons/es/Junie/components/Color'
import KiloCodeIcon from '@lobehub/icons/es/KiloCode/components/Mono'
import KimiIcon from '@lobehub/icons/es/Kimi/components/Color'
import OpenClawIcon from '@lobehub/icons/es/OpenClaw/components/Color'
import OpenHandsIcon from '@lobehub/icons/es/OpenHands/components/Color'
import QoderIcon from '@lobehub/icons/es/Qoder/components/Color'
import QwenIcon from '@lobehub/icons/es/Qwen/components/Color'
import ReplitIcon from '@lobehub/icons/es/Replit/components/Color'
import RooCodeIcon from '@lobehub/icons/es/RooCode/components/Mono'
import TraeIcon from '@lobehub/icons/es/Trae/components/Color'
import WindsurfIcon from '@lobehub/icons/es/Windsurf/components/Mono'
import ZencoderIcon from '@lobehub/icons/es/Zencoder/components/Color'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  initialSkillManagerState,
  skillManagerApiBase,
} from 'virtual:skill-manager-state'

type SkillManagerState = typeof initialSkillManagerState
type Skill = SkillManagerState['skills'][number]
type SourceIcon = SkillManagerState['sourceIcons'][string]
type AgentInfo = {
  agentId: string
  agentName: string
}
type SkillVariant = {
  id: string
  skills: Skill[]
  primarySkill: Skill
  relationship: 'single' | 'symlink' | 'same-content'
  resolvedSkillDirectory: string
  hasRealSource: boolean
  realFileCount: number
  softLinkCount: number
}
type SkillGroup = {
  id: string
  name: string
  description: string
  location: string
  primarySkill: Skill
  skills: Skill[]
  variants: SkillVariant[]
  sourceCount: number
  variantCount: number
}
type DefinitionRow = {
  label: string
  value: ReactNode
}

const AGENT_DIRECTORY_MARKERS: Array<AgentInfo & { marker: string }> = [
  { marker: '/.codex/superpowers/skills', agentId: 'codex', agentName: 'Codex' },
  { marker: '/.gemini/antigravity/skills', agentId: 'antigravity', agentName: 'Antigravity' },
  { marker: '/.config/opencode/skills', agentId: 'opencode', agentName: 'OpenCode' },
  { marker: '/.config/agents/skills', agentId: 'amp', agentName: 'Amp' },
  { marker: '/.config/goose/skills', agentId: 'goose', agentName: 'Goose' },
  { marker: '/.config/crush/skills', agentId: 'crush', agentName: 'Crush' },
  { marker: '/.agents/skills', agentId: 'agents', agentName: 'Agents' },
  { marker: '/.codex/skills', agentId: 'codex', agentName: 'Codex' },
  { marker: '/.claude/skills', agentId: 'claude', agentName: 'Claude' },
  { marker: '/.cursor/skills', agentId: 'cursor', agentName: 'Cursor' },
  { marker: '/.continue/skills', agentId: 'continue', agentName: 'Continue' },
  { marker: '/.gemini/skills', agentId: 'gemini', agentName: 'Gemini' },
  { marker: '/.opencode/skills', agentId: 'opencode', agentName: 'OpenCode' },
  { marker: '/.eagleclaw/skills', agentId: 'eagleclaw', agentName: 'EagleClaw' },
  { marker: '/.hermes/skills', agentId: 'hermes', agentName: 'Hermes' },
  { marker: '/.kilocode/skills', agentId: 'kilo_code', agentName: 'Kilo Code' },
  { marker: '/.roo/skills', agentId: 'roo_code', agentName: 'Roo Code' },
  { marker: '/.copilot/skills', agentId: 'github_copilot', agentName: 'GitHub Copilot' },
  { marker: '/.openclaw/skills', agentId: 'openclaw', agentName: 'OpenClaw' },
  { marker: '/.factory/skills', agentId: 'droid', agentName: 'Droid' },
  { marker: '/.codeium/windsurf/skills', agentId: 'windsurf', agentName: 'Windsurf' },
  { marker: '/.trae-cn/skills', agentId: 'trae_cn', agentName: 'TRAE CN' },
  { marker: '/.trae/skills', agentId: 'trae', agentName: 'TRAE IDE' },
  { marker: '/.deepagents/agent/skills', agentId: 'deepagents', agentName: 'Deep Agents' },
  { marker: '/.firebender/skills', agentId: 'firebender', agentName: 'Firebender' },
  { marker: '/.augment/skills', agentId: 'augment', agentName: 'Augment' },
  { marker: '/.bob/skills', agentId: 'bob', agentName: 'IBM Bob' },
  { marker: '/.codebuddy/skills', agentId: 'codebuddy', agentName: 'CodeBuddy' },
  { marker: '/.commandcode/skills', agentId: 'command_code', agentName: 'Command Code' },
  { marker: '/.snowflake/cortex/skills', agentId: 'cortex', agentName: 'Cortex Code' },
  { marker: '/.iflow/skills', agentId: 'iflow', agentName: 'iFlow CLI' },
  { marker: '/.junie/skills', agentId: 'junie', agentName: 'Junie' },
  { marker: '/.kiro/skills', agentId: 'kiro', agentName: 'Kiro CLI' },
  { marker: '/.kode/skills', agentId: 'kode', agentName: 'Kode' },
  { marker: '/.mcpjam/skills', agentId: 'mcpjam', agentName: 'MCPJam' },
  { marker: '/.vibe/skills', agentId: 'mistral_vibe', agentName: 'Mistral Vibe' },
  { marker: '/.mux/skills', agentId: 'mux', agentName: 'Mux' },
  { marker: '/.neovate/skills', agentId: 'neovate', agentName: 'Neovate' },
  { marker: '/.openhands/skills', agentId: 'openhands', agentName: 'OpenHands' },
  { marker: '/.pi/agent/skills', agentId: 'pi', agentName: 'Pi' },
  { marker: '/.pochi/skills', agentId: 'pochi', agentName: 'Pochi' },
  { marker: '/.qoder/skills', agentId: 'qoder', agentName: 'Qoder' },
  { marker: '/.qwen/skills', agentId: 'qwen_code', agentName: 'Qwen Code' },
  { marker: '/.zencoder/skills', agentId: 'zencoder', agentName: 'Zencoder' },
  { marker: '/.adal/skills', agentId: 'adal', agentName: 'AdaL' },
]

const LOBE_AGENT_ICONS: Record<string, ComponentType<{ className?: string; size?: number | string; title?: string }>> = {
  amp: AmpIcon,
  antigravity: AntigravityIcon,
  claude: ClaudeCodeIcon,
  codex: CodexIcon,
  cursor: CursorIcon,
  gemini: GeminiCLIIcon,
  github_copilot: GithubCopilotIcon,
  goose: GooseIcon,
  hermes: HermesAgentIcon,
  junie: JunieIcon,
  kilo_code: KiloCodeIcon,
  kimi: KimiIcon,
  openclaw: OpenClawIcon,
  openhands: OpenHandsIcon,
  qoder: QoderIcon,
  qwen_code: QwenIcon,
  replit: ReplitIcon,
  roo_code: RooCodeIcon,
  trae: TraeIcon,
  trae_cn: TraeIcon,
  windsurf: WindsurfIcon,
  zencoder: ZencoderIcon,
}

function getAgentInfoFromDirectory(directory: string): AgentInfo {
  const normalizedDirectory = directory.replace(/\\/g, '/')
  const marker = [...AGENT_DIRECTORY_MARKERS]
    .sort((left, right) => right.marker.length - left.marker.length)
    .find((candidate) => normalizedDirectory.includes(candidate.marker))

  if (marker) {
    return {
      agentId: marker.agentId,
      agentName: marker.agentName,
    }
  }

  return {
    agentId: 'unknown',
    agentName: '自定义来源',
  }
}

function LightningIcon({ size }: { size: number }) {
  return (
    <svg
      aria-hidden="true"
      className="shrink-0 text-foreground/64"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path
        d="M13.25 2.75 5.9 13.05a.72.72 0 0 0 .59 1.14h4.06l-.77 7.05 8.32-11.38a.72.72 0 0 0-.58-1.15h-4.33l.06-5.96Z"
        fill="currentColor"
        opacity="0.92"
      />
    </svg>
  )
}

function AgentIcon({
  agentId,
  agentIcon,
  agentName,
  size = 14,
}: AgentInfo & {
  agentIcon?: SourceIcon | null
  size?: number
}) {
  if (agentIcon?.type === 'dataUrl' && agentIcon.value) {
    return (
      <img
        alt=""
        className="shrink-0 object-contain"
        height={size}
        src={agentIcon.value}
        style={{ height: size, width: size }}
        title={agentName}
        width={size}
      />
    )
  }

  const LobeIcon = LOBE_AGENT_ICONS[agentId]
  if (LobeIcon) {
    return <LobeIcon className="shrink-0" size={size} title={agentName} />
  }

  return <LightningIcon size={size} />
}

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

function getSkillIdentity(skill: Skill) {
  return (skill.name || skill.slug || skill.location).trim().toLowerCase()
}

function getSourceTypeLabel(skill: Skill) {
  if (!isRealSkillSource(skill)) {
    return '软链接'
  }

  return '真实文件'
}

function getSkillVariantKey(skill: Skill) {
  return skill.contentHash || skill.resolvedSkillDirectory || skill.skillDirectory || skill.id
}

function isRealSkillSource(skill: Skill) {
  return skill.skillDirectory === skill.resolvedSkillDirectory
}

function getSkillVariantRelationship(skills: Skill[]): SkillVariant['relationship'] {
  const resolvedDirectories = new Set(skills.map((skill) => skill.resolvedSkillDirectory))
  const hasSoftLinkEntry = skills.some((skill) => !isRealSkillSource(skill))

  if (resolvedDirectories.size === 1 && hasSoftLinkEntry) {
    return 'symlink'
  }

  if (skills.length <= 1) {
    return 'single'
  }

  return 'same-content'
}

function getVariantPrimarySkill(skills: Skill[]) {
  return skills.find(isRealSkillSource) ?? skills[0]
}

function describeSkillVariant(variant: SkillVariant) {
  if (variant.relationship === 'symlink') {
    return `软链接引用 · ${variant.skills.length} 个入口`
  }

  if (variant.relationship === 'same-content') {
    if (variant.softLinkCount > 0) {
      return `内容一致 · ${variant.realFileCount} 份文件 · ${variant.softLinkCount} 个软链接`
    }

    return `内容一致 · ${variant.realFileCount} 份文件`
  }

  return '单一来源'
}

function describeSkillGroup(group: SkillGroup) {
  if (group.variantCount > 1) {
    return `${group.variantCount} 个变体 · ${group.sourceCount} 个来源`
  }

  if (group.sourceCount > 1) {
    return describeSkillVariant(group.variants[0] ?? {
      id: group.id,
      skills: group.skills,
      primarySkill: group.primarySkill,
      relationship: 'same-content',
      resolvedSkillDirectory: group.primarySkill.resolvedSkillDirectory,
      hasRealSource: false,
      realFileCount: group.skills.length,
      softLinkCount: 0,
    })
  }

  return group.primarySkill.location
}

function buildSkillGroups(skills: Skill[]) {
  const groups = new Map<string, Skill[]>()

  for (const skill of skills) {
    const identity = getSkillIdentity(skill)
    const current = groups.get(identity) ?? []
    current.push(skill)
    groups.set(identity, current)
  }

  return Array.from(groups.entries())
    .map(([identity, groupSkills]) => {
      const sortedSkills = [...groupSkills].sort((left, right) =>
        `${left.sourceDirectory}/${left.location}`.localeCompare(
          `${right.sourceDirectory}/${right.location}`,
          'zh-CN'
        )
      )
      const firstSkill = sortedSkills[0]
      if (!firstSkill) {
        return null
      }

      const variants = new Map<string, Skill[]>()

      for (const skill of sortedSkills) {
        const variantKey = getSkillVariantKey(skill)
        const current = variants.get(variantKey) ?? []
        current.push(skill)
        variants.set(variantKey, current)
      }

      const sortedVariants = Array.from(variants.entries())
        .map(([variantKey, variantSkills]) => {
          const primarySkill = getVariantPrimarySkill(variantSkills)
          if (!primarySkill) {
            return null
          }
          const relationship = getSkillVariantRelationship(variantSkills)
          const realFileCount = new Set(variantSkills.map((skill) => skill.resolvedSkillDirectory)).size

          return {
            id: `${identity}::${variantKey}`,
            skills: variantSkills,
            primarySkill,
            relationship,
            resolvedSkillDirectory: primarySkill.resolvedSkillDirectory,
            hasRealSource: variantSkills.some(isRealSkillSource),
            realFileCount,
            softLinkCount: variantSkills.filter((skill) => !isRealSkillSource(skill)).length,
          } satisfies SkillVariant
        })
        .filter((variant): variant is SkillVariant => variant !== null)
        .sort((left, right) =>
          left.primarySkill.location.localeCompare(right.primarySkill.location, 'zh-CN')
        )

      const primarySkill = sortedVariants[0]?.primarySkill ?? firstSkill

      return {
        id: identity,
        name: primarySkill.name,
        description: sortedSkills.find((skill) => skill.description)?.description ?? '',
        location: primarySkill.location,
        primarySkill,
        skills: sortedSkills,
        variants: sortedVariants,
        sourceCount: sortedSkills.length,
        variantCount: sortedVariants.length,
      } satisfies SkillGroup
    })
    .filter((group): group is SkillGroup => group !== null)
    .sort((left, right) => {
      if (left.sourceCount !== right.sourceCount) {
        return right.sourceCount - left.sourceCount
      }

      return left.name.localeCompare(right.name, 'zh-CN')
    })
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

function DefinitionTable({ rows }: { rows: DefinitionRow[] }) {
  return (
    <div className="overflow-hidden rounded-[8px] border border-border/50 bg-white">
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

function SkillMetadataTable({ skill }: { skill: Skill }) {
  const rows = useMemo(() => buildMetadataRows(skill), [skill])

  return <DefinitionTable rows={rows} />
}

function SkillSourceTable({ skill }: { skill: Skill }) {
  const rows = useMemo(() => buildSourceRows(skill), [skill])

  return <DefinitionTable rows={rows} />
}

function SkillSourcePicker({
  group,
  selectedSkill,
  onSelectSkill,
}: {
  group: SkillGroup
  selectedSkill: Skill
  onSelectSkill: (skillId: string) => void
}) {
  if (group.sourceCount <= 1) {
    return null
  }

  const [isExpanded, setIsExpanded] = useState(false)
  const [sourceSearchQuery, setSourceSearchQuery] = useState('')
  const pickerRef = useRef<HTMLDivElement>(null)
  const realSourceCount = group.skills.filter(isRealSkillSource).length
  const softLinkSourceCount = group.sourceCount - realSourceCount
  const selectedSourceType = getSourceTypeLabel(selectedSkill)
  const sortedSources = [...group.skills].sort((left, right) => {
    const leftIsReal = isRealSkillSource(left)
    const rightIsReal = isRealSkillSource(right)
    if (leftIsReal !== rightIsReal) {
      return leftIsReal ? -1 : 1
    }

    const agentCompare = left.agentName.localeCompare(right.agentName, 'zh-CN')
    if (agentCompare !== 0) {
      return agentCompare
    }

    return `${left.sourceDirectory}/${left.location}`.localeCompare(
      `${right.sourceDirectory}/${right.location}`,
      'zh-CN'
    )
  })
  const filteredSources = sortedSources.filter((skill) => {
    const query = sourceSearchQuery.trim().toLowerCase()
    if (!query) {
      return true
    }

    return `${skill.agentName} ${skill.sourceDirectory} ${skill.skillDirectory} ${skill.location}`
      .toLowerCase()
      .includes(query)
  })

  useEffect(() => {
    if (!isExpanded) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        pickerRef.current &&
        !pickerRef.current.contains(event.target)
      ) {
        setIsExpanded(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExpanded(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isExpanded])

  return (
    <div className="relative" ref={pickerRef}>
      <div className="flex items-center justify-between gap-3 rounded-[8px] border border-border/50 bg-white px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-[7px] border border-border/45 bg-[color-mix(in_srgb,var(--foreground)_2%,white)]">
            <AgentIcon
              agentIcon={selectedSkill.agentIcon}
              agentId={selectedSkill.agentId}
              agentName={selectedSkill.agentName}
              size={14}
            />
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-[12px] font-medium text-foreground/84">
                {selectedSkill.agentName}
              </span>
              <span className="rounded-full bg-[color-mix(in_srgb,var(--foreground)_4%,white)] px-2 py-0.5 text-[10px] font-medium text-foreground/52">
                {selectedSourceType}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[12px] text-foreground/48">
              {realSourceCount} 个真实文件 · {softLinkSourceCount} 个软链接 · 当前 {group.sourceCount} 个来源
            </p>
          </div>
        </div>
        <button
          aria-expanded={isExpanded}
          className="shrink-0 cursor-pointer rounded-[8px] border border-border/50 bg-[color-mix(in_srgb,var(--foreground)_1.5%,white)] px-3 py-1.5 text-[12px] font-medium text-foreground/68 transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_4%,white)] hover:text-foreground"
          onClick={() => setIsExpanded((value) => !value)}
          type="button"
        >
          选择来源
        </button>
      </div>

      {isExpanded ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-[8px] border border-border/50 bg-white shadow-strong">
          <div className="border-b border-border/50 p-2">
            <input
              className="h-8 w-full rounded-[8px] border border-border/50 bg-[color-mix(in_srgb,var(--foreground)_2%,white)] px-3 text-[12px] text-foreground outline-none placeholder:text-foreground/35 focus:border-foreground/18"
              onChange={(event) => setSourceSearchQuery(event.target.value)}
              placeholder="搜索 Agent 或路径"
              type="search"
              value={sourceSearchQuery}
            />
          </div>
          <div className="max-h-[280px] overflow-y-auto">
            {filteredSources.length === 0 ? (
              <div className="px-3 py-4 text-[12px] text-foreground/52">没有匹配的来源。</div>
            ) : (
              <ul className="divide-y divide-border/50">
                {filteredSources.map((skill) => {
                  const isSelected = skill.id === selectedSkill.id
                  const sourceType = getSourceTypeLabel(skill)
                  const sourcePath = isRealSkillSource(skill)
                    ? skill.sourceDirectory
                    : skill.skillDirectory

                  return (
                    <li key={skill.id}>
                      <button
                        aria-pressed={isSelected}
                        className={`flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left transition-colors ${
                          isSelected
                            ? 'bg-[color-mix(in_srgb,var(--accent)_8%,white)]'
                            : 'hover:bg-[color-mix(in_srgb,var(--foreground)_2%,white)]'
                        }`}
                        onClick={() => {
                          onSelectSkill(skill.id)
                          setIsExpanded(false)
                        }}
                        title={skill.skillDirectory}
                        type="button"
                      >
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-[7px] border border-border/45 bg-white">
                          <AgentIcon
                            agentIcon={skill.agentIcon}
                            agentId={skill.agentId}
                            agentName={skill.agentName}
                            size={14}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="truncate text-[12px] font-medium text-foreground/84">
                              {skill.agentName}
                            </span>
                            <span className="rounded-full bg-[color-mix(in_srgb,var(--foreground)_4%,white)] px-2 py-0.5 text-[10px] font-medium text-foreground/52">
                              {sourceType}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-[12px] text-foreground/45">{sourcePath}</p>
                        </div>
                        {isSelected ? (
                          <span className="shrink-0 text-[11px] font-medium text-accent">当前</span>
                        ) : null}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function SkillInstructions({ content }: { content: string }) {
  if (!content.trim()) {
    return (
      <div className="rounded-[8px] border border-border/50 bg-white px-5 py-6 text-[12px] text-foreground/56 shadow-minimal-flat">
        暂无说明内容。
      </div>
    )
  }

  return (
    <div className="rounded-[8px] border border-border/50 bg-white px-5 py-5 shadow-minimal-flat">
      <article className="prose max-w-none text-[14px] leading-6 text-foreground/84 prose-headings:text-[14px] prose-headings:font-semibold prose-headings:text-foreground prose-p:text-[14px] prose-p:text-foreground/84 prose-li:text-[14px] prose-li:text-foreground/84 prose-strong:text-foreground prose-code:text-[13px] prose-code:text-foreground prose-pre:overflow-x-auto prose-pre:rounded-[8px] prose-pre:bg-[#f6f6f7]">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>
    </div>
  )
}

async function fetchSkillManagerState() {
  if ('__TAURI_INTERNALS__' in window) {
    return await invoke<SkillManagerState>('load_skill_manager_state')
  }

  const response = await fetch(`${skillManagerApiBase}/state`)
  if (!response.ok) {
    throw new Error('Failed to load skill manager state')
  }

  return (await response.json()) as SkillManagerState
}

async function saveConfiguredDirectories(directories: string[]) {
  if ('__TAURI_INTERNALS__' in window) {
    return await invoke<SkillManagerState>('save_configured_directories', { directories })
  }

  const response = await fetch(`${skillManagerApiBase}/directories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ directories }),
  })

  if (!response.ok) {
    throw new Error('Failed to update configured directories')
  }

  return (await response.json()) as SkillManagerState
}

async function saveSourceIcon(directory: string, icon: SourceIcon | null) {
  if ('__TAURI_INTERNALS__' in window) {
    return await invoke<SkillManagerState>('save_source_icon', { directory, icon })
  }

  const response = await fetch(`${skillManagerApiBase}/source-icon`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ directory, icon }),
  })

  if (!response.ok) {
    throw new Error('Failed to update source icon')
  }

  return (await response.json()) as SkillManagerState
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolvePromise, rejectPromise) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolvePromise(reader.result)
        return
      }

      rejectPromise(new Error('Failed to read icon file'))
    }
    reader.onerror = () => rejectPromise(reader.error ?? new Error('Failed to read icon file'))
    reader.readAsDataURL(file)
  })
}

function normalizeSelectedDirectoryPath(path: string, webkitRelativePath?: string) {
  if (!path) {
    return ''
  }

  if (!webkitRelativePath) {
    return path
  }

  const normalizedFilePath = path.replace(/\\/g, '/')
  const normalizedRelativePath = webkitRelativePath.replace(/\\/g, '/')
  const rootDirectoryName = normalizedRelativePath.split('/')[0]
  if (!rootDirectoryName) {
    return path
  }

  const marker = `/${rootDirectoryName}/`
  const markerIndex = normalizedFilePath.indexOf(marker)

  if (markerIndex === -1) {
    return path
  }

  return normalizedFilePath.slice(0, markerIndex + rootDirectoryName.length + 1)
}

function SkillDirectoryConfig({
  configuredDirectories,
  skillCount,
  sourceIcons,
  inputDisabled,
  feedbackMessage,
  onRemoveDirectory,
  onRefresh,
  onSaveSourceIcon,
  onSelectDirectory,
  onSetFeedbackMessage,
}: {
  configuredDirectories: string[]
  skillCount: number
  sourceIcons: Record<string, SourceIcon>
  inputDisabled: boolean
  feedbackMessage: string | null
  onRemoveDirectory: (directory: string) => void
  onRefresh: () => void
  onSaveSourceIcon: (directory: string, icon: SourceIcon | null) => void
  onSelectDirectory: (directory: string) => void
  onSetFeedbackMessage: (message: string) => void
}) {
  const directoryInputRef = useRef<HTMLInputElement>(null)
  const iconInputRef = useRef<HTMLInputElement>(null)
  const [selectedIconDirectory, setSelectedIconDirectory] = useState<string | null>(null)
  const scanButtonLabel = inputDisabled ? '扫描中…' : '重新扫描'
  const chooseButtonLabel = inputDisabled ? '处理中…' : '选择文件夹'

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
      onSetFeedbackMessage('图标仅支持 PNG 或 SVG 文件。')
      return
    }

    void readFileAsDataUrl(selectedFile).then((value) => {
      onSaveSourceIcon(directory, { type: 'dataUrl', value })
      setSelectedIconDirectory(null)
    }).catch(() => {
      onSetFeedbackMessage('读取图标失败，请重新选择 PNG 或 SVG 文件。')
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
            <h3 className="text-[14px] font-semibold text-foreground">扫描目录</h3>
            <p className="mt-1 text-[12px] text-foreground/52">
              管理需要扫描的 skill 根目录，当前发现 {skillCount} 个 skill
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              className="cursor-pointer rounded-[8px] bg-foreground px-3 py-2 text-[12px] font-medium text-background transition-opacity hover:opacity-88 disabled:cursor-not-allowed disabled:opacity-45"
              disabled={inputDisabled}
              onClick={handleChooseDirectory}
              type="button"
            >
              {chooseButtonLabel}
            </button>
            <button
              className="cursor-pointer rounded-[8px] border border-border/50 bg-white px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:text-foreground/35"
              disabled={inputDisabled}
              onClick={onRefresh}
              type="button"
            >
              {scanButtonLabel}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {configuredDirectories.length === 0 ? (
            <div className="rounded-[8px] border border-border/50 bg-white px-4 py-3 text-[12px] text-foreground/52 shadow-minimal-flat">
              暂无扫描目录，请先选择一个文件夹。
            </div>
          ) : (
            configuredDirectories.map((directory) => {
              const agentInfo = getAgentInfoFromDirectory(directory)
              const sourceIcon = sourceIcons[directory]

              return (
                <div
                  className="flex items-center gap-3 rounded-[8px] border border-border/50 bg-white px-4 py-3 shadow-minimal-flat"
                  key={directory}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-[7px] border border-border/45 bg-[color-mix(in_srgb,var(--foreground)_2%,white)]">
                      <AgentIcon
                        agentIcon={sourceIcon}
                        agentId={agentInfo.agentId}
                        agentName={agentInfo.agentName}
                        size={14}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] font-medium text-foreground/82">{agentInfo.agentName}</div>
                      <div className="mt-0.5 truncate text-[12px] text-foreground/52">{directory}</div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      className="cursor-pointer text-[12px] text-foreground/45 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:text-foreground/30"
                      disabled={inputDisabled}
                      onClick={() => handleChooseIcon(directory)}
                      type="button"
                    >
                      更换图标
                    </button>
                    {sourceIcon ? (
                      <button
                        className="cursor-pointer text-[12px] text-foreground/45 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:text-foreground/30"
                        disabled={inputDisabled}
                        onClick={() => onSaveSourceIcon(directory, null)}
                        type="button"
                      >
                        重置
                      </button>
                    ) : null}
                    <button
                      className="cursor-pointer text-[12px] text-foreground/45 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:text-foreground/30"
                      disabled={inputDisabled}
                      onClick={() => onRemoveDirectory(directory)}
                      type="button"
                    >
                      删除
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {feedbackMessage ? <p className="mt-3 text-[12px] text-foreground/52">{feedbackMessage}</p> : null}
      </section>
    </div>
  )
}

function SettingsEntry({
  isSelected,
  onClick,
}: {
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      className="w-full cursor-pointer text-left"
      onClick={onClick}
      type="button"
    >
      <div
        className={`rounded-[8px] px-4 py-3 transition-colors ${
          isSelected
            ? 'bg-[color-mix(in_srgb,var(--foreground)_3%,var(--background))]'
            : 'bg-transparent hover:bg-[color-mix(in_srgb,var(--foreground)_1.5%,var(--background))]'
        }`}
      >
        <div className="flex items-center gap-2">
          <svg
            aria-hidden="true"
            className="size-4 shrink-0 text-foreground/62"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="M10.325 4.317a1.724 1.724 0 0 1 3.35 0 1.724 1.724 0 0 0 2.573 1.066 1.724 1.724 0 0 1 2.898 1.93 1.724 1.724 0 0 0 .75 2.692 1.724 1.724 0 0 1 0 2.99 1.724 1.724 0 0 0-.75 2.692 1.724 1.724 0 0 1-2.898 1.93 1.724 1.724 0 0 0-2.573 1.066 1.724 1.724 0 0 1-3.35 0 1.724 1.724 0 0 0-2.573-1.066 1.724 1.724 0 0 1-2.898-1.93 1.724 1.724 0 0 0-.75-2.692 1.724 1.724 0 0 1 0-2.99 1.724 1.724 0 0 0 .75-2.692 1.724 1.724 0 0 1 2.898-1.93 1.724 1.724 0 0 0 2.573-1.066Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
            <path
              d="M12 15.25A3.25 3.25 0 1 0 12 8.75a3.25 3.25 0 0 0 0 6.5Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
          <h2 className="text-[14px] font-normal text-foreground">设置</h2>
        </div>
      </div>
    </button>
  )
}

export function SkillManagerPage() {
  const [skillState, setSkillState] = useState<SkillManagerState>(initialSkillManagerState)
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(
    initialSkillManagerState.skills[0]?.id ?? null
  )
  const [selectedPanel, setSelectedPanel] = useState<'skill' | 'settings'>('skill')
  const [isSavingDirectories, setIsSavingDirectories] = useState(false)
  const [directoryFeedbackMessage, setDirectoryFeedbackMessage] = useState<string | null>(null)
  const [skillSearchQuery, setSkillSearchQuery] = useState('')

  const skillGroups = useMemo(() => buildSkillGroups(skillState.skills), [skillState.skills])
  const multiSourceGroupCount = useMemo(
    () => skillGroups.filter((group) => group.sourceCount > 1).length,
    [skillGroups]
  )

  useEffect(() => {
    let isMounted = true

    fetchSkillManagerState()
      .then((state) => {
        if (!isMounted) {
          return
        }

        setSkillState(state)
      })
      .catch(() => {
        // Keep build-time fallback state when the API is unavailable.
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (selectedPanel !== 'skill') {
      return
    }

    if (
      !selectedSkillId ||
      !skillGroups.some((group) => group.skills.some((skill) => skill.id === selectedSkillId))
    ) {
      setSelectedSkillId(skillGroups[0]?.primarySkill.id ?? null)
    }
  }, [selectedPanel, selectedSkillId, skillGroups])

  const filteredSkillGroups = useMemo(() => {
    const query = skillSearchQuery.trim().toLowerCase()
    if (!query) {
      return skillGroups
    }

    return skillGroups.filter((group) => {
      const haystack = group.skills
        .map((skill) => `${skill.name} ${skill.slug} ${skill.description} ${skill.location} ${skill.sourceDirectory}`)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [skillGroups, skillSearchQuery])

  const selectedSkillGroup = useMemo(
    () =>
      skillGroups.find((group) => group.skills.some((skill) => skill.id === selectedSkillId)) ??
      skillGroups[0] ??
      null,
    [selectedSkillId, skillGroups]
  )

  const selectedSkill = useMemo(
    () =>
      selectedSkillGroup?.skills.find((skill) => skill.id === selectedSkillId) ??
      selectedSkillGroup?.primarySkill ??
      null,
    [selectedSkillGroup, selectedSkillId]
  )

  const updateDirectories = async (directories: string[]) => {
    setIsSavingDirectories(true)
    try {
      const nextState = await saveConfiguredDirectories(directories)
      const nextGroups = buildSkillGroups(nextState.skills)
      setSkillState(nextState)
      setDirectoryFeedbackMessage(`已重新扫描，发现 ${nextGroups.length} 个 skill，${nextState.skills.length} 个来源。`)
    } finally {
      setIsSavingDirectories(false)
    }
  }

  const handleRefresh = async () => {
    setIsSavingDirectories(true)
    setDirectoryFeedbackMessage(null)
    try {
      const nextState = await fetchSkillManagerState()
      const nextGroups = buildSkillGroups(nextState.skills)
      setSkillState(nextState)
      setDirectoryFeedbackMessage(`扫描完成，发现 ${nextGroups.length} 个 skill，${nextState.skills.length} 个来源。`)
    } finally {
      setIsSavingDirectories(false)
    }
  }

  const handleRemoveDirectory = async (directory: string) => {
    await updateDirectories(
      skillState.configuredDirectories.filter((configuredDirectory) => configuredDirectory !== directory)
    )
  }

  const handleChooseDirectory = async (directory: string) => {
    if (!directory) {
      setDirectoryFeedbackMessage('当前环境没有返回真实文件夹路径，请重新选择文件夹。')
      return
    }

    setDirectoryFeedbackMessage(`已选中文件夹：${directory}`)
    await updateDirectories([...skillState.configuredDirectories, directory])
  }

  const handleSaveSourceIcon = (directory: string, icon: SourceIcon | null) => {
    setIsSavingDirectories(true)
    setDirectoryFeedbackMessage(icon ? '正在更新来源图标…' : '正在重置来源图标…')

    void saveSourceIcon(directory, icon)
      .then((nextState) => {
        setSkillState(nextState)
        setDirectoryFeedbackMessage(icon ? '来源图标已更新。' : '来源图标已重置。')
      })
      .catch(() => {
        setDirectoryFeedbackMessage('来源图标更新失败，请稍后重试。')
      })
      .finally(() => {
        setIsSavingDirectories(false)
      })
  }

  return (
    <div className="h-screen overflow-hidden bg-background text-[14px] text-foreground">
      <main className="mx-auto h-screen max-w-[1440px] px-4 py-5 sm:px-6">
        <div className="grid h-full gap-2 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="flex h-full flex-col overflow-hidden rounded-[8px] bg-white shadow-minimal">
            <div className="border-b border-border/50 px-4 py-4">
              <div className="flex items-end justify-between gap-3">
                <h1 className="text-[14px] font-semibold text-foreground">所有技能</h1>
                <span className="text-[12px] text-foreground/45">
                  {filteredSkillGroups.length === skillGroups.length
                    ? `${skillGroups.length} 个`
                    : `${filteredSkillGroups.length}/${skillGroups.length}`}
                </span>
              </div>
              {multiSourceGroupCount > 0 ? (
                <p className="mt-1 text-[11px] text-foreground/40">
                  {multiSourceGroupCount} 个多来源
                </p>
              ) : null}
              <input
                className="mt-3 h-8 w-full rounded-[8px] border border-border/50 bg-[color-mix(in_srgb,var(--foreground)_2%,white)] px-3 text-[12px] text-foreground outline-none placeholder:text-foreground/35 focus:border-foreground/18"
                onChange={(event) => setSkillSearchQuery(event.target.value)}
                placeholder="搜索名称、描述或路径"
                type="search"
                value={skillSearchQuery}
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {skillGroups.length === 0 ? (
                <div className="px-4 py-6 text-[12px] text-foreground/56">没有在当前目录中发现可用 skill。</div>
              ) : filteredSkillGroups.length === 0 ? (
                <div className="px-4 py-6 text-[12px] text-foreground/56">没有匹配的 skill。</div>
              ) : (
                <ul className="divide-y divide-border/50">
                  {filteredSkillGroups.map((group) => {
                    const isSelected = selectedPanel === 'skill' && group.id === selectedSkillGroup?.id

                    return (
                      <li
                        className={`relative px-3 py-1.5 ${isSelected ? 'before:absolute before:inset-y-1.5 before:left-0 before:w-[2px] before:rounded-full before:bg-[#8d7cff]' : ''}`}
                        key={group.id}
                      >
                        <button
                          className="relative w-full cursor-pointer text-left"
                          onClick={() => {
                            setSelectedPanel('skill')
                            setSelectedSkillId(group.primarySkill.id)
                          }}
                          type="button"
                        >
                          <div
                            className={`rounded-[8px] px-4 py-3 transition-colors ${
                              isSelected
                                ? 'bg-[color-mix(in_srgb,var(--foreground)_3%,var(--background))]'
                                : 'bg-transparent hover:bg-[color-mix(in_srgb,var(--foreground)_1.5%,var(--background))]'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex min-w-0 items-center gap-2">
                                <h2 className="min-w-0 flex-1 truncate text-[14px] font-semibold text-foreground">
                                  {group.name}
                                </h2>
                                {group.sourceCount > 1 ? (
                                  <span className="shrink-0 rounded-full bg-[color-mix(in_srgb,var(--accent)_10%,white)] px-2 py-0.5 text-[10px] font-medium text-accent">
                                    {group.sourceCount} 来源
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 truncate text-[12px] text-foreground/52">
                                {group.description || '—'}
                              </p>
                            </div>
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <div className="p-3 pt-2">
              <div className="relative">
                <SettingsEntry
                  isSelected={selectedPanel === 'settings'}
                  onClick={() => setSelectedPanel('settings')}
                />
              </div>
            </div>
          </aside>

          {selectedPanel === 'settings' ? (
            <section className="overflow-y-auto rounded-[8px] bg-[color-mix(in_srgb,var(--foreground)_1.5%,var(--background))] p-5 shadow-minimal">
              <div className="mb-6">
                <p className="text-[12px] text-foreground/52">settings</p>
              </div>

              <div className="mb-8 rounded-[8px]">
                <div className="min-w-0">
                  <h2 className="text-[14px] font-semibold text-foreground">Skill 扫描设置</h2>
                  <p className="mt-2 text-[14px] leading-7 text-foreground/56">
                    配置需要扫描的 skill 根目录。选择、删除或重新扫描后会立即刷新左侧列表。
                  </p>
                </div>
              </div>

              <SkillDirectoryConfig
                configuredDirectories={skillState.configuredDirectories}
                feedbackMessage={directoryFeedbackMessage}
                inputDisabled={isSavingDirectories}
                sourceIcons={skillState.sourceIcons}
                skillCount={skillGroups.length}
                onRefresh={handleRefresh}
                onRemoveDirectory={handleRemoveDirectory}
                onSaveSourceIcon={handleSaveSourceIcon}
                onSetFeedbackMessage={setDirectoryFeedbackMessage}
                onSelectDirectory={handleChooseDirectory}
              />
            </section>
          ) : selectedSkill && selectedSkillGroup ? (
            <section className="overflow-y-auto rounded-[8px] bg-[color-mix(in_srgb,var(--foreground)_1.5%,var(--background))] p-5 shadow-minimal">
              <div className="mb-6">
                <p className="text-[12px] text-foreground/52">{selectedSkillGroup.location}</p>
              </div>

              <div className="mb-8 rounded-[8px]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[14px] font-semibold text-foreground">{selectedSkillGroup.name}</h2>
                    {selectedSkillGroup.sourceCount > 1 ? (
                      <span className="rounded-full bg-[color-mix(in_srgb,var(--accent)_10%,white)] px-2 py-0.5 text-[10px] font-medium text-accent">
                        {describeSkillGroup(selectedSkillGroup)}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 line-clamp-2 text-[14px] leading-7 text-foreground/56">
                    {selectedSkillGroup.description || selectedSkill.description || '暂无描述。'}
                  </p>
                </div>
              </div>

              <div className="space-y-8">
                <section>
                  <div className="mb-4">
                    <h3 className="text-[14px] font-semibold text-foreground">来源</h3>
                  </div>
                  <SkillSourcePicker
                    group={selectedSkillGroup}
                    selectedSkill={selectedSkill}
                    onSelectSkill={setSelectedSkillId}
                  />
                  <div className={selectedSkillGroup.sourceCount > 1 ? 'mt-3' : undefined}>
                    <SkillSourceTable skill={selectedSkill} />
                  </div>
                </section>

                <section>
                  <div className="mb-4">
                    <h3 className="text-[14px] font-semibold text-foreground">元数据</h3>
                  </div>
                  <SkillMetadataTable skill={selectedSkill} />
                </section>

                <section>
                  <div className="mb-4">
                    <h3 className="text-[14px] font-semibold text-foreground">说明</h3>
                  </div>
                  <SkillInstructions content={selectedSkill.content} />
                </section>
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  )
}
