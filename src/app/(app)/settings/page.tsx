import Link from 'next/link'
import { Container, Stack, Card } from '@/components/ui'
import { AccentSwitch } from '@/components/settings/AccentSwitch'
import { Scale, Utensils, Download, UserCircle2 } from 'lucide-react'

const ITEMS = [
  {
    href: '/settings/profile',
    label: 'Profil',
    hint: 'Vitals, cíl, datum startu',
    icon: UserCircle2,
  },
  {
    href: '/settings/plates',
    label: 'Plates',
    hint: 'Plate inventory for the calculator',
    icon: Scale,
  },
  { href: '/settings/macros', label: 'Macros', hint: 'Which macros to track', icon: Utensils },
  { href: '/settings/export', label: 'Export', hint: 'Download your data as ZIP', icon: Download },
] as const

export default function SettingsIndexPage() {
  return (
    <Container>
      <Stack gap={4} className="py-6">
        <Card padding="md">
          <div className="mb-3">
            <div className="font-semibold">Vzhled</div>
            <div className="text-muted text-sm">Barva tlačítek, XP a aktivní navigace</div>
          </div>
          <AccentSwitch />
        </Card>
        <Stack gap={3}>
          {ITEMS.map(({ href, label, hint, icon: Icon }) => (
            <Link key={href} href={href} className="block">
              <Card padding="md" variant="interactive">
                <div className="flex items-center gap-4">
                  <Icon className="text-accent h-6 w-6" aria-hidden />
                  <div className="flex-1">
                    <div className="font-semibold">{label}</div>
                    <div className="text-muted text-sm">{hint}</div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </Stack>
      </Stack>
    </Container>
  )
}
