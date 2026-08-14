'use client'
import type { Suggestion } from '@/lib/progression'

export function SuggestionHint({ suggestion }: { suggestion: Suggestion }) {
  return (
    <div className="border-border bg-surface text-muted hud-clip-sm border p-2 font-mono text-xs">
      <span className="text-system font-medium">Návrh: </span>
      {suggestion.weightKg !== null ? `${suggestion.weightKg} kg × ` : ''}
      {suggestion.reps ?? '?'} <span className="text-muted">· {suggestion.reason}</span>
    </div>
  )
}
