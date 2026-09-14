'use client'

import { useState } from 'react'
import { CalendarGrid } from './CalendarGrid'
import { DayDetailModal } from './DayDetailModal'
import type { CalendarDay } from '@/lib/calendar/types'

type Props = { days: CalendarDay[] }

export function CalendarGridClient({ days }: Props) {
  const [openDate, setOpenDate] = useState<string | null>(null)

  // Each day is its own button (WIG audit, finding 22). This used to be a
  // click handler on a wrapping <div>, which no keyboard could reach.
  return (
    <div>
      <CalendarGrid days={days} onSelect={setOpenDate} />
      <DayDetailModal date={openDate} onClose={() => setOpenDate(null)} />
    </div>
  )
}
