// src/components/shell/use-active-area.ts
'use client'
import { usePathname } from 'next/navigation'
import { AREA_META, type Area } from './area-meta'

export function useActiveArea(): Area | null {
  const pathname = usePathname() ?? ''
  for (const [key, meta] of Object.entries(AREA_META)) {
    if (meta.matches(pathname)) return key as Area
  }
  return null
}
