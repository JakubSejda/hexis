'use client'

import { useState } from 'react'
import { AnatomicalBody } from './AnatomicalBody'
import { applyHighlights } from '@/lib/anatomy-zones'

type Props = {
  highlights: Record<string, string>
  className?: string
  bodyClassName?: string
}

export function AnatomicalBodyDual({ highlights, className, bodyClassName }: Props) {
  const { front, back } = applyHighlights(highlights)
  const [active, setActive] = useState<'front' | 'back'>('front')

  return (
    <div className={'flex flex-col items-center gap-2 ' + (className ?? '')}>
      <div role="tablist" className="flex gap-1 sm:hidden">
        <button
          type="button"
          role="tab"
          aria-selected={active === 'front'}
          onClick={() => setActive('front')}
          className={
            'rounded-md px-3 py-1 text-xs font-medium ' +
            (active === 'front' ? 'bg-surface text-foreground' : 'text-muted')
          }
        >
          Zepředu
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={active === 'back'}
          onClick={() => setActive('back')}
          className={
            'rounded-md px-3 py-1 text-xs font-medium ' +
            (active === 'back' ? 'bg-surface text-foreground' : 'text-muted')
          }
        >
          Zezadu
        </button>
      </div>
      <div className="flex items-center justify-center gap-2">
        <div className={active === 'front' ? 'block sm:block' : 'hidden sm:block'}>
          <AnatomicalBody
            view="front"
            highlights={front}
            className={bodyClassName}
            ariaLabel="Anatomical body front view"
          />
          <div className="text-muted mt-1 text-center text-[10px]">Zepředu</div>
        </div>
        <div className={active === 'back' ? 'block sm:block' : 'hidden sm:block'}>
          <AnatomicalBody
            view="back"
            highlights={back}
            className={bodyClassName}
            ariaLabel="Anatomical body back view"
          />
          <div className="text-muted mt-1 text-center text-[10px]">Zezadu</div>
        </div>
      </div>
    </div>
  )
}
