# BottomSheet

Phone-native slide-up modal. Uses Radix Dialog internals but renders anchored to the bottom edge with a drag handle. Use for forms and pickers; use `Dialog` for centered confirm-style modals.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `open` | `boolean` | required | Controlled open state. |
| `onOpenChange` | `(v: boolean) => void` | required | Fires when Radix dismisses (overlay click, Escape, swipe). |
| `title` | `string` | — | Optional sheet title. |
| `description` | `string` | — | Optional supporting text (renders `aria-describedby`). |
| `children` | `ReactNode` | required | Sheet body. |

## Examples

### Form-style sheet

```tsx
<BottomSheet open={open} onOpenChange={onOpenChange} title="Vyber cvik">
  <Input placeholder="Hledat…" />
  <ul>…</ul>
</BottomSheet>
```

### With description

```tsx
<BottomSheet
  open={open}
  onOpenChange={setOpen}
  title="Upravit makra"
  description="Změny se aplikují od příštího týdne."
>
  …
</BottomSheet>
```

## Do / Don't

- Use BottomSheet for forms, pickers, and any modal with scrollable content on mobile
- Close via the parent's `onOpenChange(false)` handler — don't render a manual close button unless needed
- Don't nest BottomSheets; if you need a secondary modal, use `Dialog` instead
- Don't use for destructive confirms — use `<Dialog dismissible={false}>` for those
