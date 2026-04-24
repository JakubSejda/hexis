import Link from 'next/link'
import { Container, Stack, Card, Heading } from '@/components/ui'
import { Scale, Utensils, Download } from 'lucide-react'

const ITEMS = [
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
        <Heading level={1}>Settings</Heading>
        <Stack gap={3}>
          {ITEMS.map(({ href, label, hint, icon: Icon }) => (
            <Link key={href} href={href} className="block">
              <Card padding="md" className="hover:border-accent transition-colors">
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
