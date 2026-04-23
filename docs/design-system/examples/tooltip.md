# Tooltip

Re-shaped single-export hover/focus tooltip over Radix Tooltip with `delayDuration={0}`. Mobile fallback = focus listener — tapping a focusable trigger opens the tooltip.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `content` | `string` | required | Tooltip text. |
| `side` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'top'` | Radix side placement. |
| `children` | `ReactElement` | required | Single focusable element (Radix `asChild` pass-through). |

Escape hatches: `TooltipProvider`, `TooltipRoot`, `TooltipTrigger`, `TooltipContent`.

## Examples

### Badge hint

```tsx
<Tooltip content={`${weeks} týdnů bez PR — zkus deload`}>
  <span tabIndex={0} className="bg-accent/10 text-accent inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs">
    <AlertTriangle size={12} />
    {weeks}t. bez PR
  </span>
</Tooltip>
```

### Icon button

```tsx
<Tooltip content="Přidat cvik">
  <Button variant="ghost" iconLeft={<Plus />} onClick={add} />
</Tooltip>
```

## Do / Don't

- Wrap Tooltip around a focusable element (Button, `<span tabIndex={0}>`, `<a>`)
- Keep content short — 1 short sentence
- Don't use Tooltip for critical info — it's hover/focus-only on desktop; must also work without it
- Don't nest a button inside another button to get a Tooltip on it; use the escape-hatch trigger
