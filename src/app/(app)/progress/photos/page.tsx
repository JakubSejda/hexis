import { requireSessionUser } from '@/lib/auth-helpers'
import { Container } from '@/components/ui'
import { redirect } from 'next/navigation'
import { ProgressTabs } from '@/components/progress/ProgressTabs'
import { PhotosPageClient } from '@/components/photos/PhotosPageClient'

export default async function PhotosPage() {
  const user = await requireSessionUser()
  if (user instanceof Response) redirect('/login')
  return (
    <Container className="flex flex-col gap-4 py-4">
      <ProgressTabs active="/progress/photos" />
      <PhotosPageClient />
    </Container>
  )
}
