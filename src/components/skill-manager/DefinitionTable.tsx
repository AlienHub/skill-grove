import { type DefinitionRow } from '../../skill-manager/types'

export function DefinitionTable({ rows }: { rows: DefinitionRow[] }) {
  return (
    <div className="border-y border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]">
      <dl className="divide-y divide-[color-mix(in_srgb,var(--foreground)_7%,transparent)]">
        {rows.map((row) => (
          <div
            className="grid grid-cols-[84px_minmax(0,1fr)] gap-3 py-2 sm:grid-cols-[96px_minmax(0,1fr)]"
            key={row.label}
          >
            <dt className="text-[12px] text-foreground/48">{row.label}</dt>
            <dd className="min-w-0 whitespace-pre-wrap break-words text-[12px] text-foreground/84">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
