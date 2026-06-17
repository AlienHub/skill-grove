import { cn } from './cn'

export interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  'aria-label'?: string
  className?: string
}

/** Toggle switch (`role="switch"`). Active state uses a `foreground` fill —
 *  the same "chosen" language as Button solid — not the brand accent. */
export function Switch({ checked, onCheckedChange, disabled = false, className, ...rest }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'inline-flex h-6 w-11 cursor-pointer items-center rounded-full border p-0.5 transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-45',
        checked
          ? 'justify-end border-foreground/12 bg-foreground/64 hover:bg-foreground/72'
          : 'justify-start border-border/55 bg-foreground/6 hover:bg-foreground/10',
        className,
      )}
      {...rest}
    >
      <span
        className={cn(
          'size-4 rounded-full shadow-[var(--shadow-minimal-flat)] transition-colors',
          checked ? 'bg-[var(--surface)]' : 'bg-foreground/34',
        )}
      />
    </button>
  )
}
