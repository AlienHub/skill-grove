import { useEffect, useRef, useState } from 'react'
import { openSkillDirectory, type OpenDirectoryTarget } from '../../skill-manager/api'
import { displayAgentName } from '../../skill-manager/display'
import { useAppPreferences } from '../../skill-manager/preferences'
import { isRealSkillSource } from '../../skill-manager/skillGrouping'
import { type DirectoryOpenTarget, type Skill } from '../../skill-manager/types'
import { BodyPortal } from '../ui/BodyPortal'
import { Button } from '@najafi/design-system'

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
  const { defaultOpenTargetId, t } = useAppPreferences()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [menuPlacement, setMenuPlacement] = useState<'top' | 'bottom'>('bottom')
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const fileManagerTarget = openDirectoryTargets.find((target) => target.category === 'file-manager') ?? null
  const defaultOpenTarget = defaultOpenTargetId
    ? openDirectoryTargets.find((target) => target.id === defaultOpenTargetId) ?? null
    : null
  const primaryTarget = defaultOpenTarget ?? fileManagerTarget
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
        setFeedbackMessage(t('source.openFailed'))
      })
  }

  const primaryLabel = defaultOpenTarget
    ? t('source.openWith', { target: defaultOpenTarget.label })
    : t('source.openDirectory')

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <div className="flex h-8 overflow-hidden rounded-[8px] border border-border/50 bg-[var(--surface)] text-[12px] font-medium text-foreground/68 shadow-minimal-flat">
        <button
          aria-label={t('source.openDirectory')}
          className="flex cursor-pointer items-center gap-2 px-2.5 transition-colors hover:bg-foreground/5 hover:text-foreground"
          onClick={(event) => {
            event.stopPropagation()
            if (primaryTarget) {
              handleOpen(primaryTarget)
            }
          }}
          title={primaryTarget?.label ?? t('source.openDirectory')}
          type="button"
        >
          {primaryTarget ? <TargetIcon target={primaryTarget} size={14} /> : <FolderIcon size={14} />}
          <span>{primaryLabel}</span>
        </button>
        <button
          aria-expanded={isOpen}
          aria-label={t('source.moreActions')}
          className="flex w-7 cursor-pointer items-center justify-center border-l border-border/45 text-foreground/42 transition-colors hover:bg-foreground/5 hover:text-foreground"
          onClick={(event) => {
            event.stopPropagation()
            setFeedbackMessage(null)
            if (!isOpen) {
              const rect = containerRef.current?.getBoundingClientRect()
              if (rect) {
                const spaceBelow = window.innerHeight - rect.bottom
                setMenuPlacement(spaceBelow < 380 && rect.top > spaceBelow ? 'top' : 'bottom')
              }
            }
            setIsOpen((value) => !value)
          }}
          title={t('source.moreActions')}
          type="button"
        >
          <ChevronDownIcon size={13} />
        </button>
      </div>

      {isOpen ? (
        <div
          className={`absolute z-[900] max-h-[360px] w-[220px] overflow-y-auto rounded-[8px] border border-border/55 bg-[var(--surface)] py-1 shadow-minimal ${
            menuPlacement === 'top' ? 'bottom-[calc(100%+6px)]' : 'top-[calc(100%+6px)]'
          } ${
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
              <span className="min-w-0 truncate">{t('source.openDirectory')}</span>
            </button>
          ) : null}

          {appTargetGroups.map((group) => (
            <div className="border-t border-border/40 pt-1" key={group.category}>
              <div className="px-3 pb-1 pt-1.5 text-[10px] font-medium text-foreground/36">
                {group.category === 'editor'
                  ? t('source.categoryEditor')
                  : group.category === 'ide'
                    ? t('source.categoryIde')
                    : group.category}
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
                  <span className="min-w-0 truncate">{t('source.openWith', { target: target.label })}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      ) : null}

      {feedbackMessage ? (
        <p className="absolute right-0 top-[calc(100%+6px)] z-[429] w-[220px] rounded-[8px] border border-border/55 bg-[var(--surface)] px-3 py-2 text-[12px] text-foreground/56 shadow-minimal">
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
  const { t } = useAppPreferences()
  const agentName = displayAgentName(skill.agentId, skill.agentName, t)
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
        setRemovalErrorMessage(errorMessage(error, isSoftLink ? t('source.deleteSoftLinkFailed') : t('source.trashFailed')))
      })
      .finally(() => {
        setIsRemoving(false)
      })
  }

  return (
    <>
      <button
        className="h-8 cursor-pointer rounded-[8px] px-3 text-[12px] font-medium text-foreground/42 transition-colors hover:bg-destructive/[0.07] hover:text-destructive"
        onClick={() => {
          setRemovalErrorMessage(null)
          setIsConfirmingRemoval(true)
        }}
        type="button"
      >
        {isSoftLink ? t('source.deleteSoftLink') : t('source.trash')}
      </button>

      {isConfirmingRemoval ? (
        <BodyPortal>
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/22 px-4">
            <div className="w-full max-w-[420px] rounded-[8px] border border-border/60 bg-[var(--surface)] p-5 shadow-strong">
              <h4 className="text-[14px] font-semibold text-foreground">
                {isSoftLink ? t('source.confirmDeleteSoftLink') : t('source.confirmTrash')}
              </h4>
              <div className="mt-3 space-y-2 text-[12px] leading-5 text-foreground/56">
                <p>
                  {skill.name}
                  <br />
                  {agentName}
                  <br />
                  {sourcePath(skill)}
                </p>
                {isSoftLink ? (
                  <p>
                    {t('source.softLinkNotice', { agentName })}
                    <br />
                    {skill.resolvedSkillDirectory}
                  </p>
                ) : (
                  <p>
                    {t('source.trashNotice', { count: Math.max(sourceCount - 1, 0) })}
                  </p>
                )}
                {removalErrorMessage ? (
                  <p className="rounded-[8px] border border-destructive/25 bg-destructive/[0.07] px-3 py-2 text-[var(--destructive-text)]">
                    {removalErrorMessage}
                  </p>
                ) : null}
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="outline" disabled={isRemoving} onClick={() => setIsConfirmingRemoval(false)}>
                  {t('common.cancel')}
                </Button>
                <Button variant="destructive" loading={isRemoving} onClick={handleRemoveSource}>
                  {isRemoving ? t('common.processing') : isSoftLink ? t('source.deleteSoftLink') : t('source.trash')}
                </Button>
              </div>
            </div>
          </div>
        </BodyPortal>
      ) : null}
    </>
  )
}
