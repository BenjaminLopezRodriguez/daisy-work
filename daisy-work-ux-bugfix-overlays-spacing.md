# Daisy.work — UX Bug-Fix and Interaction-Layer Refactor

The previous mobile-first overhaul improved structure, but the current implementation still has serious responsive UX defects: overlapping content, cropped cards, inconsistent spacing, oversized empty regions, clipped sidebar/footer content, weak modal separation, and layouts that compress instead of adapting.

Perform a focused **responsive bug-fix and interaction-layer refactor**. Do not redesign the brand again. Preserve the current visual language, but fix the layout system and move secondary or dense UI into the correct shadcn dialogs, sheets, drawers, popovers, banners, accordions, and menus.

All shadcn components are installed. Use them.

Use `tailwindcss-animate` or the project’s installed Tailwind animation utilities for restrained transitions.

---

## 1. Immediate defects visible in the current build

Fix these before adding features:

- Sidebar footer/account content is clipped or overlapping at the bottom.
- The circular developer widget overlaps navigation and account UI.
- Cards and sections are visibly cropped at the viewport bottom.
- Desktop pages can extend below the visible area without enough scroll clearance.
- Some layouts create content underneath fixed or sticky controls.
- The collapsed sidebar is too narrow and causes awkward icon/account clipping.
- Sidebar transitions create unstable content widths.
- Content columns are too tightly packed at some widths and too empty at others.
- The dashboard right rail becomes cramped while the left rail remains oversized.
- Active Work cards are cut off and partially hidden.
- Profile layout has huge unused space and tabs stretched far beyond their content.
- Payment and profile pages use desktop-width tables/tabs without responsive adaptation.
- Page content begins too close to the header or sidebar at some breakpoints.
- Header and sidebar borders do not always align cleanly.
- Long descriptions are truncated without an explicit expansion affordance.
- Work cards have insufficient bottom spacing and unclear clickable boundaries.
- Mobile and narrow-tablet behavior appears to be desktop compression rather than a genuine responsive layout.
- Sticky UI lacks coordinated `z-index`, safe-area, and content offset rules.
- Several controls are visually close enough to appear grouped even when they are unrelated.

Do not report completion until every route has been manually checked at all required viewport widths.

---

# 2. Root layout rules

Establish one reliable app-shell geometry.

## Required shell structure

```text
App root
├── Desktop sidebar
├── Main column
│   ├── App header
│   └── Scrollable page content
└── Mobile bottom navigation
```

Use this behavior:

```css
html,
body {
  min-height: 100%;
}

body {
  overflow-x: hidden;
}

.app-shell {
  min-height: 100dvh;
}

.app-main {
  min-width: 0;
}

.app-content {
  min-width: 0;
  overflow-x: hidden;
}
```

Do not create multiple competing full-height scroll containers.

Prefer the browser/document as the main vertical scroll container unless a specific pane requires independent scrolling.

Avoid combinations of:

- `h-screen`
- nested `overflow-hidden`
- fixed headers
- fixed sidebars
- inner `overflow-y-auto`

unless all offsets are explicitly coordinated.

Use `min-h-dvh`, not only `h-screen`.

---

# 3. Prevent clipping and overlap

## Sticky and fixed controls

For every sticky or fixed element:

- Define its exact height.
- Define its `z-index`.
- Add equivalent content padding or margin.
- Respect safe-area insets.
- Test at 320px and short viewport heights.

Suggested layer system:

```text
Base content: z-0
Sticky page controls: z-20
Desktop header/sidebar: z-30
Mobile bottom navigation: z-40
Sheets/drawers/dialog overlays: shadcn defaults or z-50+
Toasts: above overlays only when appropriate
```

Mobile page content must include:

```css
padding-bottom: calc(var(--mobile-nav-height) + env(safe-area-inset-bottom) + 1rem);
```

Do not hard-code `pb-28` everywhere. Create one shared token or layout primitive.

## Sidebar footer

The sidebar footer must never overlap navigation.

Use:

- Sidebar container as `flex min-h-dvh flex-col`
- Navigation as `min-h-0 flex-1 overflow-y-auto`
- Footer as `shrink-0`
- Account row inside footer
- Safe bottom padding
- No absolutely positioned account controls

The account avatar, label, Help, and Settings must remain fully visible at short viewport heights.

When the sidebar is collapsed:

- Hide labels cleanly.
- Keep 44×44 px icon buttons.
- Use tooltips.
- Do not partially render text.
- Do not show an avatar extending outside the sidebar.
- Account actions should open a `DropdownMenu`.

## Development widget

The floating black developer widget must not overlap application controls.

Either:

1. Hide it outside development, or
2. Place it in a reserved corner that does not conflict with sidebar/footer/mobile navigation, or
3. Add environment-aware offsets.

Do not treat third-party overlays as outside the UX audit.

---

# 4. Responsive breakpoints and density

Use explicit layout modes instead of allowing grids to squeeze.

```text
Mobile: < 640px
Large mobile/small tablet: 640–767px
Tablet: 768–1023px
Desktop: 1024–1279px
Large desktop: ≥1280px
```

## Dashboard

Use:

```text
<1024px:
- Single-column
- Summary becomes horizontal scroll or 2-column compact grid
- Quick actions remain 2-column
- Recent activity below active work

1024–1279px:
- Main column + narrower right rail
- Right rail min width 280px
- Main column min-width 0

≥1280px:
- Main content approximately 2fr
- Right rail approximately 1fr
```

Never use a grid where either column can become too narrow to display its content.

Suggested:

```tsx
className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]"
```

At smaller widths, collapse to one column.

## Work cards

Use:

```text
Mobile: one column
Tablet: one column or two columns only when cards remain at least ~340px
Desktop: two columns
Large desktop: optional three columns only if information remains readable
```

Use CSS Grid with `minmax(0, 1fr)`.

Never force a two-column layout when the available width is too small.

## Stat cards

Use:

```text
Mobile: 2 columns where possible, otherwise 1
Tablet/Desktop: 3 columns
```

Avoid stat cards with large empty interiors. Use compact padding and content-driven height.

---

# 5. Content container rules

Replace inconsistent page widths with shared primitives.

```text
Default operational page: max-w-[1440px]
Dense table page: max-w-[1600px]
Focused form: max-w-3xl
Profile/details: max-w-6xl
Marketing: max-w-7xl
```

Use:

```tsx
mx-auto w-full min-w-0 px-4 sm:px-6 lg:px-8
```

Every grid child that contains text or cards must use `min-w-0`.

Do not apply `w-screen` inside the app shell.

Do not use fixed pixel widths for page content except deliberate rails.

---

# 6. Spacing corrections

Create and use consistent spacing primitives.

## Page spacing

```text
Header to content: 24px mobile, 32px desktop
Major sections: 32–48px
Section title to content: 12–16px
Card padding: 16px mobile, 20–24px desktop
Card gaps: 12–16px mobile, 16–24px desktop
```

Do not allow unrelated sections to visually touch.

Do not use large blank regions as a substitute for hierarchy.

## Card spacing

Each card should:

- Have internal vertical rhythm.
- Keep badges and metadata together.
- Keep title and description together.
- Separate actions from text.
- Use a footer area when actions are persistent.
- Avoid bottom clipping.
- Avoid fixed height unless content is predictable.

Remove fixed card heights that cause truncation.

Use `line-clamp` only with an explicit “Show more” or detail route.

---

# 7. Move secondary UI into overlays

The current pages are clustered because too much UI is rendered inline.

Use shadcn overlays according to intent.

## Dialog

Use for:

- Confirming approval
- Confirming payment release
- Editing a compact record
- Viewing one credential
- Reviewing a short submission summary
- Confirming destructive actions

Dialogs must:

- Have one clear purpose.
- Use `DialogHeader`, `DialogTitle`, and `DialogDescription`.
- Keep primary and secondary actions in `DialogFooter`.
- Become a Drawer on mobile if content is form-heavy or vertically long.

## Sheet

Use for:

- Desktop/mobile filter panels
- Work Order contextual details
- Notifications
- Secondary navigation
- Audit trail detail
- Full-height contextual panels

Use side Sheets on desktop and bottom/side Sheets on mobile depending on content.

## Drawer

Use for:

- Mobile filters
- Mobile quick-create actions
- Work card details
- Payment transaction details
- Credential details
- Compact mobile forms
- Sorting and view options

Do not render dense filter sets inline above every list on mobile.

## Popover

Use for:

- Date selection
- Lightweight sorting
- Compact status explanation
- Small contextual actions
- Quick previews

## DropdownMenu

Use for:

- Card overflow actions
- Account menu
- Row actions
- Non-primary actions

## Accordion and Collapsible

Use for:

- Governance details
- Requirements
- Credential metadata
- Work Order sections on mobile
- Optional form sections

## Alert and banners

Use banners for:

- Mock data disclosure
- Missing credentials
- Failed payment connection
- Incomplete organization setup
- Expiring license
- Unsaved changes
- Offline/retry state

Use `Alert` for inline page context.

Use a dismissible top-of-page banner only for persistent, high-value information.

Do not repeat the same mocked-verification message on every card.

---

# 8. Dashboard fixes

## Needs Attention

Reduce card height and improve scannability.

Each item should be structured as:

```text
Icon
Priority + category + due date
Title
One-line explanation
Primary action
Overflow actions
```

On desktop, actions may sit at the far right.

On mobile, place actions in a footer row.

Do not render three oversized full-width cards if a compact list provides better scanning.

Use a `Card` or `DataList` pattern consistently.

## Summary

Replace tall Summary cards with compact stat cards.

Use a wrapping grid:

```text
Mobile: 3 compact cards or horizontal scroll
Desktop: stacked only when the rail is narrow
```

The summary rail should not consume excessive vertical space.

## Quick Actions

Use 44–48px targets.

Use icons with visible labels.

On desktop, cards are acceptable.

On mobile, use a 2×2 grid or a Drawer launched by a single “Quick actions” control if space is constrained.

## Active Work

Ensure card rows are never clipped.

Add:

- Bottom page padding
- Responsive card grid
- Full-card click target
- Explicit details action
- Clamped text with expansion
- Status and payment visible without opening

Do not cut cards at the fold because another fixed element covers them.

---

# 9. Work page fixes

The filter bar should adapt by breakpoint.

## Mobile

Show:

- Search field
- Filter button
- Sort button
- Status tabs or segmented control
- View control only if it provides meaningful value

Filters open in a `Drawer`.

Sort opens in a `Drawer`, `Select`, or `DropdownMenu`.

Do not keep multiple desktop selects inline on mobile.

## Desktop

Use:

- Search
- Sort select
- Risk filter
- Status tabs
- View toggle

Ensure all controls wrap cleanly at narrower desktop widths.

Use:

```tsx
flex flex-col gap-3 lg:flex-row lg:items-center
```

Work cards must use equal structural padding but content-driven height.

Descriptions should not run into metadata.

---

# 10. Payments fixes

The current table is acceptable on wide desktop but must adapt.

## Mobile

Do not squeeze the table.

Render payment transactions as cards or list rows with:

- Work title
- Status
- Amount
- Date
- Counterparty
- Open details action

Open transaction details in a `Drawer`.

## Tablet/Desktop

Use shadcn `Table`.

Wrap only the table in a safe local horizontal scroller if needed.

Keep tabs within the content width.

Do not stretch tab triggers unnaturally across the full page when there are few labels. Use content-sized tabs or a segmented container with reasonable max width.

Move mock-store disclosure into one `Alert`.

---

# 11. Profile fixes

The profile page currently wastes most of the canvas and repeats identity details.

Fix it as follows.

## Header

Use a real profile header:

```text
Avatar
Name
Headline
Location
Availability
Verification status
Primary action
Overflow menu
```

Do not use a narrow vertical oval avatar.

Use shadcn `Avatar` with a square or circular 64–96px treatment.

## Layout

Desktop:

```text
Left rail:
- Profile summary
- Availability
- Service areas
- Verification

Main:
- Tabs
- About
- Credentials
- Recent work
- Reviews
```

Mobile:

```text
Single column
Compact stats
Horizontally scrollable or content-sized tabs
Sections stacked
```

Do not repeat “Maya Chen” and the same metrics again inside About.

Remove duplicate identity blocks.

## Tabs

Tabs should be content-sized or evenly distributed only inside a constrained container.

Do not stretch three tabs across the entire 1400px page.

Use:

```tsx
w-full max-w-3xl
```

or content-sized triggers.

## Stats

Use compact stat cards.

On mobile, use a 3-column compact grid if labels fit; otherwise 1–2 columns.

---

# 12. Collapsed sidebar fixes

The collapsed sidebar shown in the current build is not acceptable.

When collapsed:

- Use a stable width of 64–72px.
- Center icons.
- Keep each item at least 44×44px.
- Hide all labels.
- Use `Tooltip`.
- Remove the wide account text.
- Keep avatar fully inside the rail.
- Do not allow content to overlap the rail.
- Ensure the main content recalculates its available width.
- Animate width transitions without layout jitter.

Use Tailwind transitions:

```tsx
transition-[width] duration-200 ease-out
```

Main content should use:

```tsx
transition-[margin,width] duration-200 ease-out
```

Do not animate every property with `transition-all`.

---

# 13. Animation rules

Use the installed Tailwind animation support or `tailwindcss-animate`.

Animations should clarify state changes, not decorate.

Use:

- `animate-in`
- `fade-in`
- `slide-in-from-*`
- `zoom-in-95`
- `accordion-down`
- `accordion-up`
- `duration-150`
- `duration-200`
- `ease-out`

Apply to:

- Dialogs
- Sheets
- Drawers
- Collapsible sections
- Filter panels
- Newly loaded cards
- Status feedback
- Sidebar expansion

Do not animate large page layout changes excessively.

Respect:

```css
@media (prefers-reduced-motion: reduce)
```

Avoid:

- Bouncing
- Continuous pulsing
- Decorative floating
- Long transitions
- Layout-shifting entrance animations

---

# 14. Text overflow and cropping

Audit all dynamic text.

Use:

- `min-w-0`
- `break-words`
- `overflow-wrap:anywhere` where needed
- `truncate` only for single-line metadata
- `line-clamp-2` or `line-clamp-3` only with detail access

Test:

- Long Work Order titles
- Long organization names
- Long locations
- Long credential titles
- Large payment values
- Long user names
- Translated text expansion

No text may render outside its container.

---

# 15. Empty, loading, and error states

Every route must have:

- Loading state
- Empty state
- Error state
- Permission-denied state where relevant

Use:

- `Skeleton`
- `Alert`
- `Button`
- `EmptyState`
- Dialog/Drawer for recovery actions when appropriate

Do not show internal implementation notes in normal product content.

---

# 16. Required manual viewport audit

Manually inspect every route at:

```text
320×568
375×667
390×844
430×932
768×1024
1024×768
1280×800
1440×900
1600×900
```

Test with both expanded and collapsed sidebar.

Test with short viewport height.

Test browser zoom at:

```text
80%
100%
125%
150%
200%
```

Verify:

- No overlap
- No clipping
- No inaccessible controls
- No hidden card bottoms
- No sideways page scroll
- No sidebar footer collision
- No bottom-nav collision
- No tab overflow without affordance
- No unreadable compressed cards
- No excessive unused space
- Dialogs remain within viewport
- Drawers scroll internally when needed
- Focus is visible
- Escape closes overlays
- Focus returns to trigger

Take screenshots for each breakpoint and compare before declaring success.

---

# 17. Implementation order

1. Fix root shell height and overflow.
2. Fix sidebar flex structure and collapsed state.
3. Fix sticky/fixed offsets and z-indexes.
4. Add shared responsive content/container primitives.
5. Fix dashboard grid and card clipping.
6. Fix Work controls and card responsiveness.
7. Fix Payments mobile transaction rendering.
8. Refactor Profile layout and remove duplicate content.
9. Move filters/details/actions into Dialog, Sheet, Drawer, Popover, and DropdownMenu.
10. Add banners and Alert patterns.
11. Add restrained Tailwind animations.
12. Audit every route and breakpoint.
13. Remove obsolete layout components and unused exports.

Do not add more product functionality before these layout defects are resolved.

---

# 18. Quality gates

Run:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

Also run existing tests.

Do not report only that compilation passes. Compilation does not prove responsive correctness.

The completion report must include:

1. Root causes found
2. Overlap and clipping bugs fixed
3. Sidebar fixes
4. Sticky/fixed offset fixes
5. Responsive layout changes
6. Components moved into Dialogs, Sheets, Drawers, Popovers, Accordions, or menus
7. Banners and Alerts added
8. Animation utilities used
9. Viewports manually tested
10. Screenshots or a concise visual QA summary
11. Remaining visual defects
12. Obsolete components removed

The task is complete only when the application is usable without overlap, clipping, accidental compression, or hidden controls from 320px mobile through large desktop.
