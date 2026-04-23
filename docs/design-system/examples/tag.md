# Tag

Interactive Pill variant with optional remove button. Use for filter chips and removable selections.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `tone` | `'primary' \| 'success' \| 'warn' \| 'danger' \| 'muted'` | `'muted'` | Color mapping. |
| `onRemove` | `() => void` | — | If set, renders a close `X` button that fires this. |
| `className` | `string` | — | Merged. |
| `children` | `ReactNode` | required | — |

## Examples

### Filter chip

```tsx
<Tag tone="primary" onRemove={() => removeFilter('strength')}>
  Síla
</Tag>
```

### Static label

```tsx
<Tag tone="muted">12 týdnů</Tag>
```

## Do / Don't

- Use Tag with `onRemove` for filter/selection UIs; use Pill for non-removable status
- Match tone to the data/meaning — e.g. `primary` for active filters
- Don't stack Tag+Pill in the same row; pick one pattern
- Don't use for dialog actions; Button is the right element there
