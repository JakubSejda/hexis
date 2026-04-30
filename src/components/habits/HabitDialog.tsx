'use client'
import { useState, useMemo } from 'react'
import { Dialog, Button, Input } from '@/components/ui'
import { MILESTONE_BASE_XP, WEIGHT_MULTIPLIER } from '@/lib/habits/milestone'

type Cadence = 'daily' | 'weekly'
type Weight = 'light' | 'standard' | 'heavy'

type CreateProps = {
  open: boolean
  mode: 'create'
  habit?: undefined
  onClose: () => void
  onSubmit: (payload: {
    name: string
    cadence: Cadence
    weeklyTarget: number | undefined
    weight: Weight
  }) => void
}

type EditProps = {
  open: boolean
  mode: 'edit'
  habit: { id: number; name: string; cadence: Cadence; weeklyTarget: number | null; weight: Weight }
  onClose: () => void
  onSubmit: (payload: { name: string; weight: Weight }) => void
}

type Props = CreateProps | EditProps

export function HabitDialog(props: Props) {
  const isEdit = props.mode === 'edit'
  const initial = isEdit ? props.habit : null

  const [name, setName] = useState(initial?.name ?? '')
  const [cadence, setCadence] = useState<Cadence>(initial?.cadence ?? 'daily')
  const [weeklyTargetStr, setWeeklyTargetStr] = useState<string>(String(initial?.weeklyTarget ?? 3))
  const [weight, setWeight] = useState<Weight>(initial?.weight ?? 'standard')

  const xpPreview = useMemo(() => {
    const m = WEIGHT_MULTIPLIER[weight]
    return [MILESTONE_BASE_XP[7] * m, MILESTONE_BASE_XP[30] * m, MILESTONE_BASE_XP[100] * m]
  }, [weight])

  const submit = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (isEdit) {
      props.onSubmit({ name: trimmed, weight })
    } else {
      const wt = Math.max(1, Math.min(7, Number(weeklyTargetStr) || 1))
      props.onSubmit({
        name: trimmed,
        cadence,
        weeklyTarget: cadence === 'weekly' ? wt : undefined,
        weight,
      })
    }
  }

  return (
    <Dialog
      open={props.open}
      onOpenChange={(v) => {
        if (!v) props.onClose()
      }}
      title={isEdit ? 'Upravit návyk' : 'Nový návyk'}
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Název návyku"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          autoFocus
        />

        <fieldset className="flex flex-col gap-2" disabled={isEdit}>
          <legend className="text-muted text-xs font-medium">Cadence</legend>
          <div className="flex gap-4">
            {(['daily', 'weekly'] as const).map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="cadence"
                  value={c}
                  checked={cadence === c}
                  onChange={() => setCadence(c)}
                  disabled={isEdit}
                />
                {c === 'daily' ? 'Daily' : 'Weekly'}
              </label>
            ))}
          </div>
          {isEdit && (
            <p className="text-muted text-xs">Cadence nelze měnit. Archivuj a založ nový.</p>
          )}
        </fieldset>

        {!isEdit && cadence === 'weekly' && (
          <Input
            label="×/týden"
            type="number"
            min={1}
            max={7}
            value={weeklyTargetStr}
            onChange={(e) => setWeeklyTargetStr(e.target.value)}
            className="w-24"
          />
        )}

        <fieldset className="flex flex-col gap-2">
          <legend className="text-muted text-xs font-medium">Obtížnost</legend>
          <div className="flex gap-4">
            {(['light', 'standard', 'heavy'] as const).map((w) => (
              <label key={w} className="flex items-center gap-2 text-sm capitalize">
                <input
                  type="radio"
                  name="weight"
                  value={w}
                  checked={weight === w}
                  onChange={() => setWeight(w)}
                />
                {w}
              </label>
            ))}
          </div>
        </fieldset>

        <p className="text-muted text-xs leading-relaxed">
          Při streaku 7 / 30 / 100 dní získáš {xpPreview[0]} / {xpPreview[1]} / {xpPreview[2]} XP.
        </p>

        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={props.onClose}>
            Zrušit
          </Button>
          <Button variant="primary" onClick={submit} disabled={!name.trim()}>
            {isEdit ? 'Uložit' : 'Vytvořit'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
