'use client'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/components/ui/utils/cn'

function Root(props: ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root {...props} />
}

function Item({ className, ...rest }: ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      className={cn('border-border border-b last:border-b-0', className)}
      {...rest}
    />
  )
}

type TriggerProps = Omit<ComponentProps<typeof AccordionPrimitive.Trigger>, 'children'> & {
  children: ReactNode
  className?: string
}

function Trigger({ children, className, ...rest }: TriggerProps) {
  return (
    <AccordionPrimitive.Header>
      <AccordionPrimitive.Trigger
        className={cn(
          'text-foreground focus-visible:ring-ring group flex w-full items-center justify-between py-3 text-left text-sm font-medium focus-visible:ring-2 focus-visible:outline-none',
          className
        )}
        {...rest}
      >
        {children}
        <ChevronDown
          size={16}
          className="text-muted transition-transform duration-200 group-data-[state=open]:rotate-180"
          aria-hidden
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function Content({ className, ...rest }: ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content className={cn('text-muted pb-3 text-sm', className)} {...rest} />
  )
}

export const Accordion = { Root, Item, Trigger, Content }
