import { type Skill, type SkillGroup, type SkillVariant } from './types'

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

export function describeSkillVariant(variant: SkillVariant) {
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

export function describeSkillGroup(group: SkillGroup) {
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
