import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

export type ButtonVariant = 'solid' | 'ghost' | 'outline' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. `solid` = primary action, `outline` = secondary,
   *  `ghost` = low-emphasis, `destructive` = dangerous action. */
  variant?: ButtonVariant
  /** Control height/padding scale. `md` (h-8) is the app default. */
  size?: ButtonSize
  /** Square icon-only button (no horizontal padding). Pass the icon as children. */
  iconOnly?: boolean
  /** Show a spinner and disable interaction. */
  loading?: boolean
  /** Element rendered before the label (replaced by the spinner while loading). */
  leftIcon?: ReactNode
  /** Element rendered after the label. */
  rightIcon?: ReactNode
}

/** Self-contained spinner — pure Tailwind, no design-system CSS class needed,
 *  so a button renders correctly even in a project that only imports tokens. */
function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-3.5 animate-spin rounded-full border-[1.5px] border-current border-t-transparent"
    />
  )
}

const BASE =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-[8px] font-medium ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/35 disabled:cursor-not-allowed'

const VARIANTS: Record<ButtonVariant, string> = {
  // bg-foreground / text-background flips correctly in dark mode via tokens.
  solid: 'bg-foreground text-background transition-opacity hover:opacity-88 disabled:opacity-45',
  outline:
    'border border-border/50 bg-[var(--surface)] text-foreground transition-colors ' +
    'hover:bg-foreground/5 disabled:text-foreground/35',
  ghost:
    'text-foreground/52 transition-colors hover:bg-foreground/5 hover:text-foreground disabled:opacity-45',
  // Was a raw `bg-[#b04a3a]` hex across the app — now the semantic token.
  destructive: 'bg-destructive text-white transition-opacity hover:opacity-90 disabled:opacity-55',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-7 px-2 text-[11px]',
  md: 'h-8 px-3 text-[12px]',
  lg: 'h-9 px-4 text-[13px]',
}

const ICON_SIZES: Record<ButtonSize, string> = {
  sm: 'size-7 text-[11px]',
  md: 'size-8 text-[12px]',
  lg: 'size-9 text-[13px]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'solid',
    size = 'md',
    iconOnly = false,
    loading = false,
    leftIcon,
    rightIcon,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(BASE, VARIANTS[variant], iconOnly ? ICON_SIZES[size] : SIZES[size], className)}
      {...rest}
    >
      {loading ? <Spinner /> : leftIcon}
      {children}
      {!loading ? rightIcon : null}
    </button>
  )
})
