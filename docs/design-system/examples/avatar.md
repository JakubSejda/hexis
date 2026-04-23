# Avatar

Tier-colored avatar block with image support and initials fallback. Size presets match common display contexts.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `src` | `string` | — | Image URL. Falls back to initials if omitted or errors. |
| `alt` | `string` | `''` | Passed through to `<img>`. |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | 24 / 32 / 40 / 48 / 64 px. |
| `tier` | `number` | — | Renders tier border color (tier palette in `@/lib/tiers`). |
| `className` | `string` | — | Merged. |

Initials: first letter of each word in `alt` (e.g. `"Jakub Sejda"` → `JS`).

## Examples

### Dashboard hero

```tsx
<Avatar tier={tierMeta.tier} size="lg" alt={user.name ?? 'U'} />
```

### Image with alt

```tsx
<Avatar src={user.avatarUrl} alt={user.name} size="md" />
```

## Do / Don't

- Always provide `alt` — initials fallback needs it; screen readers need it
- Use `size="xs"` (24px) inline with text; reserve `lg`/`xl` for hero contexts
- Don't wrap Avatar in another circular container
- Don't use Avatar for generic user-less icons — use a Lucide icon instead
