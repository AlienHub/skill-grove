import { type Skill, type SkillGroup, type SkillVariant } from './types'
import { translate, type TranslationKey } from './i18n'

type TFunction = (key: TranslationKey, params?: Record<string, string | number>) => string

const defaultT: TFunction = (key, params) => translate('zh-CN', key, params)

function getSkillIdentity(skill: Skill) {
  return (skill.name || skill.slug || skill.location).trim().toLowerCase()
}

export function isRealSkillSource(skill: Skill) {
  return skill.skillDirectory === skill.resolvedSkillDirectory
}

export function getSourceTypeLabel(skill: Skill) {
  if (!isRealSkillSource(skill)) {
    return '软链接'
  }

  return '真实文件'
}

export function getVisibleSourceTypeLabel(skill: Skill) {
  return isRealSkillSource(skill) ? null : getSourceTypeLabel(skill)
}

function getSkillVariantKey(skill: Skill) {
  return skill.contentHash || skill.resolvedSkillDirectory || skill.skillDirectory || skill.id
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

export function describeSkillVariant(variant: SkillVariant, t: TFunction = defaultT) {
  if (variant.relationship === 'symlink') {
    return t('group.symlink', { count: variant.skills.length })
  }

  if (variant.relationship === 'same-content') {
    if (variant.softLinkCount > 0) {
      return t('group.sameContentWithLinks', {
        realFileCount: variant.realFileCount,
        softLinkCount: variant.softLinkCount,
      })
    }

    return t('group.sameContent', { realFileCount: variant.realFileCount })
  }

  return t('group.singleSource')
}

export function describeSkillGroup(group: SkillGroup, t: TFunction = defaultT) {
  if (group.variantCount > 1) {
    return t('group.variantSummary', {
      variantCount: group.variantCount,
      sourceCount: group.sourceCount,
    })
  }

  if (group.sourceCount > 1) {
    return t('group.sourceSummary', { sourceCount: group.sourceCount })
  }

  return group.primarySkill.location
}

export function buildSkillGroups(skills: Skill[]) {
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
