import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { users } from '@/db/schema'
import { requireSessionUser } from '@/lib/auth-helpers'
import { Container } from '@/components/ui'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'

export default async function OnboardingPage() {
  const user = await requireSessionUser()
  if (user instanceof Response) redirect('/login')

  const [row] = await db
    .select({ onboardedAt: users.onboardedAt })
    .from(users)
    .where(eq(users.id, user.id))
  if (row?.onboardedAt) redirect('/dashboard')

  return (
    <Container size="sm" className="py-8">
      <OnboardingWizard />
    </Container>
  )
}
