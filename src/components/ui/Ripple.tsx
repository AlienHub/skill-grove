export function Ripple({
  className = '',
  size = 16,
}: {
  className?: string
  size?: number
}) {
  return (
    <span
      aria-hidden="true"
      className={`ripple-loader ${className}`}
      style={{ height: size, width: size }}
    >
      <span />
      <span />
    </span>
  )
}
