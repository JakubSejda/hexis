# Card

Surface container with border + rounded corners. 3 variants: `default`, `interactive` (hover + focus ring), `flush` (no internal padding). Polymorphic via `as`.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'default' \| 'interactive' \| 'flush'` | `'default'` | Visual treatment. |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` (flush → `'none'`) | Internal padding. |
| `as` | `ElementType` | `'div'` | Polymorphic element. |
| `className` | `string` | — | Merged via `cn()`. |
| `children` | `ReactNode` | required | — |

## Examples

### KPI tile

```tsx
<Card padding="sm" className="text-center">
  <div className="text-2xl">{streak}</div>
  <div className="text-muted text-xs">denní streak</div>
</Card>
```

### Interactive link card

```tsx
<Card as={Link} href="/workout/123" variant="interactive">
  <Stack gap={1}>
    <span className="font-semibold">Push day</span>
    <span className="text-muted text-sm">12 sérií · 4 250 kg</span>
  </Stack>
</Card>
```

### Flush (no padding — caller owns it)

```tsx
<Card variant="flush">
  <Image src="…" alt="" fill />
</Card>
```

## Do / Don't

- Use Card for grouped content that benefits from a visual boundary
- Use `variant="interactive"` when the whole card is clickable (tap target ≥ 44px)
- Don't nest Cards inside Cards — use Section or a styled div instead
- Don't set `padding="none"` on a non-flush variant — prefer the flush variant for clarity
