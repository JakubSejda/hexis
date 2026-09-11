/**
 * Keyboard users land on the skip link first and jump past the sidebar, header
 * and bottom nav straight to `#main`. Off-canvas rather than hidden — a
 * `display: none` link cannot take focus.
 */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="hud-clip-sm focus-visible:bg-system focus-visible:text-background sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-50 focus-visible:px-4 focus-visible:py-2 focus-visible:font-mono focus-visible:text-xs focus-visible:tracking-[0.2em] focus-visible:uppercase"
    >
      Přeskočit na obsah
    </a>
  )
}
