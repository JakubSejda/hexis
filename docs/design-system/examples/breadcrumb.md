# Breadcrumb

Hierarchical nav trail. Last item renders as a plain `<span aria-current="page">`; earlier items render `<Link>` when `href` is set, plain `<span>` otherwise. Separator is a Lucide `ChevronRight`.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `Array<{ label: string; href?: string }>` | required | Ordered crumbs; last one is the current page. |
| `className` | `string` | — | Merged. |

## Examples

### Three-level

```tsx
<Breadcrumb
  items={[
    { label: 'Nastavení', href: '/settings' },
    { label: 'Makra', href: '/settings/macros' },
    { label: 'Upravit' },
  ]}
/>
```

### Single item

```tsx
<Breadcrumb items={[{ label: 'Dashboard' }]} />
```

## Do / Don't

- Use Breadcrumb on pages deep in a hierarchy (≥ 2 levels) where the user needs to step back
- Always include `href` on non-last items so they're navigable
- Don't use Breadcrumb if the app doesn't have a real hierarchy — it implies one
- Don't duplicate in-page nav; keep Breadcrumb as the only "where am I" indicator
