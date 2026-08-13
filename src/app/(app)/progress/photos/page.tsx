import { requireSessionUser } from '@/lib/auth-helpers'
import { Container } from '@/components/ui'
import { redirect } from 'next/navigation'
import { PhotosPageClient } from '@/components/photos/PhotosPageClient'

export default async function PhotosPage() {
  const user = await requireSessionUser()
  if (user instanceof Response) redirect('/login')
  return (
    <Container className="py-4">
      <PhotosPageClient />
    </Container>
  )
}
