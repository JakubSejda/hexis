'use client'
import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button, Card, Heading, Input, Stack } from '@/components/ui'

const TOTAL_STEPS = 3

export function OnboardingWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [goalKg, setGoalKg] = useState('')

  async function saveProfile() {
    const body: Record<string, unknown> = {}
    if (name.trim()) body.name = name.trim()
    if (heightCm.trim()) body.heightCm = Number(heightCm)
    if (goalKg.trim()) body.goalKg = Number(goalKg)
    if (Object.keys(body).length === 0) return
    await fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => {})
  }

  async function finish(dest: string) {
    setSaving(true)
    await fetch('/api/user/onboarded', { method: 'POST' }).catch(() => {})
    router.push(dest)
  }

  async function next() {
    if (step === 1) {
      setSaving(true)
      await saveProfile()
      setSaving(false)
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
  }

  return (
    <Card padding="lg">
      <Stack gap={6}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2" aria-label={`Krok ${step + 1} z ${TOTAL_STEPS}`}>
            <span className="text-system text-xs font-bold tracking-[0.12em] uppercase">
              Probuzení hráče
            </span>
            <span className="flex gap-1.5" aria-hidden>
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <span
                  key={i}
                  className={`size-2.5 rounded-full ${i === step ? 'bg-accent' : 'bg-border'}`}
                />
              ))}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted"
            onClick={() => finish('/dashboard')}
          >
            Přeskočit
          </Button>
        </div>

        {step === 0 && (
          <Stack gap={3} className="animate-hud-power-on">
            <div className="rounded-card relative -mx-1 h-52 overflow-hidden">
              <Image
                src="/images/hero-player.svg"
                alt=""
                fill
                priority
                unoptimized
                sizes="400px"
                className="object-cover object-[center_20%]"
              />
            </div>
            <Heading level={2} variant="display">
              Tvoje probuzení začíná
            </Heading>
            <p className="text-muted-strong text-sm">
              Trénink, návyky a progres jako RPG. Za skutečnou práci sbíráš XP, levely a odměny —
              žádné prázdné body, jen tvoje cesta.
            </p>
          </Stack>
        )}

        {step === 1 && (
          <Stack gap={4} className="animate-hud-power-on">
            <Heading level={2} variant="display">
              Profil
            </Heading>
            <p className="text-muted text-sm">Všechno je volitelné — můžeš doplnit později.</p>
            <Input label="Jméno" value={name} onChange={(e) => setName(e.target.value)} />
            <Input
              label="Výška (cm)"
              type="number"
              inputMode="numeric"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
            />
            <Input
              label="Cíl (kg)"
              type="number"
              inputMode="decimal"
              value={goalKg}
              onChange={(e) => setGoalKg(e.target.value)}
            />
          </Stack>
        )}

        {step === 2 && (
          <Stack gap={3} className="animate-hud-power-on">
            <Heading level={2} variant="display">
              Vyber si svůj první quest
            </Heading>
            <p className="text-muted-strong text-sm">
              Začni tréninkem — vyber plán a zapiš první sérii. XP naskočí hned.
            </p>
          </Stack>
        )}

        {step < TOTAL_STEPS - 1 ? (
          <div className="flex gap-2">
            {step > 0 && (
              <Button
                variant="outline"
                size="md"
                onClick={() => setStep((s) => Math.max(s - 1, 0))}
              >
                Zpět
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="primary" size="md" loading={saving} onClick={next}>
              Pokračovat
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              size="lg"
              loading={saving}
              onClick={() => finish('/training')}
            >
              Vybrat první trénink
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="md"
                className="flex-1"
                onClick={() => setStep((s) => Math.max(s - 1, 0))}
              >
                Zpět
              </Button>
              <Button
                variant="ghost"
                size="md"
                className="flex-1"
                loading={saving}
                onClick={() => finish('/dashboard')}
              >
                Až později
              </Button>
            </div>
          </div>
        )}
      </Stack>
    </Card>
  )
}
