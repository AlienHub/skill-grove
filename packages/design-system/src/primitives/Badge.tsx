import type { HTMLAttributes } from 'react'
import { cn } from './cn'

export type BadgeTone = 'accent' | 'success' | 'info' | 'destructive' | 'neutral'
export type BadgeVariant = 'soft' | 'outline' | 'solid'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Semantic meaning — drives the color, never a raw hue. */
  tone?: BadgeTone
  /** `soft` = tinted bg + tinted text (default), `outline` = bordered,
   *  `solid` = filled status pill. */
  variant?: BadgeVariant
  /** Leading status dot (soft/outline only). */
  dot?: boolean
}

const BASE =
  'inline-flex items-center gap-1.5 h-5 px-2 text-[11px] font-medium rounded-[6px] whitespace-nowrap'

// soft = color-mix tint toward background + status-text token (more legible on body).
const SOFT: Record<BadgeTone, string> = {
  accent: 'bg-[color-mix(in_srgb,var(--accent)_14%,var(--background))] text-accent',
  success:
    'bg-[color-mix(in_srgb,var(--success)_14%,var(--background))] text-[var(--success-text)]',
  info: 'bg-[color-mix(in_srgb,var(--info)_16%,var(--background))] text-[var(--info-text)]',
  destructive:
    'bg-[color-mix(in_srgb,var(--destructive)_14%,var(--background))] text-[var(--destructive-text)]',
  neutral: 'bg-foreground-10 text-foreground-70',
}

const OUTLINE: Record<BadgeTone, string> = {
  accent: 'border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] text-accent',
  success: 'border border-[color-mix(in_srgb,var(--success)_40%,transparent)] text-[var(--success-text)]',
  info: 'border border-[color-mix(in_srgb,var(--info)_40%,transparent)] text-[var(--info-text)]',
  destructive:
    'border border-[color-mix(in_srgb,var(--destructive)_40%,transparent)] text-[var(--destructive-text)]',
  neutral: 'border border-border text-foreground-60',
}

const SOLID: Record<BadgeTone, string> = {
  accent: 'bg-accent text-white',
  success: 'bg-success text-white',
  info: 'bg-info text-white',
  destructive: 'bg-destructive text-white',
  neutral: 'bg-foreground text-background',
}

const DOT_COLOR: Record<BadgeTone, string> = {
  accent: 'bg-accent',
  success: 'bg-success',
  info: 'bg-info',
  destructive: 'bg-destructive',
  neutral: 'bg-foreground-40',
}

export function Badge({ tone = 'neutral', variant = 'soft', dot = false, className, children, ...rest }: BadgeProps) {
  const variantClass = variant === 'solid' ? SOLID[tone] : variant === 'outline' ? OUTLINE[tone] : SOFT[tone]
  return (
    <span className={cn(BASE, variantClass, className)} {...rest}>
      {dot && variant !== 'solid' ? (
        <span className={cn('size-1.5 rounded-full', DOT_COLOR[tone])} />
      ) : null}
      {children}
    </span>
  )
}
