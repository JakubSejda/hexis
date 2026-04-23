# Sparkline

Inline SVG line chart. Renders a path with optional end-dot from an array of values with `null` for missing data.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `values` | `Array<number \| null>` | required | Data points; `null` renders a gap. |
| `width` | `number` | `120` | Pixel width. |
| `height` | `number` | `32` | Pixel height. |
| `tone` | `'primary' \| 'success' \| 'warn' \| 'danger' \| 'muted'` | `'muted'` | Stroke + dot color. Matches ProgressBar vocabulary. |
| `showEndDot` | `boolean` | `true` | Render a filled circle at the last non-null point. |
| `className` | `string` | — | Additional classes. |

## Examples

### Weight series with delta-based tone

```tsx
const TONE = { good: 'primary', bad: 'danger', neutral: 'muted' } as const
<Sparkline values={weightSeries} width={140} height={48} tone={TONE[direction]} />
```

### Headless (no end-dot)

```tsx
<Sparkline values={data} showEndDot={false} />
```

## Do / Don't

- Use in dashboard widgets to show trend-at-a-glance alongside current value
- Map data-derived direction (good/bad/neutral) to tones via a local lookup
- Don't use for precise numeric reading — pair with the current value nearby
- Don't pass free-form color strings; the `tone` union is the public API
