# Pill

Small status chip with tone-based color mapping. Use for numeric/status readouts and inline labels.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `tone` | `'primary' \| 'success' \| 'warn' \| 'danger' \| 'muted'` | `'muted'` | Background + text color mapping. |
| `size` | `'sm' \| 'md'` | `'sm'` | Padding + text scale. |
| `className` | `string` | — | Merged. |
| `children` | `ReactNode` | required | — |

## Examples

### PR streak

```tsx
<Pill tone="success">{streak}× PR</Pill>
```

### Warning pill

```tsx
<Pill tone="warn">3 t. bez PR</Pill>
```

## Do / Don't

- Use Pill for inline status text that benefits from a colored background
- Keep copy short — 1–2 words or a number+unit
- Don't use Pill as a button/link — use Button or Tag (removable) instead
- Don't use tones arbitrarily; map data state to tone consistently across the app
