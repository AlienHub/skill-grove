import { useAppPreferences } from '../../skill-manager/preferences'
import { changeMessageKeys, changeParams } from '../../skill-manager/libraryPresentation'
import { estimateResidentCatalogTokens } from '../../skill-manager/catalogProfiles'
import {
  type DirectoryOpenTarget,
  type LibraryChange,
  type Skill,
  type SkillGroup,
  type SkillUsageSnapshot,
} from '../../skill-manager/types'
import { usageByAgentForGroup } from '../../skill-manager/skillUsageHelpers'
import { SkillMetadataTable, SkillSourceTable } from './SkillInfoTables'
import { SkillInstructions } from './SkillInstructions'
import { SkillSourcePicker } from './SkillSourcePicker'

function formatTokenEstimate(tokens: number) {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`
  }

  return String(tokens)
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

  return (
    <div className="mt-4 rounded-[8px] border border-border/50 bg-[var(--surface)] p-3 shadow-minimal-flat">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground/38">
        {t('changes.title')}
      </p>
      <div className="mt-2 space-y-1.5">
        {recentChanges.slice(0, 3).map((change, index) => (
          <p className="text-[12px] leading-5 text-foreground/58" key={`${change.type}-${change.sourcePath ?? index}`}>
            {t(changeMessageKeys[change.type], changeParams(change))}
          </p>
        ))}
      </div>
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
          <p className="line-clamp-2 text-[14px] leading-7 text-foreground/56">
            {selectedSkillGroup.description || selectedSkill.description || t('detail.noDescription')}
          </p>
          <SkillInsightNotes recentChanges={recentChanges} />
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <div className="mb-4">
            <h3 className="text-[14px] font-semibold text-foreground">{t('detail.sources')}</h3>
          </div>
          <SkillSourcePicker
            group={selectedSkillGroup}
            selectedSkill={selectedSkill}
            onSelectSkill={onSelectSkill}
          />
          <div className={selectedSkillGroup.sourceCount > 1 ? 'mt-3' : undefined}>
            <SkillSourceTable
              openDirectoryTargets={openDirectoryTargets}
              primarySkillRepository={primarySkillRepository}
              shareTargetDirectories={shareTargetDirectories}
              skill={selectedSkill}
              skillGroup={selectedSkillGroup}
              sourceCount={selectedSkillGroup.sourceCount}
              onCreateSymlink={onCreateSymlink}
              onConvertToSymlink={onConvertToSymlink}
              onExportZip={onExportZip}
              onMigrateToPrimary={onMigrateToPrimary}
              onRemoveSource={onRemoveSource}
            />
          </div>
        </section>

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-semibold text-foreground">{t('detail.usageTitle')}</h3>
              <div className="group/help relative inline-flex">
                <button
                  aria-label={t('detail.usageHelp')}
                  className="flex size-5 cursor-help items-center justify-center rounded-full border border-border/60 bg-[var(--surface)] text-[12px] font-semibold text-foreground/50 transition-colors hover:border-foreground/20 hover:text-foreground/78 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/35"
                  type="button"
                >
                  ?
                </button>
                <div className="pointer-events-none absolute left-0 top-full z-50 mt-2 hidden w-[min(24rem,calc(100vw-3rem))] rounded-[8px] border border-border/60 bg-popover p-3 text-[11px] leading-5 text-popover-foreground shadow-[0_8px_24px_rgba(15,23,42,0.14)] group-hover/help:block group-focus-within/help:block">
                  <div className="space-y-2">
                    {usageHelpItems.map((item, index) => (
                      <p key={`${item.slice(0, 20)}-${index}`}>{item}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] text-foreground/42">
                {lastScanLabel ? t('detail.usageLastScan', { time: lastScanLabel }) : t('detail.usageNoScan')}
              </p>
              <button
                className="rounded-md border border-border/60 bg-[var(--surface)] px-2.5 py-1 text-[12px] font-medium text-foreground/80 transition-colors hover:bg-foreground/5 disabled:opacity-50"
                disabled={usageRefreshing}
                onClick={onRefreshUsage}
                type="button"
              >
                {usageRefreshing ? t('detail.usageRefreshing') : t('detail.usageRefresh')}
              </button>
            </div>
          </div>
          <div className="overflow-hidden rounded-[8px] border border-[color-mix(in_srgb,var(--foreground)_9%,transparent)] bg-[var(--surface)] shadow-minimal-flat">
            <table className="w-full border-collapse text-left text-[12px]">
              <thead>
                <tr className="border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[var(--surface-muted)] text-[11px] font-semibold uppercase tracking-[0.06em] text-foreground/45">
                  <th className="px-3 py-2 font-semibold">{t('detail.usageAgent')}</th>
                  <th className="px-3 py-2 text-right font-semibold">{t('detail.usageCount')}</th>
                </tr>
              </thead>
              <tbody>
                {usageRows.map((usageRow) => (
                  <tr
                    className="border-b border-[color-mix(in_srgb,var(--foreground)_7%,transparent)] last:border-b-0"
                    key={usageRow.agentId}
                  >
                    <td className="px-3 py-2 text-foreground/78">{usageRow.agentName}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-foreground/88">{usageRow.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h3 className="text-[14px] font-semibold text-foreground">{t('detail.metadata')}</h3>
            <p className="shrink-0 text-[12px] text-foreground/42">
              {t('catalog.tokensShort', { tokens: formatTokenEstimate(catalogTokens) })}
            </p>
          </div>
          <SkillMetadataTable skill={selectedSkill} />
        </section>

        <section>
          <div className="mb-4">
            <h3 className="text-[14px] font-semibold text-foreground">{t('detail.instructions')}</h3>
          </div>
          <SkillInstructions content={selectedSkill.content} />
        </section>
      </div>
    </section>
  )
}
