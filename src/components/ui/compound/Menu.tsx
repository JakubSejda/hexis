'use client'
import * as MenuPrimitive from '@radix-ui/react-dropdown-menu'
import type { ComponentProps } from 'react'
import { cn } from '../utils/cn'

function Root(props: ComponentProps<typeof MenuPrimitive.Root>) {
  return <MenuPrimitive.Root {...props} />
}

function Trigger({ className, ...rest }: ComponentProps<typeof MenuPrimitive.Trigger>) {
  return (
    <MenuPrimitive.Trigger
      className={cn(
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        className
      )}
      {...rest}
    />
  )
}

function Content({
  className,
  sideOffset = 6,
  ...rest
}: ComponentProps<typeof MenuPrimitive.Content>) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          'border-border bg-surface-raised text-foreground z-50 min-w-[160px] rounded-md border p-1 shadow-lg',
          className
        )}
        {...rest}
      />
    </MenuPrimitive.Portal>
  )
}

type ItemVariant = 'default' | 'danger'

type ItemProps = Omit<ComponentProps<typeof MenuPrimitive.Item>, 'className'> & {
  variant?: ItemVariant
  className?: string
}

const ITEM_BASE =
  'flex cursor-pointer items-center rounded px-2 py-1.5 text-sm outline-none select-none data-[highlighted]:bg-border data-[disabled]:pointer-events-none data-[disabled]:opacity-40'

const ITEM_VARIANT: Record<ItemVariant, string> = {
  default: 'text-foreground',
  danger: 'text-danger',
}

function Item({ variant = 'default', className, ...rest }: ItemProps) {
  return (
    <MenuPrimitive.Item className={cn(ITEM_BASE, ITEM_VARIANT[variant], className)} {...rest} />
  )
}

function Separator({ className, ...rest }: ComponentProps<typeof MenuPrimitive.Separator>) {
  return <MenuPrimitive.Separator className={cn('bg-border my-1 h-px', className)} {...rest} />
}

export const Menu = { Root, Trigger, Content, Item, Separator }
