import { requireSessionUser } from '@/lib/auth-helpers'
import { Container } from '@/components/ui'
import { redirect } from 'next/navigation'
import { StrengthPageClient } from '@/components/progress/StrengthPageClient'

export default async function StrengthPage() {
  const user = await requireSessionUser()
  if (user instanceof Response) redirect('/login')
  return (
    <Container className="py-4">
      <StrengthPageClient />
    </Container>
  )
}
