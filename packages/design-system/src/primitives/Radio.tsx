import type { ReactNode } from 'react'
import { cn } from './cn'

export interface RadioProps {
  checked: boolean
  onSelect: () => void
  disabled?: boolean
  name?: string
  children?: ReactNode
  className?: string
}

/** Radio — circular sibling of Checkbox. Selected = `foreground` ring + dot,
 *  matching the checkbox's "chosen" language. Renders as a `<label>`. */
export function Radio({ checked, onSelect, disabled = false, name, children, className }: RadioProps) {
  return (
    <label
      className={cn(
        'flex items-center gap-2.5 text-[12px] text-foreground/78',
        disabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer',
        className,
      )}
    >
      <input
        type="radio"
        name={name}
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={() => onSelect()}
      />
      <span
        className={cn(
          'flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors',
          checked ? 'border-foreground' : 'border-border/70 bg-[var(--surface)]',
        )}
      >
        {checked ? <span className="size-1.5 rounded-full bg-foreground" /> : null}
      </span>
      {children}
    </label>
  )
}
