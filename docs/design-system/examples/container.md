# Container

Max-width centered wrapper with responsive horizontal padding. Use as the outermost element of a page body.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `size` | `'sm' \| 'md' \| 'lg' \| 'full'` | `'md'` | Max-width breakpoint. `'full'` = no max-width. |
| `className` | `string` | — | Additional classes merged via `cn()`. |
| `children` | `ReactNode` | required | — |

## Examples

### Standard page

```tsx
<Container>
  <Stack gap={4}>
    <Heading level={1}>Progres</Heading>
    <MeasurementGrid initialRows={rows} />
  </Stack>
</Container>
```

### Full-bleed dashboard

```tsx
<Container size="full">
  <AvatarHero … />
  <TodayNutritionCard … />
</Container>
```

## Do / Don't

- Use one `Container` per page at the top level
- Use `size="full"` on the Dashboard (edge-to-edge layout)
- Don't nest Containers — pick the outermost size once
- Don't add horizontal padding on children; Container owns it
