# Heading

Semantic heading (`<h1>`–`<h3>`) with visual variants decoupled from the level. Use `level` for DOM semantics, `variant` for visual treatment.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `level` | `1 \| 2 \| 3` | `1` | Renders `<h1>` / `<h2>` / `<h3>`. |
| `variant` | `'display' \| 'default' \| 'region'` | `'default'` | Visual scale. `display` = hero, `region` = smaller section header. |
| `className` | `string` | — | Merged. |
| `children` | `ReactNode` | required | — |

## Examples

### Page title

```tsx
<Heading level={1}>Progres</Heading>
```

### Hero display

```tsx
<Heading level={1} variant="display">Vítej zpět</Heading>
```

### Region header (used by `Section variant="region"`)

```tsx
<Heading level={2} variant="region">Life Areas</Heading>
```

## Do / Don't

- Always pick the correct `level` for document outline; `variant` is purely visual
- One `level={1}` per page — enforce with code review
- Don't style Heading via children (e.g. `<Heading><span className="text-2xl">`) — pick the right `variant`
- Don't use for non-heading copy; use `<p>` or a styled span
