# NumberInput

Numeric input with +/− stepper buttons on either side. Accepts the same `label`/`hint`/`error` chrome as `Input`. Controlled — value is always a `number | null`.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `number \| null` | required | Current value. `null` renders an empty field. |
| `onChange` | `(v: number \| null) => void` | required | Fires on increment/decrement and on manual edit. |
| `step` | `number` | `1` | Increment amount. |
| `min` | `number` | — | Lower bound. |
| `max` | `number` | — | Upper bound. |
| `suffix` | `string` | — | Unit label after the value (e.g. `"kg"`). |
| `label` | `string` | — | Above-field label. |
| `hint` | `string` | — | Below-field helper text. |
| `error` | `string` | — | Below-field error text; sets `aria-invalid`. |

## Examples

### Set logging

```tsx
<NumberInput value={weight} onChange={setWeight} step={2.5} suffix="kg" />
<NumberInput value={reps} onChange={setReps} step={1} suffix="reps" />
```

### With label + error

```tsx
<NumberInput
  value={rpe}
  onChange={setRpe}
  min={1}
  max={10}
  label="RPE"
  error={rpe != null && (rpe < 1 || rpe > 10) ? 'RPE must be 1–10' : undefined}
/>
```

## Do / Don't

- Use for quantities where +/− stepping is faster than typing (weights, reps, RPE)
- Set `min`/`max` on bounded values — the stepper respects them
- Don't use for dates or non-numeric data; pick `Input` with `type="date"` etc.
- Don't stack more than 3 side by side on mobile — they get cramped
