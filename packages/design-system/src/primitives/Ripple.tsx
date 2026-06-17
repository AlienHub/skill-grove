/** Ripple — the design-system's signature loader: two concentric rings that
 *  expand and fade with a -0.6s phase offset. Inherits `currentColor`, so it
 *  takes the text color of its context (e.g. `text-background/72` on a solid
 *  button, `text-foreground/48` on a panel).
 *
 *  Requires the `.ripple-loader` keyframes from the package stylesheet
 *  (tokens/components layer). See README. */
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
