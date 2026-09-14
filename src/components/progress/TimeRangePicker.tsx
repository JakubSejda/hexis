'use client'

import { SegmentedControl } from '@/components/ui'

const OPTIONS = [
  { label: '30d', value: '30' },
  { label: '90d', value: '90' },
  { label: '6m', value: '180' },
  { label: '1y', value: '365' },
] as const

type Props = {
  value: number
  onChange: (days: number) => void
}

export function TimeRangePicker({ value, onChange }: Props) {
  return (
    <SegmentedControl
      name="time-range"
      label="Časové období grafu"
      options={OPTIONS}
      value={String(value)}
      onChange={(v) => onChange(Number(v))}
    />
  )
}
