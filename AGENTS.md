# AGENTS Notes

## Design system (read first when styling UI)

All design tokens — colors, fonts, z-index, container breakpoints — live in the
`@najafi/design-system` package and are imported by `src/index.css`. **Before
writing any UI, read [`packages/design-system/AGENTS.md`](packages/design-system/AGENTS.md)**:
it is the contract for which token utilities/variables to use. Never use raw
Tailwind color scales (`text-red-500`, `bg-slate-100`) — use semantic tokens
(`text-destructive`, `bg-surface`, `text-foreground/48`) which auto-adapt to
light/dark. App-local utility classes (`.shadow-*`, `.popover-styled`, …) still
live in `src/index.css @layer utilities`.

## UI Pitfalls

### 1. Treat popovers / tooltips / dropdowns as a layering problem first, not just a `z-index` problem

- Symptom:
  tooltip, dropdown, or hover card appears underneath the next section, gets clipped by a rounded panel, or seems to stop at the parent card boundary.
- Typical root cause:
  an ancestor has `overflow-hidden`, `overflow-y-auto`, `transform`, `filter`, `opacity`, or an explicit `z-index` that creates a new stacking context or clipping context. In that situation, raising the child `z-index` alone does not fix it.
- Rule:
  any floating UI inside scrollable cards or rounded containers must be checked for both:
  `stacking context`
  `overflow clipping`
- Preferred approach:
  use a shared popover / portal layer when the content may extend outside the card.
  if the floating content must stay local, ensure every ancestor on the path allows visible overflow and does not accidentally create a competing stacking context.
- Avoid:
  putting help tooltips inside panels that use `overflow-hidden` just to clip borders / radius.
  assuming `z-[9999]` can escape parent clipping.
- Before shipping:
  hover every tooltip and open every dropdown near card edges, section boundaries, and scroll containers.
  specifically test:
  inside `overflow-y-auto` panels
  inside rounded cards with `overflow-hidden`
  near sticky headers and titlebars
  at the bottom edge of a section where the popover overlaps the next block
- Fast mental checklist:
  if a layer is cut off, inspect parent `overflow` first.
  if a layer is behind something, inspect stacking context and semantic z-index scale second.
  if the layer needs to visually escape the card, use a portal instead of fighting local CSS.

### 2. Do not couple selection state with list ordering unless reordering is explicitly intended

- Symptom:
  switching the current item makes the clicked row jump to the top, so it looks like the list was replaced instead of the selection changing.
- Typical root cause:
  sorting logic prioritizes the selected item globally, even in lists where users expect a stable order.
- Rule:
  stable information lists should keep their original order and only update selected styling / detail panes.
- Preferred approach:
  separate `stableSort(...)` from `selectedFirstSort(...)`, and use the latter only for menus or pickers where surfacing the current item first is intentional.
- Before shipping:
  click through at least 3 sibling items and confirm the list order stays stable unless the design explicitly calls for reorder-on-select.
