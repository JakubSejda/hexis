'use client'
import type { Suggestion } from '@/lib/progression'

export function SuggestionHint({ suggestion }: { suggestion: Suggestion }) {
  return (
    <div className="bg-system-soft/50 text-muted-strong rounded-control px-3 py-2 text-xs">
      <span className="text-system font-semibold">Návrh Systému: </span>
      {suggestion.weightKg !== null ? `${suggestion.weightKg} kg × ` : ''}
      {suggestion.reps ?? '?'} <span className="text-muted">· {suggestion.reason}</span>
    </div>
  )
}
