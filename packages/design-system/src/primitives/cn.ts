/** Tiny classname joiner — filters falsy parts so callers can pass
 *  conditional / possibly-undefined classes without guards. Later parts win
 *  only by source order (no Tailwind conflict resolution); keep variant maps
 *  non-overlapping and let an explicit `className` prop append at the end. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
