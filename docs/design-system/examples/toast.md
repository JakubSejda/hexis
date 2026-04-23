# Toast

Transient notification. Use the `useToast()` hook inside a `ToastProvider` — both exported from `@/components/ui`.

## API

```tsx
type Tone = 'success' | 'error' | 'info'

function useToast(): {
  show(message: string, tone?: Tone, durationMs?: number): void
}
```

Wrap the app (or a subtree) in `<ToastProvider>` to enable `useToast()`. Default duration ≈ 3000ms.

## Examples

### Success confirm

```tsx
const toast = useToast()
async function save() {
  const res = await fetch('/api/…')
  if (res.ok) toast.show('Uloženo', 'success')
  else toast.show('Uložení selhalo', 'error')
}
```

### Info hint

```tsx
toast.show('Offline — změny budou odeslány později', 'info', 5000)
```

## Do / Don't

- Use Toast for ephemeral results of user actions (save/delete confirmations, failures)
- Keep copy short — one sentence, imperative mood
- Don't use Toast for important info the user must act on — use Dialog or an inline banner
- Don't chain toasts; if you need to show multiple, batch into one combined message
