export function SettingsEntry({
  badge,
  icon = 'settings',
  isSelected,
  label,
  onClick,
}: {
  badge?: string
  icon?: 'agent-skill' | 'home' | 'settings'
  isSelected: boolean
  label: string
  onClick: () => void
}) {
  const iconPath = icon === 'agent-skill'
    ? 'M3.75 6.75a2 2 0 0 1 2-2h3.15c.44 0 .86.15 1.19.42l1.14.91c.33.27.75.42 1.18.42h5.84a2 2 0 0 1 2 2v1.25M4.5 9.75h15a1.5 1.5 0 0 1 1.47 1.8l-1.35 6.75a2 2 0 0 1-1.96 1.6H6.34a2 2 0 0 1-1.96-1.6L3.03 11.55a1.5 1.5 0 0 1 1.47-1.8Z'
    : icon === 'home'
      ? 'M3.75 10.75 12 4l8.25 6.75M5.75 9.75v8.5a1.5 1.5 0 0 0 1.5 1.5h9.5a1.5 1.5 0 0 0 1.5-1.5v-8.5'
      : 'M10.325 4.317a1.724 1.724 0 0 1 3.35 0 1.724 1.724 0 0 0 2.573 1.066 1.724 1.724 0 0 1 2.898 1.93 1.724 1.724 0 0 0 .75 2.692 1.724 1.724 0 0 1 0 2.99 1.724 1.724 0 0 0-.75 2.692 1.724 1.724 0 0 1-2.898 1.93 1.724 1.724 0 0 0-2.573 1.066 1.724 1.724 0 0 1-3.35 0 1.724 1.724 0 0 0-2.573-1.066 1.724 1.724 0 0 1-2.898-1.93 1.724 1.724 0 0 0-.75-2.692 1.724 1.724 0 0 1 0-2.99 1.724 1.724 0 0 0 .75-2.692 1.724 1.724 0 0 1 2.898-1.93 1.724 1.724 0 0 0 2.573-1.066Z'

  return (
    <button
      className="w-full cursor-pointer text-left"
      onClick={onClick}
      type="button"
    >
      <div
        className={`rounded-[8px] px-4 py-3 transition-colors ${
          isSelected
            ? 'bg-[color-mix(in_srgb,var(--foreground)_3%,var(--background))]'
            : 'bg-transparent hover:bg-[color-mix(in_srgb,var(--foreground)_1.5%,var(--background))]'
        }`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <svg
            aria-hidden="true"
            className="size-4 shrink-0 text-foreground/62"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d={iconPath}
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
            {icon === 'settings' ? (
              <path
                d="M12 15.25A3.25 3.25 0 1 0 12 8.75a3.25 3.25 0 0 0 0 6.5Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            ) : null}
            {icon === 'home' ? (
              <path
                d="M9.75 19.75v-5.25h4.5v5.25"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            ) : null}
          </svg>
          <h2 className="min-w-0 flex-1 truncate text-[14px] font-normal text-foreground">{label}</h2>
          {badge ? (
            <span className="shrink-0 rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-medium text-foreground/56">
              {badge}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  )
}
