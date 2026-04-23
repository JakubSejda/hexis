# Menu

Dropdown menu over Radix DropdownMenu. Subcomponent pattern. `Item` has a `variant="danger"` for destructive actions.

## Subcomponents

- `Menu.Root` — controlled / uncontrolled open state
- `Menu.Trigger` — `asChild`-friendly; children become the trigger
- `Menu.Content` — portaled, positioned content
- `Menu.Item` — `onSelect(event)`, `variant?: 'default' | 'danger'`, `disabled?`
- `Menu.Separator` — 1px divider between groups

## Example

### Row actions

```tsx
<Menu.Root>
  <Menu.Trigger asChild>
    <Button variant="ghost" size="sm" iconLeft={<MoreVertical size={16} />} />
  </Menu.Trigger>
  <Menu.Content>
    <Menu.Item onSelect={() => edit(id)}>Upravit</Menu.Item>
    <Menu.Item onSelect={() => duplicate(id)}>Duplikovat</Menu.Item>
    <Menu.Separator />
    <Menu.Item variant="danger" onSelect={() => remove(id)}>Smazat</Menu.Item>
  </Menu.Content>
</Menu.Root>
```

## Do / Don't

- Use Menu for row/item-level actions when there are 2+ actions (use a Button otherwise)
- Put destructive actions below a Separator with `variant="danger"`
- Don't use Menu for primary CTAs — those belong inline as Buttons
- Don't stuff 10+ items in one menu; group with Separators or split into nested menus
