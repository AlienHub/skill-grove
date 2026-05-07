import { describeSkillGroup } from '../../skill-manager/skillGrouping'
import { useAppPreferences } from '../../skill-manager/preferences'
import { type DirectoryOpenTarget, type Skill, type SkillGroup } from '../../skill-manager/types'
import { SkillMetadataTable, SkillSourceTable } from './SkillInfoTables'
import { SkillInstructions } from './SkillInstructions'
import { SkillSourcePicker } from './SkillSourcePicker'

export function SkillDetailPanel({
  openDirectoryTargets,
  selectedSkill,
  selectedSkillGroup,
  onRemoveSource,
  onSelectSkill,
}: {
  openDirectoryTargets: DirectoryOpenTarget[]
  selectedSkill: Skill
  selectedSkillGroup: SkillGroup
  onRemoveSource: (skill: Skill) => Promise<void>
  onSelectSkill: (skillId: string) => void
}) {
  const { t } = useAppPreferences()
  const detailSummary = t('detail.summary', {
    variantCount: selectedSkillGroup.variantCount || 1,
    sourceCount: selectedSkillGroup.sourceCount,
  })

  return (
    <section className="overflow-y-auto rounded-[8px] bg-[color-mix(in_srgb,var(--foreground)_1.5%,var(--background))] p-5 shadow-minimal">
      <div className="mb-6">
        <p className="text-[12px] text-foreground/52">{selectedSkillGroup.location}</p>
      </div>

      <div className="mb-8 rounded-[8px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[14px] font-semibold text-foreground">{selectedSkillGroup.name}</h2>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                selectedSkillGroup.variantCount > 1
                  ? 'bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface))] text-accent'
                  : 'bg-[var(--surface-muted)] text-foreground/52'
              }`}
            >
              {detailSummary}
            </span>
          </div>
          {selectedSkillGroup.sourceCount > 1 ? (
            <p className="mt-2 text-[12px] font-medium text-foreground/48">
              {describeSkillGroup(selectedSkillGroup, t)}
            </p>
          ) : null}
          <p className="mt-2 line-clamp-2 text-[14px] leading-7 text-foreground/56">
            {selectedSkillGroup.description || selectedSkill.description || t('detail.noDescription')}
          </p>
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
              skill={selectedSkill}
              sourceCount={selectedSkillGroup.sourceCount}
              onRemoveSource={onRemoveSource}
            />
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h3 className="text-[14px] font-semibold text-foreground">{t('detail.metadata')}</h3>
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
