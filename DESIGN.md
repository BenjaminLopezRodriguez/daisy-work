# Design

## Visual Theme

Operational infrastructure for governed work. Deep green as the committed brand surface, green-tinted off-white pages, near-black ink, yellow used sparingly for attention — not decoration.

## Color Palette

| Role | Light | Notes |
|------|-------|-------|
| Background | `oklch(0.985 0.008 155)` | Green-tinted off-white, not cream |
| Foreground | `oklch(0.18 0.02 155)` | Near-black with green undertone |
| Primary | `oklch(0.38 0.09 155)` | Deep green |
| Primary foreground | `oklch(0.98 0.01 155)` | |
| Accent | `oklch(0.88 0.14 95)` | Yellow, sparse |
| Accent foreground | `oklch(0.25 0.04 95)` | |
| Muted | `oklch(0.94 0.012 155)` | |
| Destructive | keep shadcn red family | |

Dark mode: deep green-black backgrounds with light ink; primary lightens for contrast.

## Typography

- Keep Geist on `<html>` (plan constraint)
- Display/headings: Geist with tighter tracking, larger weight
- Utility/data: same family at smaller sizes

## Components

Composable daisy primitives over shadcn. Cards only when they contain interaction (work order actions, credential review). Badges for risk/status. No floating hero chips.
