import { type ReactNode } from 'react'
import { AgentIcon } from '../../skill-manager/agentInfo'
import { displayAgentName } from '../../skill-manager/display'
import { describeSkillVariant, isRealSkillSource } from '../../skill-manager/skillGrouping'
import { useAppPreferences } from '../../skill-manager/preferences'
import { type Skill, type SkillGroup, type SkillVariant } from '../../skill-manager/types'

function getVariantLabel(index: number, t: ReturnType<typeof useAppPreferences>['t']) {
  if (index >= 0 && index < 26) {
    return t('source.variantLabel', { label: String.fromCharCode(65 + index) })
  }

  return t('source.variantNumber', { number: index + 1 })
}

function getSourcePath(skill: Skill) {
  return skill.skillDirectory
}

function sortSources(left: Skill, right: Skill, locale: string) {
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
    <div className="flex min-w-0 flex-wrap gap-1.5">
      {visibleSources.map((skill) => (
        <span
          className="inline-flex max-w-[160px] items-center gap-1.5 rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-[11px] font-medium text-foreground/60"
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
        <span className="inline-flex rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-[11px] font-medium text-foreground/44">
          +{hiddenSourceCount}
        </span>
      ) : null}
    </div>
  )
}

function getVariantRoleLabel(
  variant: SkillVariant,
  isCurrentVariant: boolean,
  t: ReturnType<typeof useAppPreferences>['t'],
) {
  if (isCurrentVariant) {
    return t('source.variantRoleCurrent')
  }

  if (variant.relationship === 'symlink') {
    return t('source.variantRoleLinked')
  }

  if (variant.relationship === 'same-content') {
    return t('source.variantRoleCopies')
  }

  return t('source.variantRoleAlternate')
}

function getVariantFocusNote(
  variant: SkillVariant,
  isCurrentVariant: boolean,
  t: ReturnType<typeof useAppPreferences>['t'],
) {
  if (isCurrentVariant) {
    return t('source.variantFocusCurrent', { count: variant.skills.length })
  }

  if (variant.skills.length === 1) {
    const onlySkill = variant.skills[0]
    const agentName = onlySkill ? displayAgentName(onlySkill.agentId, onlySkill.agentName, t) : t('common.noValue')
    return t('source.variantFocusSingleAgent', { agentName })
  }

  return t('source.variantFocusCompare', { count: variant.skills.length })
}

function VariantCard({
  isCurrentVariant,
  label,
  onSelect,
  sourceCount,
  sources,
  totalSourceCount,
  variant,
}: {
  isCurrentVariant: boolean
  label: string
  onSelect: () => void
  sourceCount: number
  sources: Skill[]
  totalSourceCount: number
  variant: SkillVariant
}) {
  const { t } = useAppPreferences()
  const focusNote = getVariantFocusNote(variant, isCurrentVariant, t)

  return (
    <button
      aria-pressed={isCurrentVariant}
      className={`w-full cursor-pointer rounded-[8px] border px-4 py-3 text-left transition-colors ${
        isCurrentVariant
          ? 'border-[color-mix(in_srgb,var(--accent)_22%,var(--surface))] bg-[color-mix(in_srgb,var(--accent)_4%,var(--surface))] shadow-minimal-flat'
          : 'border-border/50 bg-[var(--surface-muted)] hover:border-foreground/18 hover:bg-foreground/[0.03]'
      }`}
      onClick={onSelect}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="text-[13px] font-semibold text-foreground">{label}</p>
            {isCurrentVariant ? (
              <span className="rounded-full bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] px-2 py-0.5 text-[10px] font-semibold text-accent">
                {t('source.currentContent')}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[12px] font-medium leading-5 text-foreground/66">
            {getVariantRoleLabel(variant, isCurrentVariant, t)}
          </p>
          <p className="mt-1 text-[12px] leading-5 text-foreground/48">
            {focusNote}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[var(--surface)] px-2.5 py-1 text-[10px] font-medium text-foreground/54">
          {t('source.sourcesCount', { count: sourceCount })}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <VariantAgentPreview sources={sources} totalSourceCount={totalSourceCount} t={t} />
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full border border-border/45 px-2 py-1 text-[10px] font-medium text-foreground/56">
            {describeSkillVariant(variant, t)}
          </span>
          <span className="rounded-full border border-border/45 px-2 py-1 text-[10px] font-medium text-foreground/56">
            {t('source.variantRealFiles', { count: variant.realFileCount })}
          </span>
          {variant.softLinkCount > 0 ? (
            <span className="rounded-full border border-border/45 px-2 py-1 text-[10px] font-medium text-foreground/56">
              {t('source.variantSoftLinks', { count: variant.softLinkCount })}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  )
}

export function CurrentVariantSources({
  footer,
  renderSourceActions,
  toolbar,
  selectedSkill,
  selectedVariant,
  sources,
  onSelectSkill,
}: {
  footer?: ReactNode
  renderSourceActions?: (skill: Skill) => ReactNode
  toolbar?: ReactNode
  selectedSkill: Skill
  selectedVariant: SkillVariant
  sources: Skill[]
  onSelectSkill: (skillId: string) => void
}) {
  const { t } = useAppPreferences()

  return (
    <div className="rounded-[10px] border border-border/50 bg-[var(--surface)] shadow-minimal-flat">
      <div className="border-b border-border/45 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-[13px] font-semibold text-foreground">{t('source.currentVariantSources')}</h4>
            <p className="mt-1 text-[12px] text-foreground/48">{t('source.currentVariantSourcesHint')}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-[10px] font-medium text-foreground/52">
              {describeSkillVariant(selectedVariant, t)}
            </span>
            {toolbar ? (
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                {toolbar}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <ul className="divide-y divide-border/45">
        {sources.map((skill) => {
          const isSelected = skill.id === selectedSkill.id
          const sourceType = isRealSkillSource(skill) ? null : t('source.softLink')
          const actions = renderSourceActions?.(skill)

          return (
            <li key={skill.id}>
              <div
                className={`grid gap-3 px-4 py-3 transition-colors md:grid-cols-[minmax(0,1fr)_auto] ${
                  isSelected ? 'bg-[color-mix(in_srgb,var(--foreground)_4%,var(--surface))]' : 'hover:bg-foreground/[0.03]'
                }`}
              >
                <button
                  aria-pressed={isSelected}
                  className="flex min-w-0 cursor-pointer items-center gap-3 rounded-[8px] text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/35"
                  onClick={() => onSelectSkill(skill.id)}
                  type="button"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-[8px] border border-border/45 bg-[var(--surface-muted)]">
                    <AgentIcon
                      agentIcon={skill.agentIcon}
                      agentId={skill.agentId}
                      agentName={skill.agentName}
                      size={14}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="truncate text-[12px] font-medium text-foreground/84">
                        {displayAgentName(skill.agentId, skill.agentName, t)}
                      </span>
                      {sourceType ? (
                        <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-medium text-foreground/48">
                          {sourceType}
                        </span>
                      ) : null}
                      {isSelected ? (
                        <span className="rounded-full bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] px-2 py-0.5 text-[10px] font-medium text-accent">
                          {t('source.currentSourceShort')}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-[12px] text-foreground/45">{skill.skillDirectory}</p>
                  </div>
                </button>
                {actions ? (
                  <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
                    {actions}
                  </div>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
      {footer ? (
        <div className="border-t border-border/45 p-4">
          {footer}
        </div>
      ) : null}
    </div>
  )
}

export function SkillSourcePicker({
  group,
  selectedSkill,
  showCurrentVariantSources = true,
  onSelectSkill,
}: {
  group: SkillGroup
  selectedSkill: Skill
  showCurrentVariantSources?: boolean
  onSelectSkill: (skillId: string) => void
}) {
  const { language, t } = useAppPreferences()

  const selectedVariantIndex = group.variants.findIndex((variant) =>
    variant.skills.some((skill) => skill.id === selectedSkill.id)
  )
  const selectedVariant = group.variants[selectedVariantIndex] ?? group.variants[0] ?? null
  const variantGroups = group.variants.map((variant, index) => ({
    index,
    label: getVariantLabel(index, t),
    sources: [...variant.skills].sort((left, right) => sortSources(left, right, language)),
    variant,
  }))
  return (
    <div className="space-y-4">
      <div className="rounded-[10px] border border-border/50 bg-[var(--surface)] p-3 shadow-minimal-flat">
        <div className={`grid gap-3 ${variantGroups.length > 1 ? 'xl:grid-cols-2' : 'grid-cols-1'}`}>
          {variantGroups.map(({ label, sources, variant }) => {
            const isCurrentVariant = variant.id === selectedVariant?.id

            return (
              <VariantCard
                isCurrentVariant={isCurrentVariant}
                key={variant.id}
                label={label}
                onSelect={() => onSelectSkill((variant.primarySkill ?? sources[0] ?? selectedSkill).id)}
                sourceCount={variant.skills.length}
                sources={sources}
                totalSourceCount={group.sourceCount}
                variant={variant}
              />
            )
          })}
        </div>
      </div>

      {selectedVariant && showCurrentVariantSources ? (
        <CurrentVariantSources
          onSelectSkill={onSelectSkill}
          selectedSkill={selectedSkill}
          selectedVariant={selectedVariant}
          sources={[...selectedVariant.skills].sort((left, right) => sortSources(left, right, language))}
        />
      ) : null}
    </div>
  )
}
