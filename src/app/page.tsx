import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Card, Container, ProgressBar } from '@/components/ui'
import { HexEmblem } from '@/components/dashboard/HexEmblem'

/**
 * Public landing (Reforge R5) — the HUD identity's front door.
 * Logged-in users skip straight to the dashboard.
 */
export default async function Home() {
  const session = await auth()
  if (session?.user) redirect('/dashboard')

  return (
    <main className="min-h-dvh">
      <Container size="md" className="flex min-h-dvh flex-col py-8">
        {/* status strip */}
        <div className="text-muted flex items-center justify-between font-mono text-xs tracking-[0.2em] uppercase">
          <span className="text-accent font-bold">Hexis //</span>
          <span>Friends &amp; family beta</span>
        </div>

        {/* hero */}
        <section className="animate-hud-power-on flex flex-1 flex-col items-center justify-center gap-8 py-16 text-center">
          <HexEmblem level={4} tierColor="#f59e0b" size={140} className="animate-tier-glow" />
          <div>
            <h1 className="text-foreground text-5xl font-black tracking-tight uppercase italic sm:text-6xl">
              Hexis
            </h1>
            <p className="text-system mt-3 font-mono text-sm tracking-[0.2em] uppercase">
              Trénink, návyky a progres jako RPG
            </p>
            <p className="text-muted-strong mx-auto mt-4 max-w-md text-sm leading-relaxed">
              Za skutečnou práci sbíráš XP, levely a odměny. Žádné prázdné body — každá série, každý
              návyk a každé vážení posouvá tvoji postavu dál.
            </p>
          </div>

          {/* mini HUD mock */}
          <Card padding="sm" className="w-full max-w-xs">
            <div className="text-muted flex justify-between font-mono text-[11px] tracking-[0.2em] uppercase">
              <span>Dnešní quest</span>
              <span className="text-system">Lvl 4 · Rookie</span>
            </div>
            <div className="text-foreground mt-2 text-left text-sm font-bold">
              ▸ Lower A — Quad důraz
            </div>
            <div className="mt-2">
              <ProgressBar value={320} max={500} variant="xp" height={6} />
            </div>
            <div className="text-muted-strong mt-1.5 flex justify-between font-mono text-[11px]">
              <span>320 XP</span>
              <span>180 do L5</span>
            </div>
          </Card>

          <div className="flex flex-col items-center gap-2">
            <Link
              href="/login"
              className="hud-clip-sm bg-accent text-background hover:bg-accent-muted inline-flex h-12 items-center px-8 text-base font-semibold tracking-[0.12em] uppercase transition-colors"
            >
              Přihlásit se
            </Link>
            <p className="text-muted font-mono text-xs">Účty zatím rozdáváme osobně.</p>
          </div>
        </section>

        {/* features */}
        <section className="grid gap-3 pb-10 sm:grid-cols-3">
          <Card padding="md">
            <div className="text-system font-mono text-xs tracking-[0.2em] uppercase">
              Denní questy
            </div>
            <p className="text-muted-strong mt-2 text-sm leading-relaxed">
              Tréninkový plán jako mise. Každá zapsaná série znamená XP, rest timer hlídá tempo.
            </p>
          </Card>
          <Card padding="md">
            <div className="text-system font-mono text-xs tracking-[0.2em] uppercase">
              XP &amp; levely
            </div>
            <p className="text-muted-strong mt-2 text-sm leading-relaxed">
              Levely, tiery a odměny, které si sám nastavíš — a vyzvedneš za našetřené XP.
            </p>
          </Card>
          <Card padding="md">
            <div className="text-system font-mono text-xs tracking-[0.2em] uppercase">
              Návyky &amp; progres
            </div>
            <p className="text-muted-strong mt-2 text-sm leading-relaxed">
              Streaky návyků, míry, fotky a quest kalendář — celá cesta na jednom místě.
            </p>
          </Card>
        </section>

        <footer className="text-muted border-border border-t pt-4 pb-2 text-center font-mono text-xs tracking-[0.15em] uppercase">
          Hexis // tvoje cesta · tvoje XP
        </footer>
      </Container>
    </main>
  )
}
