import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Teach tailwind-merge the custom theme scales so `rounded-card` and
// `rounded-full` (or `shadow-glow` and `shadow-md`) override each other.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ['card', 'control', 'tick'],
      shadow: ['glow'],
      font: ['display'],
    },
  },
})

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
