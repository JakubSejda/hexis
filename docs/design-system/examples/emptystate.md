# EmptyState

"No data yet" placeholder with Lucide icon, heading, optional description, and optional CTA action.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `icon` | `LucideIcon` | required | Lucide icon component (not an instance). |
| `title` | `string` | required | Empty-state headline. |
| `description` | `string` | — | Optional supporting sentence. |
| `action` | `ReactNode` | — | Optional Button or Link. |
| `className` | `string` | — | Merged. |

## Examples

### Photos empty

```tsx
import { Camera } from 'lucide-react'

<EmptyState
  icon={Camera}
  title="Žádné fotky"
  description="Nahraj první fotku, ať vidíš pokrok v čase."
  action={<Button onClick={openUpload}>Nahrát fotku</Button>}
/>
```

### Minimal

```tsx
import { Inbox } from 'lucide-react'
<EmptyState icon={Inbox} title="Zatím žádná aktivita." />
```

## Do / Don't

- Always include an `action` when the user can create the missing data
- Match the icon to the data domain — Dumbbell for workouts, Camera for photos
- Don't use EmptyState for loading — use Skeleton
- Don't use for error states — errors need different copy + a retry action
