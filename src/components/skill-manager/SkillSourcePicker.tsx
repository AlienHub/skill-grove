import { useEffect, useRef, useState } from 'react'
import { AgentIcon } from '../../skill-manager/agentInfo'
import { getSourceTypeLabel, isRealSkillSource } from '../../skill-manager/skillGrouping'
import { type Skill, type SkillGroup } from '../../skill-manager/types'

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

  if (group.sourceCount <= 1) {
    return null
  }

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
