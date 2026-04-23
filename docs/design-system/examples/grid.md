# Grid

Fixed-column grid wrapper. Simpler than hand-rolling `grid-cols-*` when you want the common 2/3/4 column cases.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `cols` | `2 \| 3 \| 4` | `2` | Column count. |
| `gap` | `1 \| 2 \| 3 \| 4 \| 5 \| 6 \| 8` | `3` | Tailwind gap scale. |
| `className` | `string` | — | Additional classes. |
| `children` | `ReactNode` | required | — |

## Examples

### Measurement mini-row

```tsx
<Grid cols={4} gap={3}>
  <Mini label="Pas" …/>
  <Mini label="Hrudník" …/>
  <Mini label="Stehno" …/>
  <Mini label="Biceps" …/>
</Grid>
```

### Dashboard KPI tiles

```tsx
<Grid cols={2} gap={4}>
  <Card>Streak</Card>
  <Card>PR this week</Card>
</Grid>
```

## Do / Don't

- Use Grid for equal-width cells with fixed column count
- Keep children equally-weighted — irregular grids get messy
- Don't fight Grid with per-child `col-span-*`; use a custom grid instead
- Don't use for lists that should re-flow — use a responsive flex wrap
