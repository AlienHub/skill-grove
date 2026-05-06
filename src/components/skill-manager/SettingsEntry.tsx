export function SettingsEntry({
  isSelected,
  onClick,
}: {
  isSelected: boolean
  onClick: () => void
}) {
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
        <div className="flex items-center gap-2">
          <svg
            aria-hidden="true"
            className="size-4 shrink-0 text-foreground/62"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="M10.325 4.317a1.724 1.724 0 0 1 3.35 0 1.724 1.724 0 0 0 2.573 1.066 1.724 1.724 0 0 1 2.898 1.93 1.724 1.724 0 0 0 .75 2.692 1.724 1.724 0 0 1 0 2.99 1.724 1.724 0 0 0-.75 2.692 1.724 1.724 0 0 1-2.898 1.93 1.724 1.724 0 0 0-2.573 1.066 1.724 1.724 0 0 1-3.35 0 1.724 1.724 0 0 0-2.573-1.066 1.724 1.724 0 0 1-2.898-1.93 1.724 1.724 0 0 0-.75-2.692 1.724 1.724 0 0 1 0-2.99 1.724 1.724 0 0 0 .75-2.692 1.724 1.724 0 0 1 2.898-1.93 1.724 1.724 0 0 0 2.573-1.066Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
            <path
              d="M12 15.25A3.25 3.25 0 1 0 12 8.75a3.25 3.25 0 0 0 0 6.5Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
          <h2 className="text-[14px] font-normal text-foreground">设置</h2>
        </div>
      </div>
    </button>
  )
}
