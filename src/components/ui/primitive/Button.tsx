import {
  forwardRef,
  type ReactNode,
  type ButtonHTMLAttributes,
  type AnchorHTMLAttributes,
  type MouseEvent,
} from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/components/ui/utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg'

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'bg-accent text-background hover:bg-accent-muted',
  success: 'bg-primary text-background hover:bg-primary-muted',
  secondary: 'border border-primary text-primary hover:bg-primary-soft',
  ghost: 'text-foreground hover:bg-surface-raised',
  danger: 'bg-danger text-background hover:opacity-90',
}

const SIZE_CLASS: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none'

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

    if (props.as === 'a') {
      const { as: _as, ...anchorRest } = rest as AnchorHTMLAttributes<HTMLAnchorElement> & {
        as?: 'a'
      }
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
      as: _as,
      onClick,
      disabled: userDisabled,
      ...buttonRest
    } = rest as ButtonHTMLAttributes<HTMLButtonElement> & { as?: 'button' }
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
