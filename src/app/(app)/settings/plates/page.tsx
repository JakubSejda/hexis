import { requireSessionUser } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { PlateInventoryForm } from '@/components/workout/PlateInventoryForm'
import { db } from '@/db/client'
import { plateInventories } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { DEFAULT_PLATE_INVENTORY } from '@/db/seed/plate-inventory'

export default async function PlatesPage() {
  const user = await requireSessionUser()
  if (user instanceof Response) redirect('/login')
  let row = await db.query.plateInventories.findFirst({
    where: eq(plateInventories.userId, user.id),
  })
  if (!row) {
    await db.insert(plateInventories).values({
      userId: user.id,
      barKg: DEFAULT_PLATE_INVENTORY.barKg,
      plates: [...DEFAULT_PLATE_INVENTORY.plates],
    })
    row = await db.query.plateInventories.findFirst({ where: eq(plateInventories.userId, user.id) })
  }
  return (
    <PlateInventoryForm
      initial={{
        barKg: Number(row!.barKg),
        plates: row!.plates as { weightKg: number; pairs: number }[],
      }}
    />
  )
}
