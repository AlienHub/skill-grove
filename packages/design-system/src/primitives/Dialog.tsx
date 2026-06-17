import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

export interface DialogProps {
  open: boolean
  onClose: () => void
  /** Width of the panel. Default 420px. */
  width?: number
  children: ReactNode
}

/** Modal dialog. Renders a `foreground/40` scrim at `z-modal` and a centered
 *  `surface` panel with `shadow-modal-small`. Compose with the sub-components:
 *  Dialog.Header / Title / Description / Body / Footer. */
export function Dialog({ open, onClose, width = 420, children }: DialogProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-modal grid place-items-center bg-foreground/40 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{ width: `min(92vw, ${width}px)` }}
        className="rounded-[12px] border border-border bg-surface shadow-[var(--shadow-modal-small)]"
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

function Header({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-5 pt-[18px]', className)} {...rest}>
      {children}
    </div>
  )
}

function Title({ className, children, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn('text-[15px] font-semibold text-foreground', className)} {...rest}>
      {children}
    </h2>
  )
}

function Description({ className, children, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('mt-2 text-[12.5px] leading-relaxed text-foreground-60', className)} {...rest}>
      {children}
    </p>
  )
}

function Body({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-5 py-4 text-[12.5px] leading-relaxed text-foreground-70', className)} {...rest}>
      {children}
    </div>
  )
}

function Footer({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex justify-end gap-2 border-t border-border px-5 py-3.5', className)} {...rest}>
      {children}
    </div>
  )
}

Dialog.Header = Header
Dialog.Title = Title
Dialog.Description = Description
Dialog.Body = Body
Dialog.Footer = Footer
