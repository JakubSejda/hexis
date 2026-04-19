'use client'
import type { Suggestion } from '@/lib/progression'

export function SuggestionHint({ suggestion }: { suggestion: Suggestion }) {
  return (
    <div className="border-border bg-surface text-muted rounded-md border p-2 text-xs">
      <span className="text-primary font-medium">Návrh: </span>
      {suggestion.weightKg !== null ? `${suggestion.weightKg} kg × ` : ''}
      {suggestion.reps ?? '?'} <span className="text-muted">· {suggestion.reason}</span>
    </div>
  )
}
