# Select

Native `<select>` wrapper with the same chrome + sizing as `Input`. Uses Lucide `ChevronDown` as the visible caret.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Height + padding. |
| `label` | `string` | — | Above-field label. |
| `hint` | `string` | — | Below-field helper. |
| `error` | `string` | — | Below-field error; sets `aria-invalid`. |
| `className` | `string` | — | Merged onto the native `<select>`. |
| `children` | `ReactNode` | required | `<option>` elements. |

Plus all native `<select>` props.

## Example

### Plan picker

```tsx
<Select
  label="Plán"
  value={planId}
  onChange={(e) => setPlanId(Number(e.target.value))}
>
  {plans.map((p) => (
    <option key={p.id} value={p.id}>{p.name}</option>
  ))}
</Select>
```

### With error

```tsx
<Select label="Svalová skupina" error="Povinné pole" value={group} onChange={onChange}>
  <option value="">—</option>
  <option value="chest">Hrudník</option>
  <option value="back">Záda</option>
</Select>
```

## Do / Don't

- Use Select for short static option lists (< ~15 entries)
- Put a blank placeholder option first if no preselected value makes sense
- Don't use for searchable/long lists — build a Radix Combobox or ExercisePicker-style sheet
- Don't mix Select with custom option rendering — it's a native element by design
