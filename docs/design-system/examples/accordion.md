# Accordion

Collapsible sections over Radix Accordion. Supports `type="single"` (one open at a time, optionally collapsible) and `type="multiple"` (many open simultaneously).

## Subcomponents

- `Accordion.Root` — `type`, `collapsible`, `value` / `defaultValue`, `onValueChange`
- `Accordion.Item` — `value` required
- `Accordion.Trigger` — rotating ChevronDown indicator baked in
- `Accordion.Content` — body (animates open/close)

## Example

### Settings sections

```tsx
<Accordion.Root type="single" collapsible defaultValue="makra">
  <Accordion.Item value="makra">
    <Accordion.Trigger>Makra</Accordion.Trigger>
    <Accordion.Content>
      <Switch …/>
    </Accordion.Content>
  </Accordion.Item>
  <Accordion.Item value="plates">
    <Accordion.Trigger>Váhy a kotouče</Accordion.Trigger>
    <Accordion.Content>
      <PlateInventoryForm …/>
    </Accordion.Content>
  </Accordion.Item>
</Accordion.Root>
```

## Do / Don't

- Use Accordion for long settings/FAQ pages where multiple independent sections would overwhelm
- Prefer `type="single" collapsible` for FAQ-style content
- Don't use for primary navigation — use SegmentControl or Tabs
- Don't nest Accordions; flatten instead
