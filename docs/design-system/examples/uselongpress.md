# useLongPress

React hook that returns the event props needed to detect a long-press gesture (press-and-hold ≥ 500ms without moving) on a child element.

## API

```tsx
function useLongPress(
  onLongPress: () => void,
  options?: { thresholdMs?: number; moveTolerancePx?: number }
): {
  onPointerDown: (e: PointerEvent) => void
  onPointerUp: (e: PointerEvent) => void
  onPointerMove: (e: PointerEvent) => void
  onPointerCancel: (e: PointerEvent) => void
}
```

Default threshold: 500ms. Default move tolerance: 6px (cancels if the finger drifts).

## Example

### Skip exercise on long-press

```tsx
const [skipOpen, setSkipOpen] = useState(false)
const longPress = useLongPress(() => setSkipOpen(true))

return (
  <div {...longPress}>
    <ExerciseCard …/>
  </div>
)
```

## Do / Don't

- Pair with a visible affordance (e.g. a hint "Podrž pro přeskočit") — long-press is discoverable-last
- Use for destructive or secondary actions, never the primary action
- Don't use for primary CTAs — use a tap target instead
- Don't call hooks conditionally; always attach `{...longPress}` and guard inside the callback
