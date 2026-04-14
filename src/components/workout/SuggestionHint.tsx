'use client'
import type { Suggestion } from '@/lib/progression'

export function SuggestionHint({ suggestion }: { suggestion: Suggestion }) {
  return (
    <div className="rounded-md border border-[#1F2733] bg-[#141A22] p-2 text-xs text-[#6B7280]">
      <span className="font-medium text-[#10B981]">Návrh: </span>
      {suggestion.weightKg !== null ? `${suggestion.weightKg} kg × ` : ''}
      {suggestion.reps ?? '?'} <span className="text-[#6B7280]">· {suggestion.reason}</span>
    </div>
  )
}
