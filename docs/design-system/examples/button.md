# Button

5 variants × 3 sizes + loading state. Supports `iconLeft`/`iconRight` slots and polymorphic `as` (renders as `<a>`, `<Link>`, etc.).

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger' \| 'success'` | `'primary'` | Color/fill intent. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Height + padding scale. |
| `loading` | `boolean` | `false` | Shows a spinner + disables interaction. |
| `iconLeft` | `ReactNode` | — | Lucide icon element rendered before children. |
| `iconRight` | `ReactNode` | — | Lucide icon rendered after children. |
| `as` | `ElementType` | `'button'` | Polymorphic element. |
| `className` | `string` | — | Merged via `cn()`. |
| `children` | `ReactNode` | — | Button label. |

Plus all native `<button>` props (`onClick`, `disabled`, `type`, etc.).

## Examples

### Primary CTA

```tsx
import { Plus } from 'lucide-react'

<Button variant="primary" size="md" iconLeft={<Plus size={16} />}>
  Log workout
</Button>
```

### Loading state

```tsx
<Button loading>Saving…</Button>
```

### Polymorphic link

```tsx
import Link from 'next/link'
<Button as={Link} href="/workout" variant="ghost">Do tréninku</Button>
```

## Do / Don't

- Use `primary` (amber) for the main screen CTA, one per screen
- Use `success` (emerald) for "action completed" confirms — not for initiating actions
- Don't nest Button inside Button
- Don't use `ghost` as a primary action — users miss it on touch
