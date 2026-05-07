import { useEffect, useRef, useState } from 'react'
import { AgentIcon } from '../../skill-manager/agentInfo'
import { displayAgentName } from '../../skill-manager/display'
import { useAppPreferences } from '../../skill-manager/preferences'
import { isRealSkillSource } from '../../skill-manager/skillGrouping'
import { type Skill, type SkillGroup } from '../../skill-manager/types'

function getVariantLabel(index: number, t: ReturnType<typeof useAppPreferences>['t']) {
  if (index >= 0 && index < 26) {
    return t('source.variantLabel', { label: String.fromCharCode(65 + index) })
  }

  return t('source.variantNumber', { number: index + 1 })
}

function getSourcePath(skill: Skill) {
  return skill.skillDirectory
}

function sortSources(left: Skill, right: Skill, selectedSkillId: string, locale: string) {
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

  const agentCompare = left.agentName.localeCompare(right.agentName, locale)
  if (agentCompare !== 0) {
    return agentCompare
  }

  return getSourcePath(left).localeCompare(getSourcePath(right), locale)
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
  t,
}: {
  sources: Skill[]
  totalSourceCount: number
  t: ReturnType<typeof useAppPreferences>['t']
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
          className="inline-flex max-w-[140px] items-center gap-1.5 rounded-full bg-[var(--surface-muted)] px-2 py-1 text-[11px] font-medium text-foreground/56"
          key={skill.id}
          title={getSourcePath(skill)}
        >
          <AgentIcon
            agentIcon={skill.agentIcon}
            agentId={skill.agentId}
            agentName={skill.agentName}
            size={12}
          />
          <span className="truncate">{displayAgentName(skill.agentId, skill.agentName, t)}</span>
        </span>
      ))}
      {hiddenSourceCount > 0 ? (
        <span className="inline-flex rounded-full bg-[var(--surface-muted)] px-2 py-1 text-[11px] font-medium text-foreground/44">
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
  const { language, t } = useAppPreferences()
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
    label: getVariantLabel(index, t),
    sources: [...variant.skills].sort((left, right) => sortSources(left, right, selectedSkill.id, language)),
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
      ? t('source.variantSummary', {
          variantCount: group.variantCount,
          sourceCount: group.sourceCount,
        })
      : group.sourceCount > 1
        ? t('source.sourceSummary', { sourceCount: group.sourceCount })
        : t('source.singleSource')
  const sourceHint =
    group.variantCount > 1
      ? t('source.variantHint')
      : group.sourceCount > 1
        ? t('source.syncedHint')
        : t('source.singleHint')
  const selectedVariantLabel = selectedVariantIndex >= 0 ? getVariantLabel(selectedVariantIndex, t) : getVariantLabel(0, t)
  const selectedAgentName = displayAgentName(selectedSkill.agentId, selectedSkill.agentName, t)
  const selectedSourceTitle = selectedVariant
    ? t('source.currentSourceTitle', {
        variantLabel: selectedVariantLabel,
        agentName: selectedAgentName,
      })
    : t('source.currentSource', { agentName: selectedAgentName })

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
                className="flex h-8 cursor-pointer overflow-hidden rounded-[8px] border border-border/50 bg-[var(--surface)] text-[12px] font-medium text-foreground/68 shadow-minimal-flat transition-colors hover:text-foreground"
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
                  <span className="max-w-[150px] truncate">
                    {t('source.currentSource', { agentName: selectedAgentName })}
                  </span>
                </span>
                <span className="flex w-7 items-center justify-center border-l border-border/45 text-foreground/42">
                  <ChevronDownIcon size={13} />
                </span>
              </button>
            {isExpanded ? (
              <div className="absolute right-0 top-[calc(100%+6px)] z-[850] w-[460px] max-w-[calc(100vw-3rem)] overflow-hidden rounded-[8px] border border-border/50 bg-[var(--surface)] shadow-strong">
                <div className="border-b border-border/50 p-2">
                  <input
                    className="h-8 w-full rounded-[8px] border border-border/50 bg-[var(--surface-muted)] px-3 text-[12px] text-foreground outline-none placeholder:text-foreground/35 focus:border-foreground/18"
                    onChange={(event) => setSourceSearchQuery(event.target.value)}
                    placeholder={t('source.searchPlaceholder')}
                    type="search"
                    value={sourceSearchQuery}
                  />
                </div>
                <div className="max-h-[280px] overflow-y-auto">
                  {filteredVariantGroups.length === 0 ? (
                    <div className="px-3 py-4 text-[12px] text-foreground/52">{t('source.noMatches')}</div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {filteredVariantGroups.map(({ label, sources, variant }) => {
                        const isCurrentVariant = variant.id === selectedVariant?.id

                        return (
                          <section key={variant.id}>
                            <div className="bg-[var(--surface-muted)] px-3 py-2">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-[11px] font-semibold text-foreground/52">
                                  {label} · {t('source.sourcesCount', { count: variant.skills.length })}
                                </p>
                                {isCurrentVariant ? (
                                  <span className="text-[10px] font-medium text-accent">{t('source.currentContent')}</span>
                                ) : null}
                              </div>
                            </div>
                            <ul>
                              {sources.map((skill) => {
                                const isSelected = skill.id === selectedSkill.id
                                const sourceType = isRealSkillSource(skill) ? null : t('source.softLink')
                                const sourcePath = getSourcePath(skill)

                                return (
                                  <li
                                    className={`transition-colors ${
                                      isSelected
                                        ? 'bg-[color-mix(in_srgb,var(--accent)_8%,var(--surface))]'
                                        : 'hover:bg-[var(--surface-muted)]'
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
                                      <div className="flex size-7 shrink-0 items-center justify-center rounded-[7px] border border-border/45 bg-[var(--surface)]">
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
                                            {displayAgentName(skill.agentId, skill.agentName, t)}
                                          </span>
                                          {sourceType ? (
                                            <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-medium text-foreground/52">
                                              {sourceType}
                                            </span>
                                          ) : null}
                                        </div>
                                        <p className="mt-0.5 truncate text-[12px] text-foreground/45">{sourcePath}</p>
                                      </div>
                                      {isSelected ? (
                                        <span className="shrink-0 text-[11px] font-medium text-accent">{t('source.current')}</span>
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
        <div className="rounded-[8px] border border-border/50 bg-[var(--surface)] p-3">
          <div className={`grid gap-2 ${variantGroups.length > 1 ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
            {variantGroups.map(({ index, label, sources, variant }) => {
              const isCurrentVariant = variant.id === selectedVariant?.id

              return (
                <div
                  className={`rounded-[8px] border px-3 py-2 ${
                    isCurrentVariant
                      ? 'border-[color-mix(in_srgb,var(--accent)_22%,var(--surface))] bg-[color-mix(in_srgb,var(--accent)_5%,var(--surface))]'
                      : 'border-border/45 bg-[var(--surface-muted)]'
                  }`}
                  key={variant.id}
                >
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <p className="truncate text-[12px] font-medium text-foreground/76">
                      {label} · {t('source.sourcesCount', { count: variant.skills.length })}
                    </p>
                    {isCurrentVariant ? (
                      <span className="shrink-0 text-[11px] font-medium text-accent">{t('source.currentContent')}</span>
                    ) : null}
                  </div>
                  <VariantAgentPreview sources={sources} totalSourceCount={group.sourceCount} t={t} />
                  {group.sourceCount > 12 && index === 0 ? (
                    <p className="mt-1.5 text-[11px] text-foreground/36">{t('source.manySourcesHint')}</p>
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
