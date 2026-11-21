import Image from 'next/image'
import { redirect } from 'next/navigation'
import {
  CalendarDays,
  Camera,
  Dumbbell,
  Flame,
  Gift,
  Salad,
  Smartphone,
  Timer,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { auth } from '@/lib/auth'
import { XP_DELTAS } from '@/lib/xp-events'
import { TIERS } from '@/lib/tiers'
import { Button, Card, Container, Heading, ProgressBar, cn } from '@/components/ui'
import { RankLens, TONE_TEXT, tierTone } from '@/components/dashboard/RankLens'

/**
 * Public landing in the D grammar (docs/design/2026-11-redesign-d).
 * Logged-in users skip straight to the dashboard.
 */
export default async function Home() {
  const session = await auth()
  if (session?.user) redirect('/dashboard')

  return (
    <div className="overflow-x-clip">
      <SiteHeader />
      <main id="main">
        <Hero />
        <Attributes />
        <HowItWorks />
        <XpTable />
        <Tiers />
        <Features />
        <Pwa />
        <FinalCta />
      </main>
      <footer className="border-border border-t">
        <Container
          size="full"
          className="text-muted mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 py-6 text-xs sm:flex-row"
        >
          <span className="font-display text-foreground font-black tracking-wide uppercase">
            Hexis
          </span>
          <span>Fitness RPG · uzavřená beta · 2026</span>
          <a href="/login" className="hover:text-foreground font-semibold transition-colors">
            Přihlásit se
          </a>
        </Container>
      </footer>
    </div>
  )
}

const nf = new Intl.NumberFormat('cs-CZ')
const ROMAN = ['I', 'II', 'III', 'IV', 'V'] as const

function SiteHeader() {
  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-30 border-b backdrop-blur-md">
      <Container size="full" className="mx-auto flex h-16 max-w-6xl items-center justify-between">
        <a
          href="#main"
          className="font-display text-lg font-black tracking-wide uppercase"
          aria-label="Hexis, na začátek stránky"
        >
          Hexis<span className="text-accent">.</span>
        </a>
        <nav aria-label="Hlavní" className="flex items-center gap-1 sm:gap-2">
          <a
            href="#jak"
            className="text-muted-strong hover:text-foreground hidden px-3 text-sm font-semibold transition-colors sm:inline"
          >
            Jak to funguje
          </a>
          <a
            href="#funkce"
            className="text-muted-strong hover:text-foreground hidden px-3 text-sm font-semibold transition-colors sm:inline"
          >
            Funkce
          </a>
          <Button as="a" href="/login" variant="secondary" size="sm">
            Přihlásit se
          </Button>
        </nav>
      </Container>
    </header>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-system text-xs font-bold tracking-[0.16em] uppercase">{children}</p>
}

function SectionTitle({
  id,
  eyebrow,
  title,
  lead,
}: {
  id: string
  eyebrow: string
  title: React.ReactNode
  lead?: string
}) {
  return (
    <div className="max-w-2xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <Heading
        level={2}
        id={id}
        className="font-display mt-3 text-3xl leading-[1.05] font-black uppercase sm:text-4xl"
      >
        {title}
      </Heading>
      {lead && <p className="text-muted-strong mt-4 text-base leading-relaxed">{lead}</p>}
    </div>
  )
}

function Hero() {
  return (
    <section className="relative">
      <Container
        size="full"
        className="mx-auto grid max-w-6xl items-center gap-6 pt-6 pb-16 md:grid-cols-[1.1fr_1fr] md:gap-10 md:pt-12 md:pb-24"
      >
        <div className="animate-hud-power-on relative z-10 order-2 min-w-0 md:order-1">
          <span className="border-system/40 bg-system-soft/60 text-system inline-flex h-7 items-center gap-2 rounded-full border px-3 text-xs font-bold">
            <span aria-hidden className="bg-accent animate-hud-pulse h-1.5 w-1.5 rounded-full" />
            Uzavřená beta
          </span>
          <Heading
            level={1}
            className="font-display mt-5 text-[2.2rem] leading-[0.95] font-black uppercase sm:text-6xl md:text-[3.25rem] lg:text-7xl"
          >
            Z&nbsp;tréninku <br />
            se stane <span className="text-accent hero-level">hra</span>
          </Heading>
          <p className="text-muted-strong mt-5 max-w-md text-base leading-relaxed sm:text-lg">
            Hexis promění každou sérii, jídlo i&nbsp;návyk v&nbsp;XP. Tvoje postava roste
            s&nbsp;tebou: level, tier a&nbsp;čtyři atributy, které nejdou ošidit.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button as="a" href="/login" size="lg">
              Přihlásit se
            </Button>
            <Button as="a" href="#jak" variant="secondary" size="lg">
              Jak to funguje
            </Button>
          </div>
          <p className="text-muted mt-4 text-sm">
            Účty zatím rozdáváme osobně, přátelům a&nbsp;rodině.
          </p>
        </div>

        <div className="relative order-1 min-w-0 md:order-2">
          <div className="relative -mx-4 h-[24rem] sm:h-[30rem] md:mx-0 md:h-[34rem]">
            <Image
              src="/images/hero-player.svg"
              alt="Postava hráče Hexisu v modré záři"
              fill
              priority
              unoptimized
              sizes="(min-width: 768px) 50vw, 100vw"
              className="landing-art object-cover object-[center_20%]"
            />
            <span aria-hidden className="hero-glow absolute inset-0" />
          </div>
          <CharacterCard className="absolute right-0 bottom-2 left-0 mx-auto max-w-sm md:right-auto md:bottom-10 md:-left-12 md:w-96" />
        </div>
      </Container>
    </section>
  )
}

/** Static sample of the hub's character readout. */
function CharacterCard({ className }: { className?: string }) {
  const level = 17
  const xp = 26_950
  const next = level * level * 100
  return (
    <Card
      padding="md"
      className={cn(
        'bg-surface/90 border-border animate-hud-power-on border shadow-lg backdrop-blur-md',
        className
      )}
      aria-label="Ukázka postavy"
    >
      <div className="flex items-center gap-4">
        <RankLens label="III" tone="b" title="Tier Bojovník" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-display text-xl font-black uppercase">Level {level}</span>
            <span className="text-rank-b text-sm font-bold">Bojovník</span>
          </div>
          <ProgressBar
            value={xp - 25_600}
            max={next - 25_600}
            variant="xp"
            height={8}
            label="XP do dalšího levelu"
          />
          <div className="text-muted mt-1.5 flex justify-between text-xs font-semibold">
            <span>
              <b className="text-reward">{nf.format(xp)}</b> XP
            </span>
            <span>
              {nf.format(next - xp)} do levelu {level + 1}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

const ATTRS = [
  {
    short: 'SÍL',
    label: 'Síla',
    value: 14,
    width: 'w-[78%]',
    text: 'Roste s objemem tréninku: kila krát opakování za celou dobu.',
  },
  {
    short: 'VIT',
    label: 'Vitalita',
    value: 9,
    width: 'w-[50%]',
    text: 'Za zapsané jídlo a pravidelné vážení. Tělo není jen činka.',
  },
  {
    short: 'VÝD',
    label: 'Výdrž',
    value: 11,
    width: 'w-[61%]',
    text: 'Za každou odjetou sérii. Tisíc sérií se pozná.',
  },
  {
    short: 'DIS',
    label: 'Disciplína',
    value: 12,
    width: 'w-[67%]',
    text: 'Za pravidelné tréninky a nepřerušené návyky.',
  },
] as const

function Attributes() {
  return (
    <section aria-labelledby="atributy" className="py-16 md:py-24">
      <Container
        size="full"
        className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_1.1fr] md:items-center"
      >
        <SectionTitle
          id="atributy"
          eyebrow="Tvoje postava"
          title={<>Čtyři atributy. Žádné zkratky.</>}
          lead="Atributy se počítají z toho, co opravdu zapíšeš. Každý roste z jiného zvyku, takže postava odměňuje vyvážený režim, ne jeden trik."
        />
        <div className="grid grid-cols-2 gap-3">
          {ATTRS.map((a) => (
            <Card key={a.short} padding="md" className="border-border border">
              <div className="flex items-baseline justify-between">
                <span className="text-muted text-xs font-bold tracking-[0.14em]">{a.short}</span>
                <span className="font-display hero-level text-3xl leading-none font-black">
                  {a.value}
                </span>
              </div>
              <div className="bg-surface-raised mt-3 h-1.5 overflow-hidden rounded-full">
                <div
                  className={cn(
                    'from-accent-deep to-accent h-full rounded-full bg-linear-to-r',
                    a.width
                  )}
                />
              </div>
              <Heading level={3} className="mt-4 text-sm font-bold">
                {a.label}
              </Heading>
              <p className="text-muted-strong mt-1 text-sm leading-relaxed">{a.text}</p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  )
}

const STEPS = [
  {
    n: '01',
    title: 'Zapiš sérii',
    text: 'Váha, opakování, hotovo. Hexis navrhne další váhu podle minula a rest timer ohlídá pauzu, i když máš telefon v kapse.',
  },
  {
    n: '02',
    title: 'Dokonči quest',
    text: 'Dnešní trénink je mise. Za dokončení padá bonus, za osobní rekord další. Návyky a jídlo jsou vedlejší questy.',
  },
  {
    n: '03',
    title: 'Sleduj, jak rosteš',
    text: 'Level, tier, atributy i rank každého svalu D až S. Grafy síly a objemu ukážou, kde stagnuješ dřív, než to poznáš sám.',
  },
] as const

function HowItWorks() {
  return (
    <section
      id="jak"
      aria-labelledby="jak-title"
      className="bg-surface-sunken scroll-mt-16 py-16 md:py-24"
    >
      <Container size="full" className="mx-auto max-w-6xl">
        <SectionTitle id="jak-title" eyebrow="Jak to funguje" title="Tři kroky. Každý den." />
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n}>
              <Card padding="lg" className="border-border h-full border">
                <span className="font-display text-accent hero-level text-5xl leading-none font-black">
                  {s.n}
                </span>
                <Heading level={3} className="font-display mt-5 text-xl font-black uppercase">
                  {s.title}
                </Heading>
                <p className="text-muted-strong mt-2 text-sm leading-relaxed">{s.text}</p>
              </Card>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}

const XP_ROWS = [
  { label: 'Dokončený trénink', xp: XP_DELTAS.session_complete },
  { label: 'Osobní rekord', xp: XP_DELTAS.pr_achieved },
  { label: 'Zapsané měření', xp: XP_DELTAS.measurement_added },
  { label: 'Fotka progresu', xp: XP_DELTAS.photo_uploaded },
  { label: 'Zapsané jídlo', xp: XP_DELTAS.nutrition_logged },
  { label: 'Den v sérii tréninků', xp: XP_DELTAS.streak_day },
  { label: 'Každá série', xp: XP_DELTAS.set_logged },
] as const

function XpTable() {
  return (
    <section aria-labelledby="xp-title" className="py-16 md:py-24">
      <Container
        size="full"
        className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:items-center"
      >
        <SectionTitle
          id="xp-title"
          eyebrow="Za co jsou XP"
          title="Body jen za skutečnou práci"
          lead="Žádné XP za otevření aplikace. Platí jen to, co odcvičíš, sníš a změříš. A za našetřené XP si vyzvedneš odměny, které si sám nastavíš."
        />
        <Card padding="none" className="border-border overflow-hidden border">
          <ul className="divide-border divide-y">
            {XP_ROWS.map((r) => (
              <li key={r.label} className="flex items-center justify-between px-5 py-3.5">
                <span className="text-sm font-semibold">{r.label}</span>
                <span className="font-display text-reward text-lg font-black">+{r.xp} XP</span>
              </li>
            ))}
          </ul>
        </Card>
      </Container>
    </section>
  )
}

function Tiers() {
  return (
    <section aria-labelledby="tiery-title" className="bg-surface-sunken py-16 md:py-24">
      <Container size="full" className="mx-auto max-w-6xl">
        <SectionTitle
          id="tiery-title"
          eyebrow="Tiery"
          title={<>Od Nováčka po Titána</>}
          lead="Každý level je těžší než ten předchozí. Prvních pár přijde rychle, Titán se zaslouží."
        />
        <ol className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {TIERS.map((t, i) => (
            <li key={t.tier}>
              <Card
                padding="md"
                className="border-border flex h-full flex-col items-center border text-center"
              >
                <RankLens label={ROMAN[i] ?? String(t.tier)} tone={tierTone(t.tier)} />
                <span
                  className={cn(
                    'font-display mt-3 text-lg font-black uppercase',
                    TONE_TEXT[tierTone(t.tier)]
                  )}
                >
                  {t.name}
                </span>
                <span className="text-muted mt-1 text-xs font-semibold">
                  {t.levelMax >= 999 ? `Level ${t.levelMin}+` : `Level ${t.levelMin}–${t.levelMax}`}
                </span>
              </Card>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Dumbbell,
    title: 'Tréninkové plány',
    text: 'Plány na každý den, historie cviků a návrh další váhy podle minulého výkonu.',
  },
  {
    icon: Timer,
    title: 'Rest timer',
    text: 'Odpočet pauzy s upozorněním na zamčeném telefonu. Kalkulačka kotoučů v ceně.',
  },
  {
    icon: TrendingUp,
    title: 'Síla a stagnace',
    text: 'Odhad 1RM, objem po týdnech a upozornění, když se cvik přestane hýbat.',
  },
  {
    icon: Flame,
    title: 'Návyky a streaky',
    text: 'Vlastní návyky s denním odškrtáváním. Nepřerušená řada zvedá Disciplínu.',
  },
  {
    icon: Salad,
    title: 'Jídlo a makra',
    text: 'Kalorie, bílkoviny a makra proti tvému cíli. Rychlý zápis za pár vteřin.',
  },
  {
    icon: Camera,
    title: 'Míry a fotky',
    text: 'Váha, obvody a fotky progresu vedle sebe. Změna, kterou v zrcadle nevidíš.',
  },
  {
    icon: CalendarDays,
    title: 'Quest kalendář',
    text: 'Tréninky, návyky, vážení a fotky v jednom měsíčním přehledu.',
  },
  {
    icon: Gift,
    title: 'Odměny',
    text: 'Nastav si vlastní odměny a vyzvedni je za našetřené XP. Motivace na tvoje přání.',
  },
]

function Features() {
  return (
    <section id="funkce" aria-labelledby="funkce-title" className="scroll-mt-16 py-16 md:py-24">
      <Container size="full" className="mx-auto max-w-6xl">
        <SectionTitle id="funkce-title" eyebrow="Funkce" title="Všechno na jednom místě" />
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <Card padding="md" className="border-border h-full border">
                <span className="bg-system-soft text-system grid h-10 w-10 place-items-center rounded-full">
                  <Icon aria-hidden size={20} />
                </span>
                <Heading level={3} className="mt-4 text-base font-bold">
                  {title}
                </Heading>
                <p className="text-muted-strong mt-1.5 text-sm leading-relaxed">{text}</p>
              </Card>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}

function Pwa() {
  return (
    <section aria-labelledby="pwa-title" className="pb-16 md:pb-24">
      <Container size="full" className="mx-auto max-w-6xl">
        <Card
          padding="lg"
          className="border-system/30 bg-system-soft/40 relative overflow-hidden border md:p-10"
        >
          <span aria-hidden className="hero-glow absolute inset-0 opacity-60" />
          <div className="relative grid gap-6 md:grid-cols-[auto_1fr] md:items-center md:gap-8">
            <span className="bg-background/60 text-accent grid h-16 w-16 place-items-center rounded-full">
              <Smartphone aria-hidden size={30} />
            </span>
            <div>
              <Heading
                level={2}
                id="pwa-title"
                className="font-display text-2xl font-black uppercase sm:text-3xl"
              >
                Na plochu jako aplikace
              </Heading>
              <p className="text-muted-strong mt-3 max-w-2xl text-base leading-relaxed">
                Hexis si přidáš na plochu telefonu bez obchodu s&nbsp;aplikacemi. Spouští se na
                celou obrazovku, drží se i&nbsp;při slabém signálu v&nbsp;posilovně a&nbsp;data si
                kdykoli vyexportuješ do CSV.
              </p>
            </div>
          </div>
        </Card>
      </Container>
    </section>
  )
}

function FinalCta() {
  return (
    <section
      aria-labelledby="cta-title"
      className="relative overflow-hidden py-20 text-center md:py-28"
    >
      <span aria-hidden className="hero-glow absolute inset-0" />
      <Container size="md" className="relative">
        <Heading
          level={2}
          id="cta-title"
          className="font-display text-4xl leading-none font-black uppercase sm:text-5xl"
        >
          Level 1 <span className="text-accent hero-level">čeká</span>
        </Heading>
        <p className="text-muted-strong mx-auto mt-4 max-w-md text-base leading-relaxed">
          Máš od nás účet? Přihlas se a&nbsp;zapiš první sérii. Prvních {XP_DELTAS.session_complete}{' '}
          XP je na jeden trénink.
        </p>
        <div className="mt-8 flex justify-center">
          <Button as="a" href="/login" size="lg">
            Přihlásit se
          </Button>
        </div>
      </Container>
    </section>
  )
}
