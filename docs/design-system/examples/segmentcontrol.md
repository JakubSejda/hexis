# SegmentControl

URL-routed segmented picker. Each segment is a `<Link>`, so navigation is SSR-compatible and shareable. For client-state tab UIs, prefer `Tabs` (compound).

## Props

### `SegmentControl`
| Prop | Type | Default | Description |
|---|---|---|---|
| `segments` | `Array<{ href: string; label: string }>` | required | Segment config. |
| `active` | `string` | required | The currently-active `href`. |

### `ProgressSegmentControl` (convenience wrapper)
No props. Auto-detects `/progress/*` pathname.

## Examples

### Custom

```tsx
<SegmentControl
  segments={[
    { href: '/today', label: 'Dnes' },
    { href: '/week', label: 'Týden' },
  ]}
  active={pathname}
/>
```

### Progress page

```tsx
<ProgressSegmentControl />
```

## Do / Don't

- Use for URL-routed sections that benefit from shareable links (progress tabs, date ranges)
- Use `Tabs` (compound) when tab state is purely client-side
- Don't use for >4 options — gets cramped on mobile
- Don't use for selecting data; use `Select` or filter chips
