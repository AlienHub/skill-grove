import { forwardRef } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

export type InputSize = 'sm' | 'md' | 'lg'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Control height scale. `md` (h-8) is the app default. */
  inputSize?: InputSize
  /** Error state — red border + red focus ring. Pair with helper text in `--destructive-text`. */
  error?: boolean
  /** Icon rendered inside the field on the left (input gets extra left padding). */
  leftIcon?: ReactNode
}

const BASE =
  'w-full rounded-[8px] border bg-[var(--surface)] text-foreground placeholder:text-foreground/40 ' +
  'outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 ' +
  'disabled:bg-[var(--surface-muted)]'

const SIZES: Record<InputSize, string> = {
  sm: 'h-7 px-2.5 text-[11px]',
  md: 'h-8 px-3 text-[12px]',
  lg: 'h-9 px-3.5 text-[13px]',
}

const STATE = {
  normal: 'border-input focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/35',
  error: 'border-destructive focus-visible:ring-2 focus-visible:ring-destructive/28',
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { inputSize = 'md', error = false, leftIcon, className, ...rest },
  ref,
) {
  const field = (
    <input
      ref={ref}
      className={cn(
        BASE,
        SIZES[inputSize],
        error ? STATE.error : STATE.normal,
        leftIcon ? 'pl-8' : undefined,
        className,
      )}
      {...rest}
    />
  )

  if (!leftIcon) return field

  return (
    <div className="relative flex items-center">
      <span className="pointer-events-none absolute left-2.5 flex text-foreground/40">{leftIcon}</span>
      {field}
    </div>
  )
})
