import { requireSessionUser } from '@/lib/auth-helpers'
import { Container } from '@/components/ui'
import { redirect } from 'next/navigation'
import { ProgressTabs } from '@/components/progress/ProgressTabs'
import { StrengthPageClient } from '@/components/progress/StrengthPageClient'

export default async function StrengthPage() {
  const user = await requireSessionUser()
  if (user instanceof Response) redirect('/login')
  return (
    <Container className="flex flex-col gap-4 py-4">
      <ProgressTabs active="/stats/strength" />
      <StrengthPageClient />
    </Container>
  )
}
