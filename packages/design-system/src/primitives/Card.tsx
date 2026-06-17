import { forwardRef } from 'react'
import type { HTMLAttributes } from 'react'
import { cn } from './cn'

export type CardVariant = 'elevated' | 'outlined' | 'muted' | 'subtle'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** `elevated` = raised surface + shadow (default card),
   *  `outlined` = border only (nested / dense lists),
   *  `muted` / `subtle` = tinted secondary fills. */
  variant?: CardVariant
  /** Apply the standard card padding (`px-4 py-3`). Turn off for custom layouts
   *  (e.g. a card that hosts a full-bleed header/footer). */
  padding?: boolean
}

const VARIANTS: Record<CardVariant, string> = {
  elevated: 'bg-surface shadow-[var(--shadow-minimal)]',
  outlined: 'bg-surface border border-border',
  muted: 'bg-[var(--surface-muted)] border border-border',
  subtle: 'bg-[var(--surface-subtle)] border border-border',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'elevated', padding = true, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn('rounded-[12px]', VARIANTS[variant], padding && 'px-4 py-3', className)}
      {...rest}
    />
  )
})
