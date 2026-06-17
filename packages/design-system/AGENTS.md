# Design system contract — read before writing any UI

This package (`@najafi/design-system`) is the single source of truth for the
visual language. When you build or change UI, you MUST style from this vocabulary
instead of inventing colors, spacing, or one-off classes. Consistency is the
whole point: every screen should look like it came from the same system.

## Golden rules

1. **Never use raw Tailwind color scales.** No `text-red-500`, `bg-slate-100`,
   `border-gray-200`. Use the semantic tokens below — they auto-adapt to light/dark,
   so you also never need a `dark:` color variant.
2. **Color = meaning, not hue.** Errors → `destructive`, success → `success`,
   warnings/amber → `info`, brand highl/active → `accent`, body text → `foreground`,
   panels → `surface` / `background`.
3. **Two ways to reach a token — know which applies (see tables):**
   - Tokens exposed to Tailwind → use the **utility** directly: `bg-surface`, `text-foreground-50`.
   - Tokens that are CSS-variables-only → use **arbitrary value**: `bg-[var(--surface-muted)]`.
4. **Opacity via `/NN`**: `text-foreground/48`, `bg-foreground/10`, `text-destructive/80`.
   This is the idiomatic way to get a translucent token (borders, hovers, hints).
5. **Spacing/radius**: prefer consistent steps. The app's body scale is driven by
   `--font-size-base: 15px` and `--spacing: 0.25rem`; reuse existing paddings
   (`px-3 py-2` for controls, `px-4 py-3` for cards) rather than novel combos.

## Color utilities (exposed to Tailwind — use as `bg-*` / `text-*` / `border-*` / `ring-*`)

| Utility token | Meaning |
|---|---|
| `background` | App/window base surface |
| `surface` | Raised panel/card surface |
| `foreground` | Primary text & icons |
| `accent` | Brand highlight, active/selected state |
| `info` | Amber — warnings, "ask" affordances |
| `success` | Green — connected, confirmed, checkmarks |
| `destructive` | Red — errors, destructive actions |
| `foreground-1.5` … `foreground-95` | **Solid** foreground mixed toward background (separators, muted text, fills). Steps: 1.5, 2, 3, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95 |
| `border` · `input` · `ring` | Hairline border, form input border, focus ring |
| `card` · `popover` · `secondary` · `muted` · `muted-foreground` | shadcn-compat surfaces (use `surface`/`foreground-*` first) |
| `sidebar-hover` | Subtle list-row hover background |

> Solid vs translucent: `text-foreground-50` is an opaque mix toward the
> background; `text-foreground/50` is 50% alpha. Use the **alpha** form over
> images/scenic backgrounds, the **solid** form for separators and fills.

## Other token utilities

- **Fonts**: `font-sans` (UI default), `font-mono` / `font-serif` (both JetBrains Mono).
- **Z-index** (semantic, never magic numbers): `z-base z-local z-sticky z-titlebar
  z-panel z-dropdown z-tooltip z-modal z-overlay z-fullscreen z-floating-backdrop
  z-floating-menu z-island z-island-popover z-splash`.
- **Container queries** (responsive by panel width, not viewport): variants
  `@panel-compact:` (448px) · `@panel-medium:` (640px) · `@mobile:` (768px),
  and widths `max-w-panel-compact` etc.

## CSS-variables-only tokens (no utility — use `bg-[var(--x)]`, `style={{}}`, or in custom CSS)

| Variable | Use |
|---|---|
| `--surface-muted` / `--surface-subtle` | Slightly tinted panel fills (hover, nested) |
| `--background-elevated` | Elevated background (menus, raised rows) |
| `--foreground-dimmed` | Text on unfocused panels |
| `--success-text` / `--destructive-text` / `--info-text` | Status text tinted toward foreground (more legible than the raw status color on body text) |
| `--shadow-minimal` / `--shadow-modal-small` | Reusable layered shadow values |
| `--foreground-rgb` / `--accent-rgb` / `--info-rgb` / `--success-rgb` / `--destructive-rgb` | RGB triples for `rgba(var(--x-rgb), α)` tinted shadows/gradients |

## How it's wired

```css
/* a project that already imports Tailwind (the skill-grove app does): */
@import "tailwindcss" source(none);
@import "@najafi/design-system/tokens.css";

/* a fresh project with no Tailwind yet: */
@import "@najafi/design-system/styles.css";
```

The raw definitions live in `src/tokens/{base,dark,theme}.css` — read those when
you need a token that isn't listed here, rather than guessing a name.

## Components

UI primitives (`Button`, `Card`, `Input`, `Badge`, `Table`, `Dialog`, `Spinner`, …)
are being extracted into `src/primitives/` (阶段3). Until they land, compose with
the token vocabulary above. **Once a primitive exists, use it** — e.g. reach for
`<Button variant="destructive">`, do not hand-assemble button classNames.

> Host-app note: the skill-grove app additionally defines utility classes
> (`.shadow-minimal`, `.shadow-middle`, `.shadow-strong`, `.popover-styled`,
> `.scrollbar-hide`, …) in its own `index.css @layer utilities`. Those are
> app-local today; treat the tokens above as the portable, cross-project contract.
