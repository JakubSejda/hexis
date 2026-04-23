'use client'
import { useRef } from 'react'

export function useLongPress(onLongPress: () => void, ms = 500) {
  const timer = useRef<number | null>(null)
  const start = () => {
    timer.current = window.setTimeout(onLongPress, ms)
  }
  const clear = () => {
    if (timer.current !== null) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }
  return {
    onPointerDown: start,
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
  }
}
