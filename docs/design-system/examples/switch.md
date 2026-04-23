# Switch

Boolean toggle. Controlled. Use for immediate on/off settings; use Checkbox (not shipped) or a form submit for batched boolean forms.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `checked` | `boolean` | required | Current state. |
| `onChange` | `(next: boolean) => void` | required | Fires on toggle. |
| `disabled` | `boolean` | `false` | Disables interaction. |
| `label` | `string` | — | Visually-hidden label for a11y (always set this). |

## Examples

### Settings row

```tsx
<div className="flex items-center justify-between p-3">
  <span>Cukry</span>
  <Switch checked={tracked.sugar} onChange={(v) => toggleMacro('sugar', v)} label="Cukry" />
</div>
```

### Disabled when required

```tsx
<Switch checked disabled label="Kalorie" />
```

## Do / Don't

- Always pass `label` — even if you render your own visible label
- Use for settings that apply immediately (no form submit)
- Don't use for destructive state changes without a confirmation
- Don't use for a boolean inside a larger form — use a checkbox
