import { type ReactNode, useEffect, useRef, useState } from 'react'
import { displayAgentName } from '../../skill-manager/display'
import { useAppPreferences } from '../../skill-manager/preferences'
import { changeMessageKeys, changeParams } from '../../skill-manager/libraryPresentation'
import { estimateResidentCatalogTokens } from '../../skill-manager/catalogProfiles'
import { describeSkillVariant } from '../../skill-manager/skillGrouping'
import {
  type DirectoryOpenTarget,
  type LibraryChange,
  type Skill,
  type SkillGroup,
  type SkillUsageSnapshot,
} from '../../skill-manager/types'
import { usageByAgentForGroup } from '../../skill-manager/skillUsageHelpers'
import { SkillMetadataTable, SkillSourceDetails, SkillSourceGovernanceActions } from './SkillInfoTables'
import { SkillInstructions } from './SkillInstructions'
import { SkillSourceActions, SkillSourceRemoveButton } from './SkillSourceActions'
import { CurrentVariantSources, SkillSourcePicker } from './SkillSourcePicker'
import { BodyPortal } from '../ui/BodyPortal'
import { Button } from '@najafi/design-system'

function formatTokenEstimate(tokens: number) {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`
  }

  return String(tokens)
}

function getVariantLabel(index: number, t: ReturnType<typeof useAppPreferences>['t']) {
  if (index >= 0 && index < 26) {
    return t('source.variantLabel', { label: String.fromCharCode(65 + index) })
  }

  return t('source.variantNumber', { number: index + 1 })
}

function DetailSection({
  children,
  summary,
  title,
}: {
  children: ReactNode
  summary: string
  title: string
}) {
  return (
    <div className="py-4">
      <div className="mb-4 min-w-0">
        <p className="text-[13px] font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-[12px] text-foreground/46">{summary}</p>
      </div>
      {children}
    </div>
  )
}

function SkillInsightNotes({
  recentChanges,
}: {
  recentChanges: LibraryChange[]
}) {
  const { t } = useAppPreferences()

  if (!recentChanges.length) {
    return null
  }

  const latestChange = recentChanges[0]
  if (!latestChange) {
    return null
  }
  const remainingCount = recentChanges.length - 1

  return (
    <div className="mt-3 flex w-fit max-w-full items-center gap-2 rounded-full bg-[var(--surface-muted)] px-3 py-1.5 text-[11px] text-foreground/58">
      <span className="shrink-0 font-semibold text-foreground/42">
        {t('changes.title')}
      </span>
      <span className="truncate">
        {t(changeMessageKeys[latestChange.type], changeParams(latestChange))}
      </span>
      {remainingCount > 0 ? (
        <span className="shrink-0 rounded-full bg-[var(--surface)] px-1.5 py-0.5 text-[10px] font-medium text-foreground/44">
          +{remainingCount}
        </span>
      ) : null}
    </div>
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function UsageHelpTooltip({ items, label }: { items: string[]; label: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<{ left: number; top: number; width: number; placement: 'top' | 'bottom' } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeTimerRef = useRef<number | null>(null)

  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const scheduleClose = () => {
    clearCloseTimer()
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false)
    }, 90)
  }

  const open = () => {
    clearCloseTimer()
    setIsOpen(true)
  }

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) {
        return
      }

      const viewportPadding = 12
      const width = Math.min(384, Math.max(220, window.innerWidth - viewportPadding * 2))
      const left = clamp(rect.left, viewportPadding, window.innerWidth - width - viewportPadding)
      const spaceBelow = window.innerHeight - rect.bottom
      const placement = spaceBelow < 180 && rect.top > spaceBelow ? 'top' : 'bottom'
      const top = placement === 'top' ? rect.top - 8 : rect.bottom + 8

      setPosition({ left, placement, top, width })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen])

  useEffect(() => {
    return () => {
      clearCloseTimer()
    }
  }, [])

  return (
    <div className="inline-flex items-center gap-2">
      <button
        aria-expanded={isOpen}
        aria-label={label}
        className="flex size-5 cursor-help items-center justify-center rounded-full border border-border/60 bg-[var(--surface)] text-[12px] font-semibold text-foreground/50 transition-colors hover:border-foreground/20 hover:text-foreground/78 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/35"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            scheduleClose()
          }
        }}
        onFocus={open}
        onMouseEnter={open}
        onMouseLeave={scheduleClose}
        ref={triggerRef}
        type="button"
      >
        ?
      </button>
      {isOpen && position ? (
        <BodyPortal>
          <div
            className="pointer-events-none fixed"
            style={{
              inset: 0,
              zIndex: 'var(--z-tooltip)',
            }}
          >
            <div
              className="pointer-events-auto rounded-[8px] border border-border/60 bg-popover p-3 text-[11px] leading-5 text-popover-foreground shadow-[0_8px_24px_rgba(15,23,42,0.14)]"
              onMouseEnter={open}
              onMouseLeave={scheduleClose}
              style={{
                left: `${position.left}px`,
                maxWidth: 'calc(100vw - 24px)',
                position: 'absolute',
                top: `${position.top}px`,
                transform: position.placement === 'top' ? 'translateY(-100%)' : undefined,
                width: `${position.width}px`,
              }}
            >
              <div className="space-y-2">
                {items.map((item, index) => (
                  <p key={`${item.slice(0, 20)}-${index}`}>{item}</p>
                ))}
              </div>
            </div>
          </div>
        </BodyPortal>
      ) : null}
    </div>
  )
}

function SourceRowMoreMenu({ children }: { children: ReactNode }) {
  const { t } = useAppPreferences()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && menuRef.current?.contains(event.target)) {
        return
      }

      setIsOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-expanded={isOpen}
        className="h-8 cursor-pointer rounded-[8px] border border-border/50 bg-[var(--surface)] px-3 text-[12px] font-medium text-foreground/52 shadow-minimal-flat transition-colors hover:bg-foreground/5 hover:text-foreground"
        onClick={(event) => {
          event.stopPropagation()
          setIsOpen((value) => !value)
        }}
        type="button"
      >
        {t('source.governanceMenu')}
      </button>
      {isOpen ? (
        <div className="absolute right-0 top-[calc(100%+6px)] z-[860] min-w-[180px] rounded-[8px] border border-border/55 bg-[var(--surface)] p-1 shadow-strong">
          <div className="flex flex-col items-stretch">
            {children}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function SkillDetailPanel({
  hasTitlebarInset,
  isPinned,
  openDirectoryTargets,
  primarySkillRepository,
  recentChanges,
  shareTargetDirectories,
  selectedSkill,
  selectedSkillGroup,
  skillUsage,
  usageRefreshing,
  onRefreshUsage,
  onCreateSymlink,
  onConvertToSymlink,
  onExportZip,
  onMigrateToPrimary,
  onRemoveSource,
  onSelectSkill,
  onTogglePinned,
}: {
  hasTitlebarInset: boolean
  isPinned: boolean
  openDirectoryTargets: DirectoryOpenTarget[]
  primarySkillRepository: string
  recentChanges: LibraryChange[]
  shareTargetDirectories: string[]
  selectedSkill: Skill
  selectedSkillGroup: SkillGroup
  skillUsage: SkillUsageSnapshot
  usageRefreshing: boolean
  onRefreshUsage: () => void
  onCreateSymlink: (skill: Skill, targetSourceDirectory: string) => Promise<void>
  onConvertToSymlink: (skill: Skill, targetSkill: Skill) => Promise<void>
  onExportZip: (skill: Skill) => Promise<void>
  onMigrateToPrimary: (skill: Skill) => Promise<void>
  onRemoveSource: (skill: Skill) => Promise<void>
  onSelectSkill: (skillId: string) => void
  onTogglePinned: () => void
}) {
  const { t } = useAppPreferences()
  const catalogTokens = estimateResidentCatalogTokens(selectedSkill)
  const usageRows = usageByAgentForGroup(
    selectedSkillGroup,
    skillUsage.countsBySkillMdPathBySource ?? {},
    skillUsage.countsBySkillMdPath,
  )
  const totalUsageCount = usageRows.reduce((sum, row) => sum + row.count, 0)
  const usageHelpItems = [
    totalUsageCount === 0 ? t('detail.usageEmpty') : null,
    skillUsage.scanNote ? t('detail.usageScanNote', { note: skillUsage.scanNote }) : null,
    t('detail.usageFootnote'),
  ].filter((item): item is string => Boolean(item))
  const lastScanLabel = skillUsage.lastScanAt
    ? (() => {
        const parsed = Date.parse(skillUsage.lastScanAt)
        return Number.isFinite(parsed)
          ? new Date(parsed).toLocaleString()
          : skillUsage.lastScanAt
      })()
    : null
  const detailSummary = t('detail.summary', {
    variantCount: selectedSkillGroup.variantCount || 1,
    sourceCount: selectedSkillGroup.sourceCount,
  })
  const selectedVariantIndex = selectedSkillGroup.variants.findIndex((variant) =>
    variant.skills.some((skill) => skill.id === selectedSkill.id)
  )
  const selectedVariant = selectedSkillGroup.variants[selectedVariantIndex] ?? selectedSkillGroup.variants[0] ?? null
  const selectedVariantLabel = getVariantLabel(selectedVariantIndex >= 0 ? selectedVariantIndex : 0, t)
  const selectedAgentName = displayAgentName(selectedSkill.agentId, selectedSkill.agentName, t)
  const comparisonVariant = selectedSkillGroup.variants.find((variant) => variant.id !== selectedVariant?.id) ?? null
  const comparisonVariantIndex = comparisonVariant
    ? selectedSkillGroup.variants.findIndex((variant) => variant.id === comparisonVariant.id)
    : -1
  const comparisonVariantLabel = comparisonVariantIndex >= 0 ? getVariantLabel(comparisonVariantIndex, t) : null
  const usageAgentCount = usageRows.filter((row) => row.count > 0).length
  const usageSummary = totalUsageCount > 0
    ? t('detail.usageSummary', {
        agentCount: usageAgentCount,
        count: totalUsageCount,
      })
    : t('detail.usageSummaryEmpty')
  const metadataFieldCount =
    3 + Object.keys(selectedSkill.metadata).filter((key) => key !== 'name' && key !== 'description').length
  const metadataSummary = t('detail.metadataSummary', {
    count: metadataFieldCount,
    tokens: formatTokenEstimate(catalogTokens),
  })
  const instructionsSummary = selectedSkill.content.trim()
    ? t('detail.instructionsSummary')
    : t('instructions.empty')
  const differenceItems = selectedVariant
    ? [
        t('detail.diffHashSplit', { count: selectedSkillGroup.variantCount }),
        comparisonVariant && comparisonVariantLabel
          ? t('detail.diffCoverage', {
              currentLabel: selectedVariantLabel,
              currentCount: selectedVariant.skills.length,
              otherLabel: comparisonVariantLabel,
              otherCount: comparisonVariant.skills.length,
            })
          : t('detail.diffCurrentOnly', {
              label: selectedVariantLabel,
              count: selectedVariant.skills.length,
            }),
        comparisonVariant && comparisonVariantLabel
          ? comparisonVariant.skills.length === 1
            ? t('detail.diffSingleAgent', {
                label: comparisonVariantLabel,
                agentName: displayAgentName(
                  comparisonVariant.skills[0]?.agentId ?? 'unknown',
                  comparisonVariant.skills[0]?.agentName ?? t('common.customSource'),
                  t,
                ),
              })
            : t('detail.diffRelationship', {
                label: comparisonVariantLabel,
                summary: describeSkillVariant(comparisonVariant, t),
              })
          : t('detail.diffRelationship', {
              label: selectedVariantLabel,
              summary: describeSkillVariant(selectedVariant, t),
            }),
      ]
    : []

  return (
    <section
      className={`m-2 mb-2 min-h-0 overflow-y-auto rounded-[8px] bg-[var(--surface)] p-5 shadow-minimal ${
        hasTitlebarInset ? 'mt-10' : 'mt-2'
      }`}
    >
      <div className="mb-6 overflow-hidden rounded-[8px] bg-[var(--surface)] shadow-minimal-flat">
        <div className="border-b border-border/45 px-5 py-3">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 className="truncate text-[14px] font-semibold text-foreground">{selectedSkillGroup.name}</h2>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  selectedSkillGroup.variantCount > 1
                    ? 'bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface))] text-accent'
                    : 'bg-[var(--surface-muted)] text-foreground/52'
                }`}
              >
                {detailSummary}
              </span>
            </div>
            <button
              aria-pressed={isPinned}
              className={`flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full border text-[15px] leading-none transition-colors ${
                isPinned
                  ? 'border-[color-mix(in_srgb,var(--accent)_16%,transparent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-accent hover:bg-[color-mix(in_srgb,var(--accent)_14%,transparent)]'
                  : 'border-transparent bg-transparent text-foreground/34 hover:bg-foreground/5 hover:text-foreground/68'
              }`}
              onClick={onTogglePinned}
              title={isPinned ? t('activity.unpin') : t('activity.pin')}
              type="button"
            >
              {isPinned ? '★' : '☆'}
            </button>
          </div>
        </div>
        <div className="px-5 py-4">
          <p className="line-clamp-3 text-[14px] leading-7 text-foreground/56">
            {selectedSkillGroup.description || selectedSkill.description || t('detail.noDescription')}
          </p>
          <SkillInsightNotes recentChanges={recentChanges} />
        </div>
      </div>

      <div className="space-y-6">
        <section>
          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground/34">
              {t('detail.variantLayerEyebrow')}
            </p>
            <h3 className="text-[14px] font-semibold text-foreground">{t('detail.variants')}</h3>
            <p className="mt-1 text-[12px] text-foreground/48">{t('detail.variantLayerHint')}</p>
          </div>
          <SkillSourcePicker
            group={selectedSkillGroup}
            selectedSkill={selectedSkill}
            showCurrentVariantSources={false}
            onSelectSkill={onSelectSkill}
          />
          {differenceItems.length > 0 && selectedSkillGroup.variantCount > 1 ? (
            <div className="mt-4 rounded-[10px] border border-border/50 bg-[var(--surface)] p-4 shadow-minimal-flat">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-[13px] font-semibold text-foreground">{t('detail.keyDifferences')}</h4>
                <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-[10px] font-medium text-foreground/48">
                  {selectedVariant ? t('detail.comparingFrom', { label: selectedVariantLabel }) : t('common.noValue')}
                </span>
              </div>
              <div className="space-y-2">
                {differenceItems.map((item) => (
                  <p className="text-[12px] leading-5 text-foreground/56" key={item}>
                    {item}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
          {selectedVariant ? (
            <div className="mt-6 border-t border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] pt-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground/34">
                    {t('detail.sourceLayerEyebrow')}
                  </p>
                  <h4 className="mt-1 text-[14px] font-semibold text-foreground">
                    {t('detail.sourceLayerTitle', { label: selectedVariantLabel })}
                  </h4>
                  <p className="mt-1 text-[12px] leading-5 text-foreground/50">{t('detail.sourceLayerHint')}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-[10px] font-medium text-foreground/56">
                    {selectedVariantLabel}
                  </span>
                  <span className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-[10px] font-medium text-foreground/56">
                    {t('source.currentSource', { agentName: selectedAgentName })}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <CurrentVariantSources
                  footer={(
                    <div className="space-y-4">
                      <SkillSourceDetails skill={selectedSkill} />

                      <div className="border-t border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] pt-4">
                        <div className="mb-3">
                          <h5 className="text-[13px] font-semibold text-foreground">{t('detail.moreInfo')}</h5>
                          <p className="mt-1 text-[12px] text-foreground/48">{t('detail.moreInfoHint')}</p>
                        </div>
                        <div className="divide-y divide-[color-mix(in_srgb,var(--foreground)_8%,transparent)]">
                          <DetailSection summary={usageSummary} title={t('detail.usageTitle')}>
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                              <div className="inline-flex items-center gap-2">
                                <p className="text-[11px] text-foreground/42">
                                  {lastScanLabel ? t('detail.usageLastScan', { time: lastScanLabel }) : t('detail.usageNoScan')}
                                </p>
                                <UsageHelpTooltip items={usageHelpItems} label={t('detail.usageHelp')} />
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                loading={usageRefreshing}
                                onClick={onRefreshUsage}
                              >
                                {usageRefreshing ? t('detail.usageRefreshing') : t('detail.usageRefresh')}
                              </Button>
                            </div>
                            <div className="border-y border-[color-mix(in_srgb,var(--foreground)_9%,transparent)]">
                              <table className="w-full border-collapse text-left text-[12px]">
                                <thead>
                                  <tr className="border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] text-[11px] font-semibold uppercase tracking-[0.06em] text-foreground/45">
                                    <th className="py-2 font-semibold">{t('detail.usageAgent')}</th>
                                    <th className="py-2 text-right font-semibold">{t('detail.usageCount')}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {usageRows.map((usageRow) => (
                                    <tr
                                      className="border-b border-[color-mix(in_srgb,var(--foreground)_7%,transparent)] last:border-b-0"
                                      key={usageRow.agentId}
                                    >
                                      <td className="py-2 text-foreground/78">{usageRow.agentName}</td>
                                      <td className="py-2 text-right tabular-nums text-foreground/88">{usageRow.count}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </DetailSection>

                          <DetailSection summary={metadataSummary} title={t('detail.metadata')}>
                            <SkillMetadataTable skill={selectedSkill} />
                          </DetailSection>

                          <DetailSection summary={instructionsSummary} title={t('detail.instructions')}>
                            <SkillInstructions content={selectedSkill.content} />
                          </DetailSection>
                        </div>
                      </div>
                    </div>
                  )}
                  onSelectSkill={onSelectSkill}
                  renderSourceActions={(sourceSkill) => (
                    <>
                      <SkillSourceActions
                        openDirectoryTargets={openDirectoryTargets}
                        skill={sourceSkill}
                      />
                      <SourceRowMoreMenu>
                        <SkillSourceGovernanceActions
                          actions={['convert', 'migrate']}
                          primarySkillRepository={primarySkillRepository}
                          shareTargetDirectories={shareTargetDirectories}
                          skill={sourceSkill}
                          skillGroup={selectedSkillGroup}
                          onCreateSymlink={onCreateSymlink}
                          onConvertToSymlink={onConvertToSymlink}
                          onExportZip={onExportZip}
                          onMigrateToPrimary={onMigrateToPrimary}
                        />
                        <SkillSourceRemoveButton
                          skill={sourceSkill}
                          sourceCount={selectedSkillGroup.sourceCount}
                          onRemoveSource={onRemoveSource}
                        />
                      </SourceRowMoreMenu>
                    </>
                  )}
                  selectedSkill={selectedSkill}
                  selectedVariant={selectedVariant}
                  sources={selectedVariant.skills}
                  toolbar={(
                    <SkillSourceGovernanceActions
                      actions={['export', 'share']}
                      primarySkillRepository={primarySkillRepository}
                      shareTargetDirectories={shareTargetDirectories}
                      skill={selectedSkill}
                      skillGroup={selectedSkillGroup}
                      onCreateSymlink={onCreateSymlink}
                      onConvertToSymlink={onConvertToSymlink}
                      onExportZip={onExportZip}
                      onMigrateToPrimary={onMigrateToPrimary}
                    />
                  )}
                />
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </section>
  )
}
