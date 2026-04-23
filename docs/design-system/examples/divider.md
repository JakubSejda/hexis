# Divider

1px separator. Horizontal by default; vertical mode for inline use.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Axis. |
| `className` | `string` | — | Additional classes (e.g. margin overrides). |

## Examples

### Between content blocks

```tsx
<Stack gap={3}>
  <TodayNutritionCard …/>
  <Divider />
  <WeekMeasurementCard …/>
</Stack>
```

### Inline vertical

```tsx
<div className="flex items-center gap-2">
  <span>3 sets</span>
  <Divider orientation="vertical" className="h-4" />
  <span>8 reps</span>
</div>
```

## Do / Don't

- Use Divider to separate related content at equal weight
- Don't use inside Card — Card already has a border + padding
- Don't use to separate unrelated sections — use Stack gap or Section instead
- For vertical mode, set an explicit height via className
