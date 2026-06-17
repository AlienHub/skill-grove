# @najafi/design-system · primitives

Props-driven React primitives, styled **entirely from the design-system token
vocabulary** (`base.css` / `dark.css` / `theme.css`). Same authoring convention
as the existing `Button.tsx`: `forwardRef`, `variant`/`size` props, `cn()`
joiner, semantic token classes only (no raw hex, no `dark:` color variants).

These were finalised in **Claude Design** against the real token constraints,
then dropped in here — drop the folder into `packages/design-system/src/primitives/`.

## Install / wire-up

```css
/* project that already imports Tailwind (the skill-grove app): */
@import "tailwindcss" source(none);
@import "@najafi/design-system/tokens.css";
@import "@najafi/design-system/primitives.css";   /* ← keyframes + loader classes */
```

`primitives.css` carries only what can't be inline tokens: the `.ripple-loader`
/ `.spinner` / `.animate-shimmer-loading` keyframes. Everything else resolves
from the token utilities (`bg-surface`, `text-foreground-50`, `border-border`,
`ring-accent/35`, …).

`Dialog` uses `react-dom`'s `createPortal` and the `z-modal` token utility.

## Components

| Component | Key props | Notes |
|---|---|---|
| `Button` | `variant` solid/ghost/outline/destructive · `size` sm/md/lg · `iconOnly` · `loading` | unchanged reference primitive |
| `IconButton` | same as Button (square) | thin `Button iconOnly` wrapper; defaults to `ghost` |
| `Ripple` | `size` · `className` | signature loader (two phase-offset rings, `currentColor`) |
| `Card` | `variant` elevated/outlined/muted/subtle · `padding` | `rounded-[12px] px-4 py-3` |
| `Input` | `inputSize` · `error` · `leftIcon` | `h-8 px-3` · focus `ring-accent/35` |
| `Textarea` | `error` | `resize-y min-h-[84px]` |
| `Badge` | `tone` accent/success/info/destructive/neutral · `variant` soft/outline/solid · `dot` | soft = tinted bg + `*-text` |
| `Switch` | `checked` · `onCheckedChange` · `disabled` | `role="switch"`, `foreground` fill when on |
| `SegmentedControl<T>` | `options` · `value` · `onChange` | selected chip lifts to `surface` |
| `Checkbox` | `checked` · `onCheckedChange` · `disabled` · children | `foreground` fill + check icon |
| `Radio` | `checked` · `onSelect` · `name` · children | circular sibling of Checkbox |
| `Select` | native `<select>` + `error` | styled trigger + custom chevron |
| `Table` / `THead` / `TH` / `TR` / `TD` | — | hairline-separated, `surface-muted` header |
| `DefinitionTable` | `rows: { label, value }[]` | key/value layout |
| `Dialog` | `open` · `onClose` · `width` | + `Dialog.Header/Title/Description/Body/Footer` |

## Active-state rule

Every selection/active state (Switch, SegmentedControl, Checkbox, Radio,
selected rows) fills with **`foreground`, not `accent`** — the same "chosen"
language as `Button` solid — so selection never competes with the brand-purple
accent. `accent` stays reserved for brand highlight / focus rings.

## Examples

```tsx
import {
  Button, IconButton, Card, Input, Textarea, Badge, Switch,
  SegmentedControl, Checkbox, Radio, Select, Table, THead, TH, TR, TD,
  DefinitionTable, Dialog, Ripple,
} from '@najafi/design-system/primitives'

<Card variant="elevated">
  <Input leftIcon={<SearchIcon />} placeholder="Search skills" />
  <Textarea error placeholder="Describe…" />
  <Badge tone="success" dot>Live</Badge>
</Card>

<Switch checked={scan} onCheckedChange={setScan} aria-label="Scan on launch" />

<SegmentedControl
  value={theme}
  onChange={setTheme}
  options={[
    { label: 'System', value: 'system' },
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
  ]}
/>

<Checkbox checked={a} onCheckedChange={setA}>Watch for changes</Checkbox>
<Radio checked={model === 'opus'} onSelect={() => setModel('opus')} name="model">Opus</Radio>

<Select value={target} onChange={(e) => setTarget(e.target.value)}>
  <option value="finder">Open in Finder</option>
  <option value="terminal">Open in Terminal</option>
</Select>

<DefinitionTable rows={[
  { label: 'Created', value: '2026-06-12' },
  { label: 'Temperature', value: '0.7' },
]} />

<Dialog open={open} onClose={close}>
  <Dialog.Header>
    <Dialog.Title>Publish skill?</Dialog.Title>
    <Dialog.Description>It will be available to your whole workspace.</Dialog.Description>
  </Dialog.Header>
  <Dialog.Footer>
    <Button variant="outline" onClick={close}>Cancel</Button>
    <Button onClick={publish}>Publish</Button>
  </Dialog.Footer>
</Dialog>
```
