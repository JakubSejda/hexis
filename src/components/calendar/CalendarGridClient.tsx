'use client'

import { useState, type MouseEvent } from 'react'
import { CalendarGrid } from './CalendarGrid'
import { DayDetailModal } from './DayDetailModal'
import type { CalendarDay } from '@/lib/calendar/types'

type Props = { days: CalendarDay[] }

export function CalendarGridClient({ days }: Props) {
  const [openDate, setOpenDate] = useState<string | null>(null)

  function onClickDay(e: MouseEvent<HTMLDivElement>) {
    const target = (e.target as HTMLElement).closest('[data-date]')
    if (!target) return
    const date = target.getAttribute('data-date')
    if (!date) return
    setOpenDate(date)
  }

  return (
    <div onClick={onClickDay}>
      <CalendarGrid days={days} />
      <DayDetailModal date={openDate} onClose={() => setOpenDate(null)} />
    </div>
  )
}
