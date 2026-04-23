# HeroBanner

Full-bleed section with optional image background, gradient/dark/none overlay, and a children slot (typically a `Heading`). Ships in Part 2 with gradient-only fallback — actual Dashboard artwork lands in SP3.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `imageSrc` | `string` | — | `next/image` source. If omitted, gradient-only. |
| `imageAlt` | `string` | `''` | Image alt text. |
| `overlay` | `'dark' \| 'gradient' \| 'none'` | `'gradient'` | Overlay treatment on top of the image. |
| `height` | `'sm' \| 'md' \| 'lg'` | `'md'` | 128 / 192 / 256 px. |
| `className` | `string` | — | Merged onto the `<section>`. |
| `children` | `ReactNode` | required | Typically a Heading; positioned at bottom-left. |

## Examples

### Gradient-only (Part 2 default)

```tsx
<HeroBanner height="md">
  <Heading level={1} variant="display">Vítej zpět</Heading>
</HeroBanner>
```

### With image + dark overlay

```tsx
<HeroBanner imageSrc="/hero-upper-body.jpg" imageAlt="" overlay="dark" height="lg">
  <Stack gap={1}>
    <Heading level={1} variant="display">Horní tělo</Heading>
    <span className="text-muted text-sm">8 cviků · 60 min</span>
  </Stack>
</HeroBanner>
```

## Do / Don't

- Use HeroBanner at the top of page-level layouts; don't inline inside Card
- Set `overlay="dark"` when the image is busy and the heading needs contrast
- Don't omit `imageAlt` for informative images — empty string only for decorative backgrounds
- Don't stack two HeroBanners on the same page
