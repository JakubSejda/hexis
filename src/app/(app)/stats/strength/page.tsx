import { requireSessionUser } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { StrengthPageClient } from '@/components/progress/StrengthPageClient'

export default async function StrengthPage() {
  const user = await requireSessionUser()
  if (user instanceof Response) redirect('/login')
  return <StrengthPageClient />
}
