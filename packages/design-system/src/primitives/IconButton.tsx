import { forwardRef } from 'react'
import { Button } from './Button'
import type { ButtonProps } from './Button'

/** Square, icon-only button. A thin wrapper over `Button` with `iconOnly` set,
 *  so it shares the exact same variants, sizes, focus ring and loading state.
 *  Defaults to `ghost` — the common toolbar / panel-header treatment.
 *  Pass an `aria-label`; there is no text label to describe the action. */
export type IconButtonProps = Omit<ButtonProps, 'iconOnly' | 'leftIcon' | 'rightIcon'>

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = 'ghost', size = 'md', ...rest },
  ref,
) {
  return <Button ref={ref} iconOnly variant={variant} size={size} {...rest} />
})
