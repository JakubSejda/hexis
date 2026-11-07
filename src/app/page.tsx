import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Card, Container, Heading, ProgressBar } from '@/components/ui'
import { HexEmblem } from '@/components/dashboard/HexEmblem'

/**
 * Public landing (Reforge R5) — the HUD identity's front door.
 * Logged-in users skip straight to the dashboard.
 */
export default async function Home() {
  const session = await auth()
  if (session?.user) redirect('/dashboard')

  return (
    <main id="main" className="min-h-dvh">
      <Container size="md" className="flex min-h-dvh flex-col py-8">
        {/* status strip */}
        <div className="text-muted flex items-center justify-between text-xs font-semibold tracking-[0.12em] uppercase">
          <span className="text-accent font-bold">Hexis //</span>
          <span>Beta pro přátele a rodinu</span>
        </div>

        {/* hero */}
        <section className="animate-hud-power-on flex flex-1 flex-col items-center justify-center gap-8 py-16 text-center">
          <HexEmblem level={4} tierColor="#7dd3fc" size={140} className="animate-tier-glow" />
          <div>
            <Heading level={1} variant="display" className="text-5xl sm:text-6xl">
              Hexis
            </Heading>
            <p className="text-system mt-3 text-sm font-semibold tracking-[0.12em] uppercase">
              Trénink, návyky a progres jako RPG
            </p>
            <p className="text-muted-strong mx-auto mt-4 max-w-md text-sm leading-relaxed">
              Za skutečnou práci sbíráš XP, levely a odměny. Žádné prázdné body — každá série, každý
              návyk a každé vážení posouvá tvoji postavu dál.
            </p>
          </div>

          {/* mini HUD mock */}
          <Card padding="sm" className="w-full max-w-xs">
            <div className="text-muted flex justify-between text-[11px] font-semibold tracking-[0.12em] uppercase">
              <span>Dnešní quest</span>
              <span className="text-system">Lvl 4 · Nováček</span>
            </div>
            <div className="text-foreground mt-2 text-left text-sm font-bold">
              ▸ Lower A — Quad důraz
            </div>
            <div className="mt-2">
              <ProgressBar value={320} max={500} variant="xp" height={6} />
            </div>
            <div className="text-muted-strong font-display mt-1.5 flex justify-between text-[11px]">
              <span>320 XP</span>
              <span>180 do L5</span>
            </div>
          </Card>

          <div className="flex flex-col items-center gap-2">
            <Link
              href="/login"
              className="rounded-control bg-accent text-accent-foreground hover:bg-accent-muted inline-flex h-12 items-center px-8 text-base font-semibold tracking-[0.12em] uppercase transition-colors"
            >
              Přihlásit se
            </Link>
            <p className="text-muted font-display text-xs">Účty zatím rozdáváme osobně.</p>
          </div>
        </section>

        {/* features */}
        <section className="grid gap-3 pb-10 sm:grid-cols-3">
          <Card padding="md">
            <div className="text-system text-xs font-semibold tracking-[0.12em] uppercase">
              Denní questy
            </div>
            <p className="text-muted-strong mt-2 text-sm leading-relaxed">
              Tréninkový plán jako mise. Každá zapsaná série znamená XP, rest timer hlídá tempo.
            </p>
          </Card>
          <Card padding="md">
            <div className="text-system text-xs font-semibold tracking-[0.12em] uppercase">
              XP &amp; levely
            </div>
            <p className="text-muted-strong mt-2 text-sm leading-relaxed">
              Levely, tiery a odměny, které si sám nastavíš — a vyzvedneš za našetřené XP.
            </p>
          </Card>
          <Card padding="md">
            <div className="text-system text-xs font-semibold tracking-[0.12em] uppercase">
              Návyky &amp; progres
            </div>
            <p className="text-muted-strong mt-2 text-sm leading-relaxed">
              Streaky návyků, míry, fotky a quest kalendář — celá cesta na jednom místě.
            </p>
          </Card>
        </section>

        <footer className="text-muted border-border border-t pt-4 pb-2 text-center text-xs font-semibold tracking-[0.12em] uppercase">
          Hexis // tvoje cesta · tvoje XP
        </footer>
      </Container>
    </main>
  )
}
