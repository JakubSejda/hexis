# Section

Titled content group with an optional action slot in the header. Two visual variants: `default` (heading + divider) and `region` (just the heading, used for looser top-level sections).

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | required | Section heading. |
| `action` | `ReactNode` | — | Right-aligned slot (usually a Button or Link). |
| `variant` | `'default' \| 'region'` | `'default'` | Visual treatment. |
| `className` | `string` | — | Additional classes. |
| `children` | `ReactNode` | required | — |

## Examples

### With CTA

```tsx
<Section title="Tento týden" action={<Link href="/progress/body">Více →</Link>}>
  <WeekMeasurementCard …/>
</Section>
```

### Region variant (no divider)

```tsx
<Section title="Life Areas" variant="region">
  <Grid cols={2} gap={3}>
    …
  </Grid>
</Section>
```

## Do / Don't

- Use Section for titled groupings that benefit from a header + action row
- Use `variant="region"` for top-level groupings on pages with many headers
- Don't put a Heading inside Section children — Section already renders one
- Don't nest Sections — reach for Card + Heading instead
