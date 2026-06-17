import { cn } from './cn'

export interface SegmentedControlOption<TValue extends string> {
  label: string
  value: TValue
}

export interface SegmentedControlProps<TValue extends string> {
  options: Array<SegmentedControlOption<TValue>>
  value: TValue
  onChange: (value: TValue) => void
  'aria-label'?: string
  className?: string
}

/** Single-choice segmented control. The selected segment lifts onto a
 *  `surface` chip with a hairline shadow; the rest are quiet `foreground/48`. */
export function SegmentedControl<TValue extends string>({
  options,
  value,
  onChange,
  className,
  ...rest
}: SegmentedControlProps<TValue>) {
  return (
    <div
      className={cn(
        'inline-flex overflow-hidden rounded-[8px] border border-border/50 bg-[var(--surface-muted)] p-0.5',
        className,
      )}
      {...rest}
    >
      {options.map((option) => {
        const isSelected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-7 cursor-pointer rounded-[7px] px-3 text-[12px] font-medium transition-colors',
              isSelected
                ? 'bg-[var(--surface)] text-foreground shadow-[var(--shadow-minimal-flat)]'
                : 'text-foreground/48 hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
