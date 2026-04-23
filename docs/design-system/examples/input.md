# Input

Text input with optional label/hint/error chrome. Two visual variants: `default` and `search` (leading magnifier icon).

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'default' \| 'search'` | `'default'` | `search` prefixes a Lucide `Search` icon. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Height + padding. |
| `label` | `string` | — | Above-field label (renders `<label>`). |
| `hint` | `string` | — | Below-field helper text. Associated via `aria-describedby`. |
| `error` | `string` | — | Below-field error; sets `aria-invalid`. Hides `hint` when set. |
| `className` | `string` | — | Merged onto the `<input>`. |

Plus all native `<input>` props (`value`, `onChange`, `type`, `placeholder`, `ref`, …).

## Examples

### Login email

```tsx
<Input
  type="email"
  label="E-mail"
  placeholder="jan@example.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

### Search with error

```tsx
<Input
  variant="search"
  placeholder="Hledat cvik…"
  value={query}
  onChange={(e) => setQuery(e.target.value)}
  error={query.length > 0 && results.length === 0 ? 'Nic nenalezeno' : undefined}
/>
```

## Do / Don't

- Always set `label` for form fields — screen readers + the focus-visible ring need it
- Use `error` for field-level validation; top-of-form banners for cross-field errors
- Don't pass `className` to change height — use `size`
- Don't stack error + hint together; `error` takes precedence
