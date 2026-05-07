import { useEffect, useRef, useState } from 'react'
import { openSkillDirectory, type OpenDirectoryTarget } from '../../skill-manager/api'
import { isRealSkillSource } from '../../skill-manager/skillGrouping'
import { type DirectoryOpenTarget, type Skill } from '../../skill-manager/types'

const CATEGORY_LABELS: Record<string, string> = {
  editor: '编辑器',
  ide: 'IDE',
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
      <path
        d="m7 10 5 5 5-5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

function FolderIcon({ size }: { size: number }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path
        d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

function TargetIcon({ target, size = 16 }: { target: DirectoryOpenTarget; size?: number }) {
  if (target.icon?.type === 'dataUrl' && target.icon.value) {
    return (
      <img
        alt=""
        className="block rounded-[4px]"
        height={size}
        src={target.icon.value}
        width={size}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className="flex items-center justify-center rounded-[4px] bg-foreground/8 text-[10px] font-semibold text-foreground/56"
      style={{ height: size, width: size }}
    >
      {target.label.slice(0, 1)}
    </span>
  )
}

function sourcePath(skill: Skill) {
  return skill.skillDirectory
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim()
  }

  if (typeof error === 'string' && error.trim()) {
    return error.trim()
  }

  return fallback
}

export function SkillSourceActions({
  align = 'right',
  openDirectoryTargets,
  skill,
}: {
  align?: 'left' | 'right'
  openDirectoryTargets: DirectoryOpenTarget[]
  skill: Skill
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const fileManagerTarget = openDirectoryTargets.find((target) => target.category === 'file-manager') ?? null
  const appTargets = openDirectoryTargets.filter((target) => target.category === 'ide' || target.category === 'editor')
  const appTargetGroups = appTargets.reduce<Array<{ category: string; targets: DirectoryOpenTarget[] }>>(
    (groups, target) => {
      const group = groups.find((item) => item.category === target.category)
      if (group) {
        group.targets.push(target)
      } else {
        groups.push({ category: target.category, targets: [target] })
      }
      return groups
    },
    []
  )

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (target instanceof Node && containerRef.current?.contains(target)) {
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

  const handleOpen = (target: DirectoryOpenTarget) => {
    setFeedbackMessage(null)
    setIsOpen(false)

    void openSkillDirectory(sourcePath(skill), target.id as OpenDirectoryTarget)
      .catch(() => {
        setFeedbackMessage('打开来源失败，请确认应用可用。')
      })
  }

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <div className="flex h-8 overflow-hidden rounded-[8px] border border-border/50 bg-white text-[12px] font-medium text-foreground/68 shadow-minimal-flat">
        <button
          aria-label={`使用 ${fileManagerTarget?.label ?? '文件管理器'} 打开 ${skill.agentName} 来源目录`}
          className="flex cursor-pointer items-center gap-2 px-2.5 transition-colors hover:bg-foreground/5 hover:text-foreground"
          onClick={(event) => {
            event.stopPropagation()
            if (fileManagerTarget) {
              handleOpen(fileManagerTarget)
            }
          }}
          title={fileManagerTarget?.label ?? '打开目录'}
          type="button"
        >
          {fileManagerTarget ? <TargetIcon target={fileManagerTarget} size={14} /> : <FolderIcon size={14} />}
          <span>打开目录</span>
        </button>
        <button
          aria-expanded={isOpen}
          aria-label={`${skill.agentName} 更多来源操作`}
          className="flex w-7 cursor-pointer items-center justify-center border-l border-border/45 text-foreground/42 transition-colors hover:bg-foreground/5 hover:text-foreground"
          onClick={(event) => {
            event.stopPropagation()
            setFeedbackMessage(null)
            setIsOpen((value) => !value)
          }}
          title="更多来源操作"
          type="button"
        >
          <ChevronDownIcon size={13} />
        </button>
      </div>

      {isOpen ? (
        <div
          className={`absolute top-[calc(100%+6px)] z-[900] w-[220px] overflow-hidden rounded-[8px] border border-border/55 bg-white py-1 shadow-minimal ${
            align === 'left' ? 'left-0' : 'right-0'
          }`}
        >
          {fileManagerTarget ? (
            <button
              className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-[12px] text-foreground/76 transition-colors hover:bg-foreground/5 hover:text-foreground"
              onClick={() => handleOpen(fileManagerTarget)}
              type="button"
            >
              <span className="flex size-5 shrink-0 items-center justify-center">
                <TargetIcon target={fileManagerTarget} />
              </span>
              <span className="min-w-0 truncate">打开目录</span>
            </button>
          ) : null}

          {appTargetGroups.map((group) => (
            <div className="border-t border-border/40 pt-1" key={group.category}>
              <div className="px-3 pb-1 pt-1.5 text-[10px] font-medium text-foreground/36">
                {CATEGORY_LABELS[group.category] ?? group.category}
              </div>
              {group.targets.map((target) => (
                <button
                  className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-[12px] text-foreground/76 transition-colors hover:bg-foreground/5 hover:text-foreground"
                  key={target.id}
                  onClick={() => handleOpen(target)}
                  type="button"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center">
                    <TargetIcon target={target} />
                  </span>
                  <span className="min-w-0 truncate">用 {target.label} 打开</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      ) : null}

      {feedbackMessage ? (
        <p className="absolute right-0 top-[calc(100%+6px)] z-[429] w-[220px] rounded-[8px] border border-border/55 bg-white px-3 py-2 text-[12px] text-foreground/56 shadow-minimal">
          {feedbackMessage}
        </p>
      ) : null}

    </div>
  )
}

export function SkillSourceRemoveButton({
  skill,
  sourceCount,
  onRemoveSource,
}: {
  skill: Skill
  sourceCount: number
  onRemoveSource: (skill: Skill) => Promise<void>
}) {
  const [isConfirmingRemoval, setIsConfirmingRemoval] = useState(false)
  const [removalErrorMessage, setRemovalErrorMessage] = useState<string | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)
  const isSoftLink = !isRealSkillSource(skill)

  const handleRemoveSource = () => {
    setRemovalErrorMessage(null)
    setIsRemoving(true)

    void onRemoveSource(skill)
      .then(() => {
        setIsConfirmingRemoval(false)
      })
      .catch((error) => {
        setRemovalErrorMessage(errorMessage(error, isSoftLink ? '删除软链失败。' : '放入废纸篓失败。'))
      })
      .finally(() => {
        setIsRemoving(false)
      })
  }

  return (
    <>
      <button
        className="h-8 cursor-pointer rounded-[8px] px-3 text-[12px] font-medium text-foreground/42 transition-colors hover:bg-[#b04a3a]/7 hover:text-[#b04a3a]"
        onClick={() => {
          setRemovalErrorMessage(null)
          setIsConfirmingRemoval(true)
        }}
        type="button"
      >
        {isSoftLink ? '删除软链' : '放入废纸篓'}
      </button>

      {isConfirmingRemoval ? (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/18 px-4">
          <div className="w-full max-w-[420px] rounded-[8px] border border-border/60 bg-white p-5 shadow-strong">
            <h4 className="text-[14px] font-semibold text-foreground">
              {isSoftLink ? '删除这个软链？' : '放入废纸篓？'}
            </h4>
            <div className="mt-3 space-y-2 text-[12px] leading-5 text-foreground/56">
              <p>
                {skill.name}
                <br />
                {skill.agentName}
                <br />
                {sourcePath(skill)}
              </p>
              {isSoftLink ? (
                <p>
                  这只会删除 {skill.agentName} 中的软链，不会删除它指向的真实目录：
                  <br />
                  {skill.resolvedSkillDirectory}
                </p>
              ) : (
                <p>
                  只会移除这个来源。其他 {Math.max(sourceCount - 1, 0)} 个来源不会受影响。
                </p>
              )}
              {removalErrorMessage ? (
                <p className="rounded-[8px] border border-[#b04a3a]/25 bg-[#b04a3a]/7 px-3 py-2 text-[#8f3f33]">
                  {removalErrorMessage}
                </p>
              ) : null}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="h-8 cursor-pointer rounded-[8px] border border-border/50 bg-white px-3 text-[12px] font-medium text-foreground/64 transition-colors hover:bg-foreground/5 hover:text-foreground"
                disabled={isRemoving}
                onClick={() => setIsConfirmingRemoval(false)}
                type="button"
              >
                取消
              </button>
              <button
                className="h-8 cursor-pointer rounded-[8px] bg-[#b04a3a] px-3 text-[12px] font-medium text-white transition-colors hover:bg-[#963f32] disabled:cursor-default disabled:opacity-55"
                disabled={isRemoving}
                onClick={handleRemoveSource}
                type="button"
              >
                {isRemoving ? '处理中...' : isSoftLink ? '删除软链' : '放入废纸篓'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
