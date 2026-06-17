import { forwardRef } from 'react'
import type { SelectHTMLAttributes } from 'react'
import { cn } from './cn'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

/** Native `<select>` styled to match the control language, with a custom
 *  chevron (the native arrow is hidden via `appearance-none`). Pass `<option>`
 *  children as usual. For a rich popover listbox, compose Card + option rows. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { error = false, className, children, ...rest },
  ref,
) {
  return (
    <span className="relative inline-flex items-center">
      <select
        ref={ref}
        className={cn(
          'h-8 min-w-[180px] cursor-pointer appearance-none rounded-[8px] border bg-[var(--surface-muted)]',
          'pl-2.5 pr-8 text-[12px] font-medium text-foreground/72 outline-none transition-colors',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error
            ? 'border-destructive focus:ring-2 focus:ring-destructive/28'
            : 'border-border/50 focus:border-foreground/18 focus-visible:ring-2 focus-visible:ring-accent/35',
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <svg
        aria-hidden="true"
        width="12"
        height="12"
        viewBox="0 0 14 14"
        fill="none"
        className="pointer-events-none absolute right-2.5 text-foreground/40"
      >
        <path d="M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
})
