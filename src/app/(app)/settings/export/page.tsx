import { requireSessionUser } from '@/lib/auth-helpers'
import { Container } from '@/components/ui'
import { redirect } from 'next/navigation'
import { ExportClient } from '@/components/settings/ExportClient'

export default async function ExportPage() {
  const user = await requireSessionUser()
  if (user instanceof Response) redirect('/login')
  return (
    <Container className="py-4">
      <ExportClient />
    </Container>
  )
}
