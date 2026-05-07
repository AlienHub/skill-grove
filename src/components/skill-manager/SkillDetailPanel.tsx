import { describeSkillGroup } from '../../skill-manager/skillGrouping'
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
  const detailSummary = `${selectedSkillGroup.variantCount || 1} 个内容版本 · ${selectedSkillGroup.sourceCount} 个来源`

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
                  ? 'bg-[color-mix(in_srgb,var(--accent)_10%,white)] text-accent'
                  : 'bg-[color-mix(in_srgb,var(--foreground)_4%,white)] text-foreground/52'
              }`}
            >
              {detailSummary}
            </span>
          </div>
          {selectedSkillGroup.sourceCount > 1 ? (
            <p className="mt-2 text-[12px] font-medium text-foreground/48">
              {describeSkillGroup(selectedSkillGroup)}
            </p>
          ) : null}
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
  )
}
