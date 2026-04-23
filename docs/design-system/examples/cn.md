# cn()

`clsx` + `tailwind-merge` combined class-name helper. Used throughout the design system so consumer `className` props win against defaults.

## API

```tsx
import { cn } from '@/components/ui'

cn(...inputs: ClassValue[]): string
```

Accepts strings, arrays, and conditional objects (like `clsx`). `tailwind-merge` then dedupes conflicting Tailwind classes so later ones win.

## Examples

### Component with default + user override

```tsx
function Card({ className, ...rest }: Props) {
  return <div className={cn('bg-surface p-4 rounded-xl', className)} {...rest} />
}

// Consumer:
<Card className="p-6" />   // → 'bg-surface rounded-xl p-6'  (p-4 dropped)
```

### Conditional classes

```tsx
<span className={cn('rounded px-2', active && 'bg-primary text-background', disabled && 'opacity-50')} />
```

## Do / Don't

- Use `cn()` inside every new component so `className` overrides merge correctly
- Pass defaults first, user `className` last — last wins on conflicts
- Don't use plain string concatenation for classes — you'll hit Tailwind-merge edge cases
- Don't put runtime-conditional Tailwind classes without `cn()` — `tailwind-merge` is what lets the override semantics work
