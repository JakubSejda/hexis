'use client'
import { useEffect, useState } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { NumberInput } from '@/components/ui/NumberInput'
import { calculatePlates } from '@/lib/plates'

export function PlateCalculatorSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [target, setTarget] = useState<number | null>(60)
  const [bar, setBar] = useState(20)
  const [inventory, setInventory] = useState<Array<{ weightKg: number; pairs: number }>>([])

  useEffect(() => {
    if (!open) return
    fetch('/api/plates')
      .then((r) => r.json())
      .then((d) => {
        setBar(d.barKg)
        setInventory(d.plates)
      })
  }, [open])

  const result =
    target && target >= bar
      ? calculatePlates({ targetKg: target, bar: { weightKg: bar }, inventory })
      : null

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Plate calculator">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <NumberInput value={target} onChange={setTarget} step={2.5} suffix="kg" />
          <span className="text-muted text-xs">bar: {bar} kg</span>
        </div>
        {result ? (
          <>
            <div className="bg-border rounded-md p-3 text-sm">
              Per stranu:{' '}
              {result.perSide.length === 0
                ? 'žádné'
                : result.perSide.map((p) => `${p.weightKg}×${p.count}`).join(' + ')}
            </div>
            {result.missingKg > 0 ? (
              <div className="bg-danger/20 text-danger rounded-md p-2 text-xs">
                Chybí {result.missingKg} kg v inventáři
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </BottomSheet>
  )
}
