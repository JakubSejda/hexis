import {
  forwardRef,
  type ReactNode,
  type ButtonHTMLAttributes,
  type AnchorHTMLAttributes,
  type MouseEvent,
} from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../utils/cn'

type Variant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'outline'
  | 'danger-outline'
  | 'dashed'
type Size = 'sm' | 'md' | 'lg'

/**
 * D grammar: accent = action (primary + success both act — one loud colour for
 * "do the thing"), system = the blue secondary. Reference:
 * docs/design/2026-11-redesign-d/D-kombinace.html
 */
const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'bg-accent text-accent-foreground shadow-glow hover:bg-accent-muted',
  success: 'bg-accent text-accent-foreground shadow-glow hover:bg-accent-muted',
  secondary: 'border border-system text-system hover:bg-system-soft',
  ghost: 'text-foreground hover:bg-surface-raised',
  danger: 'bg-danger text-background hover:opacity-90',
  outline: 'bg-surface-raised text-foreground hover:bg-border',
  'danger-outline': 'border border-danger text-danger hover:bg-danger/10',
  dashed: 'border border-dashed border-border text-muted hover:bg-surface-raised',
}

const SIZE_CLASS: Record<Size, string> = {
  sm: 'h-9 px-4 text-xs',
  md: 'h-11 px-5 text-xs',
  lg: 'h-14 px-6 text-base',
}

const BASE =
  'font-display inline-flex items-center whitespace-nowrap justify-center gap-2 rounded-full font-black uppercase transition-[color,background-color,transform] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'

type CommonProps = {
  variant?: Variant
  size?: Size
  loading?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
  children: ReactNode
  className?: string
}

type ButtonAsButton = CommonProps & { as?: 'button' } & Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    keyof CommonProps
  >
type ButtonAsAnchor = CommonProps & { as: 'a' } & Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    keyof CommonProps
  >

export type ButtonProps = ButtonAsButton | ButtonAsAnchor

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(props, ref) {
    const {
      as,
      variant = 'primary',
      size = 'md',
      loading = false,
      iconLeft,
      iconRight,
      className,
      children,
      ...rest
    } = props

    const classes = cn(BASE, VARIANT_CLASS[variant], SIZE_CLASS[size], className)

    const content = loading ? (
      <>
        <Loader2 data-testid="button-spinner" className="animate-spin" size={16} />
        {children}
      </>
    ) : (
      <>
        {iconLeft}
        {children}
        {iconRight}
      </>
    )

    if (as === 'a') {
      const anchorRest = rest as AnchorHTMLAttributes<HTMLAnchorElement>
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={classes}
          aria-busy={loading || undefined}
          {...anchorRest}
        >
          {content}
        </a>
      )
    }

    const {
      onClick,
      disabled: userDisabled,
      ...buttonRest
    } = rest as ButtonHTMLAttributes<HTMLButtonElement>
    const handleClick = loading
      ? undefined
      : (onClick as ((e: MouseEvent<HTMLButtonElement>) => void) | undefined)

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        className={classes}
        aria-busy={loading || undefined}
        disabled={loading || userDisabled}
        onClick={handleClick}
        {...buttonRest}
      >
        {content}
      </button>
    )
  }
)
