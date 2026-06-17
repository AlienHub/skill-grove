import type { ReactNode } from 'react'
import { cn } from './cn'

export interface CheckboxProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  /** Optional label rendered to the right of the box. */
  children?: ReactNode
  className?: string
}

function CheckMark() {
  return (
    <svg width="10" height="10" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M3 7.2l2.7 2.7L11 4.4"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Checkbox. Checked = `foreground` fill + a `background`-colored check.
 *  Renders as a `<label>` so the text is part of the hit target. */
export function Checkbox({ checked, onCheckedChange, disabled = false, children, className }: CheckboxProps) {
  return (
    <label
      className={cn(
        'flex items-center gap-2.5 text-[12px] text-foreground/78',
        disabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer',
        className,
      )}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onCheckedChange(e.target.checked)}
      />
      <span
        className={cn(
          'flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors',
          checked
            ? 'border-foreground bg-foreground text-background'
            : 'border-border/70 bg-[var(--surface)] text-transparent',
        )}
      >
        <CheckMark />
      </span>
      {children}
    </label>
  )
}
