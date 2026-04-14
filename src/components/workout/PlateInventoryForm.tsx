'use client'
import { useState } from 'react'
import { NumberInput } from '@/components/ui/NumberInput'
import { useToast } from '@/components/ui/Toast'

type Plate = { weightKg: number; pairs: number }

export function PlateInventoryForm({ initial }: { initial: { barKg: number; plates: Plate[] } }) {
  const [barKg, setBarKg] = useState<number | null>(initial.barKg)
  const [plates, setPlates] = useState<Plate[]>(initial.plates)
  const toast = useToast()

  const save = async () => {
    const res = await fetch('/api/plates', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ barKg, plates }),
    })
    if (!res.ok) toast.show('Ulozeni selhalo', 'error')
    else toast.show('Inventar ulozen', 'success')
  }

  const updatePlate = (idx: number, patch: Partial<Plate>) => {
    setPlates((p) => p.map((x, i) => (i === idx ? { ...x, ...patch } : x)))
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl">Plate Inventory</h1>
      <div>
        <label className="text-xs text-[#6B7280]">Bar</label>
        <NumberInput value={barKg} onChange={setBarKg} step={2.5} min={5} max={50} suffix="kg" />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs text-[#6B7280]">Talire (parove)</label>
        {plates.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <NumberInput
              value={p.weightKg}
              onChange={(v) => updatePlate(i, { weightKg: v ?? 0 })}
              step={0.25}
              suffix="kg"
            />
            <NumberInput
              value={p.pairs}
              onChange={(v) => updatePlate(i, { pairs: v ?? 0 })}
              step={1}
              suffix="paru"
            />
            <button
              type="button"
              onClick={() => setPlates((prev) => prev.filter((_, j) => j !== i))}
              className="text-xs text-[#EF4444]"
            >
              smaz
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setPlates((prev) => [...prev, { weightKg: 10, pairs: 1 }])}
          className="self-start text-sm text-[#10B981]"
        >
          + Pridat talir
        </button>
      </div>
      <button
        type="button"
        onClick={save}
        className="h-12 rounded-lg bg-[#10B981] font-semibold text-[#0A0E14]"
      >
        Ulozit
      </button>
    </div>
  )
}
