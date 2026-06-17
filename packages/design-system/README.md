# @najafi/design-system

Shared design system — **design tokens**, **UI primitives**, and an **AI usage contract** —
extracted from the `skill-grove` app so every project (and every vibe-coding session) builds on
one consistent visual language instead of re-deriving it each time.

> Status: scaffolding (阶段0). See [`docs/design-system-blueprint.md`](../../docs/design-system-blueprint.md) for the full plan.

## Usage (planned)

```css
/* app entry css */
@import "@najafi/design-system/styles.css";
```

```tsx
import { Button, Card } from '@najafi/design-system'
```

## Layout

```
src/
├── tokens/        # base.css · dark.css · theme.css   (阶段1)
├── styles.css     # the single CSS entry              (阶段1)
├── primitives/    # Button, Card, Input, …            (阶段3)
└── index.ts       # JS/TS entry
AGENTS.md          # AI usage contract                 (阶段2)
```
