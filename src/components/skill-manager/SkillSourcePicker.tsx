import { useEffect, useRef, useState } from 'react'
import { AgentIcon } from '../../skill-manager/agentInfo'
import { getVisibleSourceTypeLabel, isRealSkillSource } from '../../skill-manager/skillGrouping'
import { type Skill, type SkillGroup } from '../../skill-manager/types'

function getVariantLabel(index: number) {
  if (index >= 0 && index < 26) {
    return `版本 ${String.fromCharCode(65 + index)}`
  }

  return `版本 ${index + 1}`
}

function getSourcePath(skill: Skill) {
  return skill.skillDirectory
}

function sortSources(left: Skill, right: Skill, selectedSkillId: string) {
  if (left.id === selectedSkillId) {
    return -1
  }

  if (right.id === selectedSkillId) {
    return 1
  }

  const leftIsReal = isRealSkillSource(left)
  const rightIsReal = isRealSkillSource(right)
  if (leftIsReal !== rightIsReal) {
    return leftIsReal ? -1 : 1
  }

  const agentCompare = left.agentName.localeCompare(right.agentName, 'zh-CN')
  if (agentCompare !== 0) {
    return agentCompare
  }

  return getSourcePath(left).localeCompare(getSourcePath(right), 'zh-CN')
}

function sourceMatchesQuery(skill: Skill, query: string) {
  if (!query) {
    return true
  }

  return `${skill.agentName} ${skill.sourceDirectory} ${skill.skillDirectory} ${skill.location}`
    .toLowerCase()
    .includes(query)
}

function ChevronDownIcon({ size }: { size: number }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path d="m7 10 5 5 5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  )
}

function VariantAgentPreview({
  sources,
  totalSourceCount,
}: {
  sources: Skill[]
  totalSourceCount: number
}) {
  const previewLimit = totalSourceCount > 12 ? 0 : totalSourceCount > 5 ? 4 : 5
  const visibleSources = previewLimit > 0 ? sources.slice(0, previewLimit) : []
  const hiddenSourceCount = sources.length - visibleSources.length

  if (visibleSources.length === 0) {
    return null
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {visibleSources.map((skill) => (
        <span
          className="inline-flex max-w-[140px] items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--foreground)_3%,white)] px-2 py-1 text-[11px] font-medium text-foreground/56"
          key={skill.id}
          title={getSourcePath(skill)}
        >
          <AgentIcon
            agentIcon={skill.agentIcon}
            agentId={skill.agentId}
            agentName={skill.agentName}
            size={12}
          />
          <span className="truncate">{skill.agentName}</span>
        </span>
      ))}
      {hiddenSourceCount > 0 ? (
        <span className="inline-flex rounded-full bg-[color-mix(in_srgb,var(--foreground)_3%,white)] px-2 py-1 text-[11px] font-medium text-foreground/44">
          +{hiddenSourceCount}
        </span>
      ) : null}
    </div>
  )
}

export function SkillSourcePicker({
  group,
  selectedSkill,
  onSelectSkill,
}: {
  group: SkillGroup
  selectedSkill: Skill
  onSelectSkill: (skillId: string) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [sourceSearchQuery, setSourceSearchQuery] = useState('')
  const pickerRef = useRef<HTMLDivElement>(null)

  const selectedVariantIndex = group.variants.findIndex((variant) =>
    variant.skills.some((skill) => skill.id === selectedSkill.id)
  )
  const selectedVariant = group.variants[selectedVariantIndex] ?? group.variants[0] ?? null
  const query = sourceSearchQuery.trim().toLowerCase()
  const variantGroups = group.variants.map((variant, index) => ({
    index,
    label: getVariantLabel(index),
    sources: [...variant.skills].sort((left, right) => sortSources(left, right, selectedSkill.id)),
    variant,
  }))
  const filteredVariantGroups = variantGroups
    .map((variantGroup) => ({
      ...variantGroup,
      sources: variantGroup.sources.filter((skill) => sourceMatchesQuery(skill, query)),
    }))
    .filter((variantGroup) => variantGroup.sources.length > 0)
  const sourceSummary =
    group.variantCount > 1
      ? `${group.variantCount} 个内容版本 · ${group.sourceCount} 个来源`
      : group.sourceCount > 1
        ? `${group.sourceCount} 个来源 · 内容一致`
        : '1 个来源'
  const sourceHint =
    group.variantCount > 1
      ? '有几个来源的内容不一致，值得看一眼。'
      : group.sourceCount > 1
        ? '这个 skill 在多个 Agent 中保持同步。'
        : '当前 skill 只有一个来源。'
  const selectedVariantLabel = selectedVariantIndex >= 0 ? getVariantLabel(selectedVariantIndex) : getVariantLabel(0)
  const selectedSourceTitle = selectedVariant
    ? `${selectedVariantLabel} · 当前来源：${selectedSkill.agentName}`
    : `当前来源：${selectedSkill.agentName}`

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
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-foreground/82">{sourceSummary}</p>
          <p className="mt-1 text-[12px] leading-5 text-foreground/48">{sourceHint}</p>
        </div>
        {group.sourceCount > 1 ? (
          <div className="flex shrink-0 items-start">
            <div className="relative">
              <button
                aria-expanded={isExpanded}
                className="flex h-8 cursor-pointer overflow-hidden rounded-[8px] border border-border/50 bg-white text-[12px] font-medium text-foreground/68 shadow-minimal-flat transition-colors hover:text-foreground"
                onClick={() => setIsExpanded((value) => !value)}
                title={selectedSourceTitle}
                type="button"
              >
                <span className="flex min-w-0 items-center gap-2 px-2.5">
                  <AgentIcon
                    agentIcon={selectedSkill.agentIcon}
                    agentId={selectedSkill.agentId}
                    agentName={selectedSkill.agentName}
                    size={14}
                  />
                  <span className="max-w-[150px] truncate">当前来源：{selectedSkill.agentName}</span>
                </span>
                <span className="flex w-7 items-center justify-center border-l border-border/45 text-foreground/42">
                  <ChevronDownIcon size={13} />
                </span>
              </button>
            {isExpanded ? (
              <div className="absolute right-0 top-[calc(100%+6px)] z-[850] w-[460px] max-w-[calc(100vw-3rem)] overflow-hidden rounded-[8px] border border-border/50 bg-white shadow-strong">
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
                  {filteredVariantGroups.length === 0 ? (
                    <div className="px-3 py-4 text-[12px] text-foreground/52">没有匹配的来源。</div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {filteredVariantGroups.map(({ label, sources, variant }) => {
                        const isCurrentVariant = variant.id === selectedVariant?.id

                        return (
                          <section key={variant.id}>
                            <div className="bg-[color-mix(in_srgb,var(--foreground)_1.5%,white)] px-3 py-2">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-[11px] font-semibold text-foreground/52">
                                  {label} · {variant.skills.length} 个来源
                                </p>
                                {isCurrentVariant ? (
                                  <span className="text-[10px] font-medium text-accent">当前内容</span>
                                ) : null}
                              </div>
                            </div>
                            <ul>
                              {sources.map((skill) => {
                                const isSelected = skill.id === selectedSkill.id
                                const sourceType = getVisibleSourceTypeLabel(skill)
                                const sourcePath = getSourcePath(skill)

                                return (
                                  <li
                                    className={`transition-colors ${
                                      isSelected
                                        ? 'bg-[color-mix(in_srgb,var(--accent)_8%,white)]'
                                        : 'hover:bg-[color-mix(in_srgb,var(--foreground)_2%,white)]'
                                    }`}
                                    key={skill.id}
                                  >
                                    <button
                                      aria-pressed={isSelected}
                                      className="flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left"
                                      onClick={() => {
                                        onSelectSkill(skill.id)
                                        setIsExpanded(false)
                                        setSourceSearchQuery('')
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
                                          {sourceType ? (
                                            <span className="rounded-full bg-[color-mix(in_srgb,var(--foreground)_4%,white)] px-2 py-0.5 text-[10px] font-medium text-foreground/52">
                                              {sourceType}
                                            </span>
                                          ) : null}
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
                          </section>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {group.sourceCount > 1 ? (
        <div className="rounded-[8px] border border-border/50 bg-white p-3">
          <div className={`grid gap-2 ${variantGroups.length > 1 ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
            {variantGroups.map(({ index, label, sources, variant }) => {
              const isCurrentVariant = variant.id === selectedVariant?.id

              return (
                <div
                  className={`rounded-[8px] border px-3 py-2 ${
                    isCurrentVariant
                      ? 'border-[color-mix(in_srgb,var(--accent)_22%,white)] bg-[color-mix(in_srgb,var(--accent)_5%,white)]'
                      : 'border-border/45 bg-[color-mix(in_srgb,var(--foreground)_1.2%,white)]'
                  }`}
                  key={variant.id}
                >
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <p className="truncate text-[12px] font-medium text-foreground/76">
                      {label} · {variant.skills.length} 个来源
                    </p>
                    {isCurrentVariant ? (
                      <span className="shrink-0 text-[11px] font-medium text-accent">当前内容</span>
                    ) : null}
                  </div>
                  <VariantAgentPreview sources={sources} totalSourceCount={group.sourceCount} />
                  {group.sourceCount > 12 && index === 0 ? (
                    <p className="mt-1.5 text-[11px] text-foreground/36">来源较多，完整列表可在来源菜单中查看。</p>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
