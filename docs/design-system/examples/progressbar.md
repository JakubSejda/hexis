# ProgressBar

Linear progress bar. Two variants: `default` (uses `tone` for color) and `xp` (amber + subtle glow, reserved for the XP leveling bar).

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `number \| null` | required | Current progress. `null` → 0%. |
| `max` | `number \| null` | required | Max progress. `null` or `0` → 0%. |
| `height` | `number` | `8` | Pixel height. |
| `tone` | `'primary' \| 'success' \| 'warn' \| 'danger' \| 'muted'` | `'primary'` | Fill color (ignored when `variant="xp"`). |
| `variant` | `'default' \| 'xp'` | `'default'` | `xp` forces amber + glow. |
| `className` | `string` | — | Additional classes. |

## Examples

### Nutrition target

```tsx
<ProgressBar value={actual} max={target} tone="primary" />
```

### XP level bar

```tsx
<ProgressBar value={progress.current} max={progress.max} variant="xp" height={8} />
```

## Do / Don't

- Use `variant="xp"` only for XP displays — amber + glow has semantic weight
- Use `tone="success"` for completed goals, `tone="warn"`/`"danger"` for over-target
- Don't combine `variant="xp"` with a non-XP `tone` — `xp` overrides anyway
- Don't use for indeterminate loading — use Skeleton instead
