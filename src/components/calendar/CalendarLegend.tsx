const ITEMS: Array<{ label: string; dot: string }> = [
  { label: 'Training', dot: 'bg-accent' },
  { label: 'Návyk', dot: 'bg-cal-habit' },
  { label: 'Vážení', dot: 'bg-cal-weigh' },
  { label: 'Foto', dot: 'bg-cal-photo' },
]

export function CalendarLegend() {
  return (
    <div className="text-muted flex flex-wrap items-center gap-4 font-mono text-xs">
      {ITEMS.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-2">
          <span className={`h-[6px] w-[6px] rounded-full ${it.dot}`} aria-hidden />
          {it.label}
        </span>
      ))}
      <span className="inline-flex items-center gap-2">
        <span
          className="border-accent/40 bg-accent/10 inline-block h-3 w-3 rounded-sm border"
          aria-hidden
        />
        3+ den streak
      </span>
    </div>
  )
}
