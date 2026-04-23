# Skeleton

Placeholder shimmer for loading state. Matches the eventual content's shape (block/circle/text line) so layout doesn't shift when data arrives.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'block' \| 'circle' \| 'text'` | `'block'` | Shape. |
| `width` | `number \| string` | `'100%'` | CSS width. |
| `height` | `number \| string` | `'1rem'` (text) / `'100%'` (block) | CSS height. |
| `className` | `string` | — | Merged. |

## Examples

### Dashboard tile

```tsx
{loading ? (
  <Skeleton variant="block" height="120px" />
) : (
  <WeekMeasurementCard …/>
)}
```

### Avatar + two lines of text

```tsx
<div className="flex gap-3">
  <Skeleton variant="circle" width={40} height={40} />
  <Stack gap={1}>
    <Skeleton variant="text" width="60%" />
    <Skeleton variant="text" width="40%" />
  </Stack>
</div>
```

## Do / Don't

- Match Skeleton shape to the eventual content exactly — same height, same rounding
- Show Skeleton for ≥ 300ms perceived waits; quicker loads don't need it
- Don't use Skeleton for error states — use EmptyState or a banner
- Don't animate Skeletons indefinitely — show real state or an error after a timeout
