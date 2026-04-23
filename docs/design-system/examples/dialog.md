# Dialog

Re-shaped single-export modal over Radix Dialog. 90% of uses are confirm-style; escape hatches (`DialogRoot`, `DialogContent`, …) available for custom layouts.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `open` | `boolean` | required | Controlled open state. |
| `onOpenChange` | `(open: boolean) => void` | required | Fires on Escape, overlay click, or close button. |
| `title` | `string` | required | Dialog heading (every Dialog needs one for a11y). |
| `description` | `string` | — | Supporting text; sets `aria-describedby`. |
| `dismissible` | `boolean` | `true` | When `false`, blocks Escape + overlay click (force explicit choice). |
| `children` | `ReactNode` | — | Body (usually action buttons). |

Escape hatches: `DialogRoot`, `DialogTrigger`, `DialogPortal`, `DialogOverlay`, `DialogContent`, `DialogTitle`, `DialogDescription`, `DialogClose`.

## Examples

### Destructive confirm

```tsx
<Dialog
  open={confirmOpen}
  onOpenChange={setConfirmOpen}
  title="Smazat sérii?"
  description="Tuto akci nelze vrátit."
  dismissible={false}
>
  <div className="flex gap-2">
    <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Zrušit</Button>
    <Button variant="danger" onClick={doDelete}>Smazat</Button>
  </div>
</Dialog>
```

### Non-destructive modal

```tsx
<Dialog open={open} onOpenChange={setOpen} title="Nastavení">
  <Switch checked={v} onChange={setV} label="Cukry" />
</Dialog>
```

## Do / Don't

- Use `dismissible={false}` for destructive actions — force explicit Cancel/Confirm
- Always pass a `title`; Radix asserts accessibility
- Don't use Dialog for phone-form pickers — use `BottomSheet`
- Don't build nested modals — if you need a second step, replace the first Dialog's content
