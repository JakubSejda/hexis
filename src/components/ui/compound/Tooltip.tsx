'use client'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import type { ReactElement } from 'react'

type Side = 'top' | 'right' | 'bottom' | 'left'

type TooltipProps = {
  content: string
  side?: Side
  children: ReactElement
}

export function Tooltip({ content, side = 'top', children }: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={0}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={6}
            className="border-border bg-surface-raised text-foreground z-50 max-w-[240px] rounded-md border px-2 py-1 text-xs shadow-lg"
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-surface-raised" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

export const TooltipProvider = TooltipPrimitive.Provider
export const TooltipRoot = TooltipPrimitive.Root
export const TooltipTrigger = TooltipPrimitive.Trigger
export const TooltipContent = TooltipPrimitive.Content
