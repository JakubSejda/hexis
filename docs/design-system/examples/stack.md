# Stack

Vertical flex container with configurable gap. Default alignment: stretched.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `gap` | `1 \| 2 \| 3 \| 4 \| 5 \| 6 \| 8` | `4` | Tailwind gap scale (×0.25rem). |
| `as` | `ElementType` | `'div'` | Polymorphic element. |
| `className` | `string` | — | Additional classes. |
| `children` | `ReactNode` | required | — |

## Examples

### Page body

```tsx
<Stack gap={4}>
  <Heading level={1}>Trénink</Heading>
  <ResumeBanner />
  <ExerciseStepper … />
</Stack>
```

### As semantic section

```tsx
<Stack as="section" gap={2}>
  <Heading level={3}>Nastavení</Heading>
  <Switch label="Cukry" />
  <Switch label="Tuky" />
</Stack>
```

## Do / Don't

- Use Stack for vertical rhythm between unrelated blocks
- Use `gap={2}` inside cards, `gap={4}` between cards
- Don't use Stack for horizontal layouts — use a flex row directly
- Don't wrap single-child content in Stack
