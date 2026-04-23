'use client'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import type { ComponentProps } from 'react'
import { cn } from '@/components/ui/utils/cn'

function Root(props: ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root {...props} />
}

function List({ className, ...rest }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn('bg-surface flex gap-1 rounded-lg p-1', className)}
      {...rest}
    />
  )
}

function Trigger({ className, ...rest }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'text-muted hover:text-foreground focus-visible:ring-ring flex-1 rounded-md px-3 py-1.5 text-center text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none',
        'data-[state=active]:bg-primary data-[state=active]:text-background data-[state=active]:font-semibold',
        className
      )}
      {...rest}
    />
  )
}

function Content({ className, ...rest }: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('focus-visible:outline-none', className)} {...rest} />
}

export const Tabs = { Root, List, Trigger, Content }
