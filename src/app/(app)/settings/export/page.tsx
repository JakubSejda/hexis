import { requireSessionUser } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { ExportClient } from '@/components/settings/ExportClient'

export default async function ExportPage() {
  const user = await requireSessionUser()
  if (user instanceof Response) redirect('/login')
  return <ExportClient />
}
