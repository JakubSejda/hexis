# Tabs

Subcomponent-pattern tablist over Radix Tabs. Client-state only. For URL-routed tabs use `SegmentControl`.

## Subcomponents

- `Tabs.Root` — owns `value`/`onValueChange`, `defaultValue`
- `Tabs.List` — styled flex container for triggers
- `Tabs.Trigger` — `value` required; styled with `data-[state=active]` tokens
- `Tabs.Content` — `value` required; renders when active

## Props — Tabs.Root

| Prop | Type | Description |
|---|---|---|
| `value` | `string` | Controlled active value. |
| `defaultValue` | `string` | Uncontrolled initial active. |
| `onValueChange` | `(v: string) => void` | Fires on change. |
| `orientation` | `'horizontal' \| 'vertical'` | Default `horizontal`. |

## Example

```tsx
<Tabs.Root value={view} onValueChange={(v) => setView(v as ViewMode)}>
  <Tabs.List>
    <Tabs.Trigger value="grid">Grid</Tabs.Trigger>
    <Tabs.Trigger value="timeline">Timeline</Tabs.Trigger>
    <Tabs.Trigger value="compare">Před×Po</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="grid"><PhotoGrid …/></Tabs.Content>
  <Tabs.Content value="timeline"><PhotoTimeline …/></Tabs.Content>
  <Tabs.Content value="compare"><BeforeAfter …/></Tabs.Content>
</Tabs.Root>
```

## Do / Don't

- Use Tabs when the user switches between sibling content panels with purely client state
- Keep tab labels short (1–2 words)
- Don't use Tabs for URL-routed sections — use SegmentControl
- Don't hide critical settings behind non-default tabs (users may never see them)
