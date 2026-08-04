# Daisy.work — Mobile-First UX Overhaul Prompt

You are redesigning an existing Next.js application called **Daisy.work**.

The current UI is visually acceptable but structurally weak. It wastes space, has poor information density, duplicates navigation, does not scale well to mobile, and does not prioritize user tasks clearly enough.

Your task is to **refactor the existing interface into a production-quality, mobile-first work platform** using the currently installed stack and the full installed **shadcn/ui** component library.

Do not treat this as a cosmetic restyle. Rework the information architecture, responsive behavior, hierarchy, interaction patterns, page composition, and reusable design-system primitives.

---

## Product summary

Daisy.work is a multipurpose work platform where:

- Humans can send work to humans
- Agents can send work to humans
- Humans can send work to agents
- Workers can submit deliverables or proof of completion
- Requesters can review, approve, reject, dispute, or request changes
- Digital work can use lightweight platform-native workflows
- Physical or regulated work can use contracts, credentials, insurance, milestones, and stronger governance

The core product object is a **Work Order**.

---

# 1. Primary redesign objective

Create a responsive application that:

- Feels immediately understandable
- Works naturally from 320px mobile widths through large desktop screens
- Prioritizes the next user action
- Uses progressive disclosure
- Reduces empty, wasted canvas
- Uses information density appropriately
- Uses shadcn components consistently
- Makes mobile workflows first-class
- Avoids duplicated navigation
- Keeps primary actions reachable
- Clearly distinguishes status, risk, payment, credential, and action states
- Preserves accessibility and keyboard support

The application should feel like a modern operational marketplace, combining the clarity of Uber, the structured work model of Upwork, and the approachable density of Instacart.

Do not clone those brands directly.

---

# 2. Existing problems to fix

The current implementation has these issues:

- The desktop sidebar is too wide for the amount of content it contains.
- Top navigation duplicates the sidebar.
- Some pages contain very little information but occupy the entire viewport.
- Important content is presented as raw text rather than structured, scannable UI.
- Work Orders look like plain rows without useful interaction affordances.
- Mobile behavior is not meaningfully designed.
- The Post Work flow uses a horizontal six-step tab row that will not scale well on small screens.
- Page headers and actions are too detached from the content they control.
- Empty states are visually weak and do not help the user take the next action.
- Profile, organization, payment, and inbox pages feel like placeholders rather than real product experiences.
- There is insufficient use of reusable shadcn primitives.
- Status badges, filters, tabs, tables, cards, sheets, drawers, alerts, and dialogs are underused.
- Large regions of whitespace reduce usability rather than improve it.
- The current desktop layout does not adapt gracefully to tablet or narrow windows.
- Repeated navigation and weak page structure increase cognitive load.
- The interface is missing mobile-specific interaction patterns such as bottom navigation, sticky actions, sheets, drawers, and touch-friendly controls.

Refactor existing pages rather than simply adding more content around the current layout.

---

# 3. Required technology

Use the existing project stack:

- Next.js App Router
- TypeScript
- Tailwind CSS
- tRPC
- Drizzle ORM
- PostgreSQL
- `nextjs-ribs`
- `lucide-react`
- `shadcn/ui`

All shadcn components are installed and available.

Use them aggressively where appropriate instead of recreating primitives manually.

Prefer existing repository patterns and imports.

Do not add another UI component library.

---

# 4. Global UX laws to enforce

Implement these principles directly.

## Fitts’s Law

- Minimum touch target: 44×44 px
- Preferred mobile control height: 48 px
- Make full rows clickable when appropriate
- Keep primary actions close to the content they affect
- Keep mobile primary actions within thumb reach
- Avoid tiny icon-only targets

## Hick’s Law

- Reduce simultaneous choices
- Group related actions
- Show one primary action per decision point
- Use progressive disclosure
- Use sensible defaults
- Hide secondary filters and advanced options behind sheets, popovers, or disclosure controls

## Jakob’s Law

- Use familiar navigation, form, marketplace, and dashboard conventions
- Do not invent custom interactions for tabs, menus, dialogs, filters, forms, or navigation

## Doherty Threshold

- Provide immediate feedback for every action
- Use loading, saving, saved, success, error, and pending states
- Use skeletons for loading views
- Use optimistic updates only when safe and reversible

## Recognition over recall

- Keep status, requirements, prior selections, and next actions visible
- Use labels with icons rather than icons alone
- Preserve filters and form state
- Show meaningful context around decisions

## Progressive disclosure

- Show the minimum needed for the current task
- Reveal advanced requirements, governance, pricing, or metadata only when relevant
- Use Accordion, Collapsible, Sheet, Drawer, Dialog, Popover, Tabs, and HoverCard where appropriate

## Error prevention

- Constrain invalid inputs
- Confirm destructive or financial actions
- Explain why an action is disabled
- Preserve entered data
- Support undo where appropriate

## Accessibility

- Meet WCAG 2.2 AA
- Use semantic HTML
- Use visible focus states
- Support keyboard navigation
- Use accessible labels
- Do not use color alone for status
- Respect reduced motion
- Make all dialogs, sheets, tabs, and menus accessible

---

# 5. New application shell

Rebuild the shell responsively.

## Desktop: 1024px and above

Use:

- Compact left sidebar
- Main content region
- Optional right contextual rail only when useful
- No duplicated full top navigation

Sidebar width:

```text
Expanded: 240–256px
Collapsed: 64–72px
```

Desktop sidebar should include:

- Daisy.work logo
- Home
- Work
- Post work
- Inbox
- Payments
- Saved
- Organization
- Profile

Bottom section:

- Help
- Settings
- Account menu

Use shadcn:

- `Sidebar`
- `SidebarProvider`
- `SidebarHeader`
- `SidebarContent`
- `SidebarGroup`
- `SidebarMenu`
- `SidebarMenuItem`
- `SidebarMenuButton`
- `SidebarFooter`
- `SidebarTrigger`

The active route should be visually clear without filling excessive horizontal space.

The desktop header should contain only:

- Sidebar trigger
- Breadcrumbs or page context
- Optional search
- Notifications
- Account menu
- Page-specific primary action when justified

Do not duplicate the main navigation in both top bar and sidebar.

## Tablet: 768px–1023px

Use:

- Collapsed sidebar by default
- Sidebar can expand
- Main content remains readable
- Hide nonessential right rails
- Convert complex tables to cards or horizontally scrollable tables only when necessary

## Mobile: below 768px

Use a dedicated mobile shell.

Top app bar:

- Page title or Daisy.work
- Contextual action
- Account or overflow menu

Bottom navigation:

- Home
- Work
- Post
- Inbox
- Profile

Use shadcn:

- `NavigationMenu` only where it improves hierarchy
- `Sheet` or `Drawer` for the complete mobile menu
- `DropdownMenu` for account actions
- `Command` for global search or quick navigation if useful

The central Post button should be visually prominent but not oversized or gimmicky.

Use safe-area padding:

```css
padding-bottom: env(safe-area-inset-bottom);
```

The mobile bottom navigation must not overlap page content.

---

# 6. Layout system

Create reusable layout primitives.

## Container widths

```text
Marketing content: max-w-7xl
Application content: max-w-[1440px]
Reading/form content: max-w-3xl
Dense operational content: max-w-6xl
```

Avoid stretching all content to full viewport width.

## Responsive padding

```text
Mobile: px-4
Small tablet: sm:px-6
Desktop: lg:px-8
Large desktop: xl:px-10
```

## Vertical spacing scale

Use a consistent scale:

```text
4, 6, 8, 12, 16, 24, 32, 48, 64
```

Avoid arbitrary spacing values unless necessary.

## Page structure

Create reusable components:

- `AppPage`
- `PageHeader`
- `PageHeaderActions`
- `PageSection`
- `SectionHeader`
- `ContentGrid`
- `DetailRail`
- `MobileStickyActions`
- `ResponsiveEmptyState`

Every application page should use a consistent structure.

---

# 7. Use shadcn comprehensively

Use the installed shadcn components instead of hand-building equivalents.

## Navigation

Use:

- `Sidebar`
- `NavigationMenu`
- `Breadcrumb`
- `Tabs`
- `DropdownMenu`
- `Menubar`
- `Command`
- `Sheet`
- `Drawer`

## Data display

Use:

- `Card`
- `Badge`
- `Table`
- `Avatar`
- `Separator`
- `Progress`
- `Skeleton`
- `HoverCard`
- `Tooltip`
- `Accordion`
- `Collapsible`
- `ScrollArea`

## Forms

Use:

- `Form`
- `Input`
- `Textarea`
- `Select`
- `Checkbox`
- `RadioGroup`
- `Switch`
- `Label`
- `Calendar`
- `Popover`
- `InputOTP` where appropriate
- `Slider` only where semantically appropriate
- `Toggle`
- `ToggleGroup`

## Feedback and actions

Use:

- `Alert`
- `AlertDialog`
- `Dialog`
- `Sonner`
- `Progress`
- `Skeleton`
- `Button`
- `DropdownMenu`
- `ContextMenu`

## Collections and filtering

Use:

- `Tabs`
- `Command`
- `Popover`
- `Select`
- `Table`
- `Pagination`
- `Carousel` only if it genuinely improves mobile browsing

Do not force every shadcn component into the product. Use each where it provides the correct interaction pattern.

---

# 8. Page-by-page redesign

## Home dashboard

The current dashboard should become a compact, useful operational home.

### Mobile

Order:

1. Greeting and account context
2. Needs attention
3. Quick actions
4. Active work
5. Recent activity
6. Recommended work

Use:

- `Card`
- `Badge`
- `Progress`
- `Button`
- `DropdownMenu`
- `Skeleton`
- `ScrollArea` only if necessary

Needs attention should use compact actionable cards, not plain text rows.

Each item should include:

- Type icon
- Title
- Short explanation
- Priority
- Due time
- Primary action
- Optional overflow menu

Quick actions:

- Post work
- Browse work
- Submit evidence
- Review submission

Use a two-column mobile grid.

### Desktop

Use a two-column layout:

```text
Left: needs attention + active work
Right: summary cards + quick actions + recent activity
```

Do not leave a large empty right side.

---

## Work page

Replace plain rows with a real work-management experience.

### Mobile

Use:

- Sticky search bar
- Filter button opening a `Sheet`
- Status tabs
- Sort dropdown
- Work Order cards
- Pull-to-refresh is optional, not required

Each Work Order card should show:

- Title
- Status
- Risk level
- Type
- Payment
- Due date
- Location or remote
- Requester or worker
- Next action
- Progress if applicable
- Overflow menu

The entire card may be clickable, but embedded actions must remain independently accessible.

### Desktop

Use:

- Search
- Tabs
- Filters
- Sort
- Toggle between table and cards if useful

Table columns:

- Work
- Status
- Role
- Type
- Due
- Payment
- Next action
- More

Use shadcn `Table`, `DropdownMenu`, `Badge`, and `Pagination`.

Do not show every metadata field at once.

---

## Post Work flow

Rebuild the six-step form as a responsive workflow.

### Mobile

Do not use a wide horizontal six-step tab row.

Use:

- Compact progress indicator
- Current step title
- “Step X of 6”
- Back button
- Sticky bottom action bar
- One task per screen
- Save draft state
- Automatic draft persistence

Suggested mobile header:

```text
Back
Step 1 of 6
Describe the work
Progress bar
```

Sticky footer:

```text
Save draft
Continue
```

Use:

- `Form`
- `Progress`
- `Accordion`
- `Card`
- `Select`
- `RadioGroup`
- `Checkbox`
- `Popover`
- `Calendar`
- `Alert`
- `Dialog`
- `Drawer`

### Desktop

Use a two-column layout:

```text
Left: vertical stepper
Center: active form
Right: live work-order summary
```

The right rail should summarize:

- Work type
- Risk level
- Requirements
- Deliverables
- Price
- Contract level

Do not show all six steps as equal-width tabs across the page.

Use progressive disclosure.

---

## Inbox

Replace the empty placeholder with a real messaging structure.

### Mobile

Use:

- Tabs: All, Messages, Invites, Alerts
- Search
- Conversation list
- Unread badges
- Empty states with meaningful next action

### Desktop

Use a split-pane layout:

```text
Left: conversations and filters
Right: selected conversation or message
```

Use:

- `Tabs`
- `ScrollArea`
- `Avatar`
- `Badge`
- `Textarea`
- `Button`
- `DropdownMenu`
- `Skeleton`
- `Separator`

Do not present one large empty bordered rectangle.

---

## Payments

Replace the single raw payment row.

### Mobile

Show:

1. Available balance
2. Pending
3. Upcoming
4. Transaction filters
5. Transaction list

Use summary cards and a compact transaction list.

Each transaction should show:

- Work title
- Type
- Amount
- Status
- Date
- Counterparty
- Payment stage

### Desktop

Use:

- Summary cards
- Tabs
- Filter controls
- Transaction table
- Detail drawer

Use:

- `Card`
- `Tabs`
- `Table`
- `Badge`
- `DropdownMenu`
- `Drawer`
- `Pagination`

Never expose raw provider IDs as the main human-facing content.

---

## Saved

Replace the placeholder empty state.

### Mobile

Use:

- Tabs or filter chips
- Saved Work Orders
- Saved workers
- Saved searches
- Compact cards

### Desktop

Use:

- Tabs
- Grid or table
- Saved search management

Empty state should explain:

- What can be saved
- Why saving is useful
- The next action

Use an illustration or icon, concise message, and CTA.

---

## Organization

Replace raw label-value text.

Use:

- Organization header
- Verification badge
- Member count
- Billing state
- Plan
- Policies
- Recent activity

Tabs:

- Overview
- Members
- Billing
- Policies
- Programs
- Settings

Use:

- `Tabs`
- `Card`
- `Table`
- `Avatar`
- `Badge`
- `DropdownMenu`
- `Dialog`
- `Alert`
- `Progress`

### Mobile

Stack summary cards.

Move secondary actions into an overflow menu.

### Desktop

Use a summary grid and structured tables.

---

## Profile

Replace the loose text layout with a trusted marketplace profile.

Use:

- Avatar
- Name
- Headline
- Location
- Availability
- Rating
- Completed work
- Response rate
- Verification state
- Skills
- Service areas
- Credentials
- Work history
- Reviews
- Portfolio

Use:

- `Avatar`
- `Badge`
- `Card`
- `Tabs`
- `Progress`
- `Accordion`
- `HoverCard`
- `Dialog`
- `Separator`

Credentials should be structured cards with:

- Name
- Issuer
- Jurisdiction
- Status
- Expiration
- Verification source
- Mocked warning if applicable
- View details action

On mobile, use a single-column profile with sticky contact or edit action where appropriate.

On desktop, use:

```text
Left: profile summary
Right: details, credentials, reviews
```

---

## Work Order detail

Build a responsive detail route.

### Mobile

Show:

- Title
- Status
- Payment
- Due date
- Primary action
- Compact governance summary
- Accordion sections

Sections:

- Overview
- Requirements
- Deliverables
- Contract
- Submissions
- Payments
- Activity

Use `Accordion` instead of compressing everything into desktop-style tabs.

### Desktop

Use:

- Header
- Tabs
- Main content
- Right contextual rail

Right rail:

- Payment
- Assignee
- Due date
- Risk level
- Credential status
- Primary action

---

# 9. Design-system tokens

Create centralized semantic tokens.

## Colors

Use semantic CSS variables rather than raw values.

Required categories:

- background
- foreground
- surface
- elevated
- muted
- border
- primary
- secondary
- destructive
- warning
- success
- info

Create semantic status tokens:

- pending
- active
- submitted
- needs_attention
- approved
- disputed
- cancelled
- paid
- expired
- verified
- unverified

Do not use red for every elevated-risk state.

## Typography

Use Geist or Inter.

Suggested scale:

```text
Display: text-4xl sm:text-5xl lg:text-6xl
Page title: text-2xl sm:text-3xl
Section title: text-lg sm:text-xl
Card title: text-base or text-lg
Body: text-sm sm:text-base
Metadata: text-xs or text-sm
```

Use medium or semibold weight rather than excessive bold text.

## Radius

Use:

```text
Controls: rounded-md
Cards: rounded-xl
Sheets/dialogs: rounded-xl or rounded-2xl
Pills/badges: rounded-full
```

## Elevation

Use subtle elevation only where hierarchy requires it.

Avoid heavy shadows.

## Motion

Use restrained motion:

- 150–200ms for controls
- 200–300ms for sheets and dialogs
- Respect `prefers-reduced-motion`

---

# 10. Component architecture

Create product-level components above shadcn primitives.

Suggested structure:

```text
src/components/daisy/
  app-shell/
    desktop-sidebar.tsx
    mobile-header.tsx
    mobile-bottom-nav.tsx
    account-menu.tsx

  layout/
    app-page.tsx
    page-header.tsx
    page-section.tsx
    content-grid.tsx
    detail-rail.tsx
    mobile-sticky-actions.tsx

  work/
    work-order-card.tsx
    work-order-table.tsx
    work-status-badge.tsx
    risk-level-badge.tsx
    work-filters.tsx
    work-empty-state.tsx

  governance/
    governance-summary.tsx
    requirement-row.tsx
    credential-card.tsx
    verification-badge.tsx

  feedback/
    loading-state.tsx
    error-state.tsx
    empty-state.tsx
    success-state.tsx

  data/
    stat-card.tsx
    data-list.tsx
    responsive-table.tsx
    activity-timeline.tsx
```

Do not create giant components with many boolean props.

Prefer composition.

---

# 11. Responsive rules

Test at:

```text
320px
375px
390px
430px
768px
1024px
1280px
1440px
```

Requirements:

- No horizontal overflow
- Bottom navigation does not cover content
- Sticky actions respect safe areas
- No critical content depends on hover
- Touch targets are at least 44×44 px
- Tables adapt to cards or safe horizontal scrolling
- Forms remain readable
- Dialogs become Drawers on mobile where appropriate
- Sidebars collapse correctly
- Long labels wrap correctly
- Cards do not force desktop widths
- Page actions remain reachable
- Empty states remain compact
- No viewport is dominated by blank space

---

# 12. Mobile interaction patterns

Use:

- Bottom navigation
- Sticky search
- Sticky primary action bars
- Drawers for filters and secondary detail
- Sheets for navigation and context menus
- Accordions for long detail sections
- Tabs only when all tabs fit or are horizontally scrollable with clear affordance
- Swipe actions only for safe, reversible behavior
- Skeletons for loading
- Toasts only as supplemental feedback
- Full-width forms
- One-column layouts by default
- Large input targets
- Native date and time controls where practical

Do not:

- Hide primary actions in overflow menus
- Depend on hover
- Use tiny text-only actions
- Show six or more equal-width workflow tabs
- Create horizontally compressed desktop layouts
- Use modals for every interaction
- Place destructive actions near primary actions
- Use bottom sheets for content requiring heavy comparison

---

# 13. Empty states

Every empty state must include:

- Relevant icon or illustration
- Clear title
- Short explanation
- One primary action
- Optional secondary action

Examples:

Inbox:

> No messages yet  
> Assignment invites, review notes, and worker messages will appear here.

Saved:

> Nothing saved yet  
> Save Work Orders, workers, or searches to return to them later.

Payments:

> No payment activity  
> Payments will appear after work is assigned or completed.

Do not mention internal implementation details such as “mocked empty in this build” in the primary product UI.

Development-only warnings may appear in a clearly marked development banner.

---

# 14. Status and trust design

Create a consistent semantic status system.

Every status should have:

- Label
- Icon where helpful
- Semantic color
- Explanation
- Accessible text
- Optional next action

Examples:

- Submitted
- Needs review
- Requirements missing
- Credential pending
- Verified
- Expired
- Payment authorized
- Payment released
- Disputed

Mocked verification must remain visibly identified as mocked, but do not repeat the warning in every row if a page-level development disclosure is sufficient.

---

# 15. Marketing page

Keep the current visual direction but improve responsiveness.

Mobile:

- Compact top navigation
- Sheet menu
- Hero stacked vertically
- Product preview below CTAs
- Trust strip becomes a two-column or horizontally scrollable grid
- Work categories stack
- CTAs remain full-width or paired when space permits

Desktop:

- Keep two-column hero
- Improve product preview density
- Add clearer hover and interaction states
- Ensure CTA hierarchy is obvious

Use shadcn `NavigationMenu`, `Sheet`, `Button`, `Card`, `Badge`, and `Separator`.

---

# 16. Implementation process

Before editing:

1. Inspect the existing routes.
2. Inspect all installed shadcn components.
3. Inspect the current design tokens and global CSS.
4. Inspect current app-shell components.
5. Inspect mobile breakpoints.
6. Identify duplicated layout logic.
7. Produce a concise redesign plan.
8. Create reusable primitives before page-specific rewrites.

Then implement in this order:

1. Design tokens
2. Responsive app shell
3. Shared page primitives
4. Home
5. Work
6. Post Work
7. Inbox
8. Payments
9. Saved
10. Organization
11. Profile
12. Work Order detail
13. Marketing responsiveness
14. Accessibility and responsive audit

Do not wait for confirmation unless a destructive migration is required.

---

# 17. Quality gates

Run:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

Use actual repository script names if different.

Also verify:

- Mobile navigation works
- Sidebar collapses
- Mobile bottom nav does not overlap content
- Post Work workflow works at 320px
- All interactive targets meet minimum sizes
- Empty states are actionable
- No route has excessive unused space
- No page duplicates top and side navigation
- All forms have labels and errors
- Dialogs and drawers manage focus
- Tables adapt on mobile
- Loading, empty, error, success, and permission states exist
- No mocked operation appears real
- No TypeScript or lint errors are suppressed

---

# 18. Completion report

At the end, report:

1. UX problems corrected
2. Design-system tokens added or changed
3. Shared components created
4. Routes redesigned
5. Mobile behavior implemented
6. shadcn components used
7. Accessibility improvements
8. Responsive breakpoints tested
9. Commands run
10. Remaining limitations
11. Recommended next implementation step

The final result should feel like a real, usable marketplace product on mobile first, while remaining efficient and information-rich on desktop.
