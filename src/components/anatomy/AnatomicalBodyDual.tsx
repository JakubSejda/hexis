'use client'

import { useState } from 'react'
import { SegmentedControl } from '@/components/ui'
import { AnatomicalBody } from './AnatomicalBody'
import { applyHighlights } from '@/lib/anatomy-zones'

const VIEWS = [
  { label: 'Zepředu', value: 'front' },
  { label: 'Zezadu', value: 'back' },
] as const

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
      <SegmentedControl
        name="anatomy-view"
        label="Pohled na tělo"
        options={VIEWS}
        value={active}
        onChange={(v) => setActive(v as 'front' | 'back')}
        className="sm:hidden"
      />
      <div className="flex items-center justify-center gap-2">
        <div className={active === 'front' ? 'block sm:block' : 'hidden sm:block'}>
          <AnatomicalBody
            view="front"
            highlights={front}
            className={bodyClassName}
            ariaLabel="Anatomical body front view"
          />
          <div className="text-muted mt-1 text-center text-xs">Zepředu</div>
        </div>
        <div className={active === 'back' ? 'block sm:block' : 'hidden sm:block'}>
          <AnatomicalBody
            view="back"
            highlights={back}
            className={bodyClassName}
            ariaLabel="Anatomical body back view"
          />
          <div className="text-muted mt-1 text-center text-xs">Zezadu</div>
        </div>
      </div>
    </div>
  )
}
