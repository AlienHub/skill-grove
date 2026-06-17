import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from './cn'

/** Styled table primitives — hairline separators, `surface-muted` header with
 *  mono labels. Compose them, or use `DefinitionTable` for key/value pairs. */

export function Table({ className, children, ...rest }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-hidden rounded-[12px] border border-border bg-surface">
      <table className={cn('w-full border-collapse', className)} {...rest}>
        {children}
      </table>
    </div>
  )
}

export function THead({ className, children, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn('bg-[var(--surface-muted)]', className)} {...rest}>
      {children}
    </thead>
  )
}

export function TH({ className, children, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'px-4 py-2.5 text-left font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-foreground-50',
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  )
}

export function TR({ className, children, ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('border-t border-border first:border-t-0', className)} {...rest}>
      {children}
    </tr>
  )
}

export function TD({ className, children, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('px-4 py-3 text-[12.5px] text-foreground/80', className)} {...rest}>
      {children}
    </td>
  )
}

export interface DefinitionRow {
  label: ReactNode
  value: ReactNode
}

/** Key/value table — `surface-muted` label column + mono-friendly value column. */
export function DefinitionTable({ rows, className }: { rows: DefinitionRow[]; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-[12px] border border-border bg-surface', className)}>
      <table className="w-full border-collapse">
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border first:border-t-0">
              <td className="w-[120px] border-r border-border bg-[var(--surface-muted)] px-4 py-2.5 text-[12px] text-foreground-50">
                {row.label}
              </td>
              <td className="px-4 py-2.5 text-[12px] text-foreground-70">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
