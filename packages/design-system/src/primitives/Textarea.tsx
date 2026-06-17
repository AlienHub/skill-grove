import { forwardRef } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import { cn } from './cn'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Error state — red border + red focus ring. */
  error?: boolean
}

const BASE =
  'w-full rounded-[8px] border bg-[var(--surface)] px-3 py-2 text-[12px] leading-relaxed text-foreground ' +
  'placeholder:text-foreground/40 outline-none transition-colors resize-y min-h-[84px] ' +
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--surface-muted)] disabled:resize-none'

const STATE = {
  normal: 'border-input focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/35',
  error: 'border-destructive focus-visible:ring-2 focus-visible:ring-destructive/28',
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { error = false, className, ...rest },
  ref,
) {
  return (
    <textarea ref={ref} className={cn(BASE, error ? STATE.error : STATE.normal, className)} {...rest} />
  )
})
