# Daisy.work Navigation Design System

A navigation-focused design system derived from a study of Airbnb and Upwork, specified against Daisy.work's actual routes as they exist on `feat/daisy-vertical-slice`.

---

## 0. Sourcing note — what was observed vs. inferred

Honesty about evidence, because the recommendations below are only as good as their grounding.

**Fetched and read directly:**

- A third-party reverse-engineered spec of Airbnb's design system ([VoltAgent/awesome-design-md, `design-md/airbnb/DESIGN.md`](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/airbnb/DESIGN.md)). This is where the concrete numbers in the Airbnb sections come from: 80px top nav, 64px search pill at `9999px` radius split into three segments by 1px hairlines, 48×48px circular search orb, `#ff385c` single accent, `#dddddd` hairline, `#6a6a6a` muted, 16px/600 nav links, ~14px card radius, 16px card gutters, 64px section rhythm, and the three breakpoints (<744px collapse to logo + hamburger + single tappable pill; 744–1128px tabs visible and pill narrowed; 1128px+ full expansion). **Caveat: this is one community author's reconstruction, not an Airbnb publication.** Treat the numbers as directionally right, not as canon.
- Search-result summaries covering Airbnb's collapse-on-scroll behavior and the Homes/Experiences/Services tri-tab, and covering Upwork's role switching, left filter rail, saved searches (limit cited as 30), boolean search operators, and category faceting.

**Attempted and blocked:** direct fetches of `upwork.com` and `support.upwork.com` both returned **HTTP 403**. I could not read Upwork's live DOM or its own help pages firsthand.

**Therefore relying on general knowledge, flagged inline as such:** Upwork's mega-menu shape, the scoped Jobs/Talent search selector's exact affordance, its breadcrumb usage, and Airbnb's precise URL parameter set beyond the `refinement_paths[]` / `place_id` / `checkin` / `checkout` / `adults` / `flexible_trip_lengths[]` fragments that appeared in scraping documentation.

**Not claimed anywhere in this document:** conversion rates, task-success numbers, user-research findings, or quotes from either company. There are none. Nothing below is supported by a metric, and no metric is invented to support it.

---

## 1. Daisy.work as it stands today

Read before proposing anything. This is the substrate.

### 1.1 Real routes

| Route | Group | What it actually is |
| --- | --- | --- |
| `/` | `(marketing)` | Landing. Own header (wordmark, Sign in, Get started). Prompt box → `/create?q=`. Also renders a live job list with client-derived category chips. |
| `/signin` | `(auth)` | Sign in. |
| `/welcome` | `(auth)` | Hire-or-provide choice; writes `users.onboardingChoice`. |
| `/onboarding/provider` | `(auth)` | Provider profile creation. |
| `/home` | `(app)` | Customer hub. Server-redirects to `/services` when `choice === "provide"`. |
| `/create` | `(app)` | AI drafts the posting. |
| `/marketplace` | `(app)` | The real public browse surface. Tabbed Services / Open jobs. |
| `/services` | `(app)` | **The provider's own service manager** — create/edit/publish. Not a catalog. |
| `/services/[serviceId]` | `(app)` | Public service detail. |
| `/providers/[profileId]` | `(app)` | Public provider profile. **No `/providers` index exists.** |
| `/work` | `(app)` | "Requests" — role-forked list (customer's posted jobs vs. provider's inbound). |
| `/work/[workOrderId]` | `(app)` | Job detail. |
| `/work/[workOrderId]/edit` | `(app)` | Edit posting. |
| `/work/[workOrderId]/review` | `(app)` | Review before publish. |
| `/account` | `(app)` | Account. |
| `/account/ads` | `(app)` | Advertise / ad slots. |

### 1.2 Real nav surfaces

`src/lib/daisy/nav.ts` defines three arrays, each of exactly three items:

- `CUSTOMER_NAV` — Home (`/home`, emphasized), Requests (`/work`), Account (`/account`)
- `WORKER_NAV` — Services (`/services`, emphasized), Requests (`/work`), Account (`/account`)
- `DEFAULT_NAV` — Home, Requests, Account

`src/components/daisy/app-shell/daisy-app-shell.tsx` composes a shadcn `SidebarProvider` + `DesktopSidebar` + `MobileHeader` + `MobileBottomNav`, and maintains a `TITLES` map for the mobile header string.

### 1.3 Six problems visible in the current code

1. **`/marketplace` is not in any nav array.** The one public browse surface in the product is reachable only by typing the URL. This is the single largest IA defect.
2. **`/create` is not in any nav array either.** The primary conversion action lives only in page-level `PageHeader` action buttons on `/work` and `/marketplace`.
3. **"Services" is overloaded.** In `WORKER_NAV` it means *my listings*; in `/services/[serviceId]` and on `/marketplace` it means *the catalog*. Same word, two meanings, one of them private.
4. **`/providers/[profileId]` is an orphan.** No index, and no card anywhere links to it — `/marketplace` service cards link to `/services/[id]`, job cards to `/work/[id]`. The provider directory is invisible.
5. **All browse state is React state, not URL state.** `/marketplace` holds `tab` and `searchQuery` in `useState`; the landing holds `searchQuery` and `category` the same way. Nothing is shareable, back-button-able, or restorable. This is the difference between a browse product and a page that happens to list things.
6. **The mobile hamburger sheet is a verbatim duplicate of the bottom tab bar.** Both call `navForRole()` and render the same three items. One of them is dead weight. (Also: `globals.css` reserves `2.5rem` of extra bottom padding for "the elevated center Post control above the tab bar" — a control that does not exist in the codebase. The comment describes an intention; the intention is right and is specified below.)

### 1.4 Real data constraints that bound the design

- `work.browse` accepts `{ q?: string }` and nothing else. Filtering by category, price, work mode, and location is all done client-side over the full `listPublished()` array. **A filter surface must therefore stay cheap and client-side** until the procedure grows facets. Do not spec a filter panel that implies server faceting.
- `category` on a work order is a free-text `varchar(128)`. **There is no controlled taxonomy.** Any category rail must be derived from data, exactly as the landing already does it (count, sort by frequency, slice to 8).
- Services carry `tags: string[]`, `coverImageUrl`, `priceCents`, `ownerName`, `viewCount`, `clickCount`.
- Jobs carry `category`, `budgetType` (Hourly / Milestone / Fixed), `budgetAmount`, `currency`, `workMode`, optional `location.label`, `createdAt`, `status`.

Everything specified below is buildable against these fields with shadcn primitives already installed (`sidebar`, `sheet`, `dropdown-menu`, `select`, `input`, `button`, `avatar`, `skeleton`, `tooltip`).

---

## 2. What to steal, and what to reject

Opinionated. Each pattern gets a verdict and a reason tied to a route that exists.

### 2.1 From Airbnb

#### STEAL — Collapse-on-scroll search control

*The pattern:* an expanded, segmented search pill lives below the header at rest; on scroll it collapses into a compact pill inside the header bar; clicking it re-expands. The observed spec puts the expanded pill at 64px tall with a `9999px` radius and a 48px circular submit orb.

*Problem it solves:* search is the most important control on a browse page and the least important control while you are reading results. Collapse-on-scroll gives search maximum presence at the moment of intent and near-zero cost afterward, without ever removing it.

*Earns its place:* yes, but **simplified to one segment**. Daisy's `work.browse` takes a single `q` string. A three-segment pill would be theater over a one-field API. Build a one-segment pill with a scope selector (see 2.2) and the collapse behavior.

#### STEAL — Category icon rail, horizontally scrolling, sticky under the header

*Problem it solves:* it answers "what is even here?" without asking the user to commit to a query. It converts an empty search box — which demands vocabulary the user may not have — into a menu.

*Earns its place:* **strongly yes.** The landing already builds this rail (top 8 categories by count, derived from loaded jobs). It is the best navigation idea currently in the codebase and it is stranded on the marketing page. Promote it to `/marketplace`.

*One deliberate departure:* Airbnb pairs each category with a hand-illustrated icon. Daisy has free-text categories from an AI drafting step — there is no fixed set to illustrate, and `lucide-react` has no plausible icon for "panel upgrade." **Text chips with counts, no icons.** A wrong icon is worse than no icon.

#### STEAL — Photo-first card grid with tight horizontal gutters and generous vertical section rhythm

*Problem it solves:* it makes scanning feel like browsing rather than like reading a table. The observed 16px card gutter against 64px section separation is the specific ratio that reads as "dense grid, calm page."

*Earns its place:* yes, and it is already half-built — `/marketplace` renders `grid gap-4 sm:grid-cols-2 lg:grid-cols-3` with `aspect-video` covers on service cards. Keep the grid, fix the rhythm, and fix the card-as-link anatomy (see 5.8).

#### STEAL — Search state lives in the URL

*Problem it solves:* shareability, back-button correctness, refresh survival, and server-renderable results. The scraping documentation that surfaced (`refinement_paths[]`, `place_id`, `checkin`, `checkout`, `adults`, `flexible_trip_lengths[]`) shows Airbnb encodes essentially the entire search state in the query string.

*Earns its place:* **this is the highest-leverage single change in this document.** `/marketplace?tab=jobs&q=electrician&cat=Electrical` must work. Today it cannot.

#### STEAL — Browse without deciding anything yet

*Problem it solves:* Airbnb will show you a full grid before you have entered a destination, a date, or a guest count. Nothing is gated behind a form.

*Earns its place:* yes, and it is nearly free — `work.browse` is a `publicProcedure` and `/marketplace` already renders without input. What is missing is *reachability*: put Browse in the primary nav and let the landing's "Available jobs" section link into it.

#### REJECT — Date pickers and guest steppers

Airbnb's `When` and `Who` segments encode a booking model: a date range and an occupancy count are required to price a stay. Daisy has neither. Jobs have `budgetType`, `workMode`, and an optional `location.label`. There is nothing to put in a calendar. Copying the three-segment pill would mean inventing fields to fill the segments — the exact failure mode where a design system starts driving the product instead of serving it.

#### REJECT — Illustrated 3D category icons and the tri-tab product picker

Airbnb's Homes / Experiences / Services tri-tab separates three genuinely different businesses with three different booking flows. Daisy's Services and Jobs are two views of one marketplace and share a search box. A tabbed control inside the browse surface (which already exists) is correct; a top-level product picker in the header is not.

#### REJECT — A full-screen mobile search overlay as the default entry

Justified at Airbnb's scale, where the search modal is a multi-step wizard. For a one-field query, a full-screen takeover to type eight characters is ceremony. Focus the inline field on tap. (The overlay does become correct later, if and when the filter set grows — noted in 8.)

### 2.2 From Upwork

#### STEAL — Scoped global search

*The pattern:* one search input with an adjacent scope selector, so the same box searches Jobs or Talent depending on a small explicit control. *(Relying on general knowledge for the exact affordance — upwork.com returned 403.)*

*Problem it solves:* Daisy has exactly this duality and currently handles it badly. `/marketplace` swaps the search *placeholder* with the tab (`"Search services…"` / `"Search open jobs…"`) and then runs two entirely different code paths — `api.work.browse` with a server `q`, versus a client-side `.filter()` over `services`. The scope is real; it is just implicit. Make it a visible control, and make it a URL parameter.

*Earns its place:* yes. This is the single most transferable Upwork idea for this product.

#### STEAL — Left filter rail on results at desktop, sheet at mobile

*Problem it solves:* filters stay visible and adjustable while results update, instead of forcing a modal round-trip per refinement. The search results confirmed Upwork puts category, location, experience level, and budget in a left-hand rail.

*Earns its place:* yes, **at a fraction of the density.** Daisy has four filterable dimensions, all client-side: category, budget range, work mode, and (when present) location label. Four groups in a 240px rail. Not fourteen.

#### STEAL — Role switching from the account menu

*The pattern:* the freelancer/client switch lives under the profile avatar; profiles are separate contexts under one login.

*Problem it solves:* Daisy already stores `users.onboardingChoice` and already forks navigation on it via `navForRole()`, but the user has **no way to see or change that choice** after `/welcome`. A customer who decides to start providing has no path back. Worse, `/home` hard-redirects providers to `/services`, so the mode is invisible *and* irreversible from the UI.

*Earns its place:* **yes, mandatory.** This is a correctness bug in navigation, not a nicety.

#### STEAL — Breadcrumbs on detail routes

*Problem it solves:* Daisy's deepest routes are three segments (`/work/[id]/review`). Arriving from a shared link leaves no upward path. The mobile header shows a static `TITLES` string with no back affordance at all.

*Earns its place:* yes, but **only on `/work/[id]/*`, `/services/[id]`, and `/providers/[id]`.** Not on `/home`, `/marketplace`, `/account` — a breadcrumb on a top-level page is noise.

#### REJECT — The mega-menu

Upwork's category mega-menu exists because Upwork has a deep, curated, multi-level taxonomy with thousands of skills. Daisy's `category` is `varchar(128)` free text with no controlled vocabulary and, realistically, a low double-digit number of distinct values. A mega-menu over that data would be a large empty room. The derived category rail (2.1) is the honest expression of this dataset. Revisit only if a real taxonomy table lands.

#### REJECT — Saved searches (for now)

Genuinely good — the search results cite a 30-search limit and boolean operator support. It presumes a returning power user with a repeated query, which requires a persistence table, a notification story, and a management surface. It is a feature, not a navigation pattern, and it is out of scope for this document. **The URL-state work in 2.1 is its prerequisite** — once search state is a URL, "save this search" is a row containing a query string. Do that first; the feature becomes small later.

#### REJECT — Boolean operator syntax in the search box

`work.browse` does three `.includes()` calls against title, description, and category. Advertising boolean syntax over substring matching would be a lie told by the UI.

---

## 3. Information architecture

### 3.1 The decision: one nav that reshapes by role, with an explicit switch

**Recommended: a single primary navigation whose middle slots change with `onboardingChoice`, plus a visible, reversible role switch in the account menu.** Not two separate modes with separate shells.

**Why one nav:**

1. **The shared surface area is large.** `/work`, `/account`, `/account/ads`, `/marketplace`, `/providers/[id]`, `/services/[id]` are all meaningful in both roles. Two full modes would duplicate five of eight top-level destinations. Duplication in navigation means two places to fix every bug.
2. **The roles are not exclusive in reality.** An electrician who hires a bookkeeper is one person. `onboardingChoice` is a single scalar column — it records a *starting intent*, not an identity. A hard mode split would encode a much stronger claim than the schema makes.
3. **The current code already does this** (`navForRole()` returns different arrays into the same components) and it works. The defect is not the reshaping — it is that the reshape is invisible and one-way.
4. **Two modes would cost a second app shell**, a second route group, and duplicated layouts. It buys clarity that a role switch and correct labeling buy for far less.

**Why the switch must be explicit and visible:** the reshape is only acceptable if the user can see which mode they are in and change it. Today they can do neither. The switch (spec in 5.6) is the price of admission for the one-nav approach — without it, the recommendation collapses.

**What I am rejecting by choosing this:** Upwork's fuller model, where client and freelancer are separate profiles with separate contracts, finances, and history. That is right for Upwork and wrong here — Daisy has one `users` row with one scalar, and building profile separation to justify a nav pattern is backwards.

### 3.2 Primary nav slots

Five slots. Three are stable, two reshape.

| Slot | Hire mode | Provide mode | Signed out |
| --- | --- | --- | --- |
| 1 · Browse | Browse (`/marketplace`) | Browse (`/marketplace`) | Browse (`/marketplace`) |
| 2 · Act | **Post a job** (`/create`, emphasized) | **My listings** (`/services`, emphasized) | Post a job (`/create`) |
| 3 · Work | Requests (`/work`) | Requests (`/work`) | — (Sign in) |
| 4 · Home | Home (`/home`) | Home (`/services` is today's landing; see note) | — |
| 5 · Account | Avatar menu | Avatar menu | Sign in / Get started |

**Note on slot 4 in provide mode:** `/home` currently redirects providers to `/services`, which collapses "your dashboard" into "your listings" and is why the Services label is overloaded. **Recommendation: stop redirecting.** Let `/home` render a provider-shaped dashboard and let `/services` mean only "my listings." That is a one-line change in `src/app/(app)/home/page.tsx` plus dashboard content, and it removes the naming collision at its source. Until then, slot 4 is legitimately absent in provide mode and the nav should be four slots, not a fake fifth.

**Mobile bottom bar carries slots 1–3 and 5**, with slot 2 as the elevated center action — which is exactly what `globals.css` already reserves padding for.

### 3.3 Full route → nav-slot mapping

| Route | Active slot | Header shows | Breadcrumb | Notes |
| --- | --- | --- | --- | --- |
| `/` | none (marketing header) | Wordmark, Browse, Sign in, Get started | no | Landing keeps its own header. Add a Browse link — it currently has none. |
| `/signin` | none | Wordmark only | no | Minimal chrome. |
| `/welcome` | none | Wordmark only | no | No nav during role choice; nav would offer escape hatches from a required decision. |
| `/onboarding/provider` | none | Wordmark + Skip | no | Same. |
| `/home` | Home | Search (collapsed) | no | |
| `/marketplace` | Browse | **Search (expanded), scope selector, category rail** | no | The one surface with full search chrome. |
| `/create` | Post a job | Wordmark + Cancel | no | Focused task. Suppress the category rail and search. |
| `/services` | My listings | Search (collapsed) | no | Provide mode only. |
| `/services/[id]` | Browse | Search (collapsed) | `Browse › Services › {title}` | Public detail; owner sees an Edit affordance. |
| `/providers/[id]` | Browse | Search (collapsed) | `Browse › Providers › {name}` | Needs a `/providers` index to be a true parent — see 8. |
| `/work` | Requests | Search (collapsed) | no | |
| `/work/[id]` | Requests | Search (collapsed) | `Requests › {title}` | If arrived from `/marketplace`, breadcrumb root is `Browse`. |
| `/work/[id]/edit` | Requests | Wordmark + Cancel | `Requests › {title} › Edit` | |
| `/work/[id]/review` | Requests | Wordmark + Cancel | `Requests › {title} › Review` | |
| `/account` | Account | Search (collapsed) | no | |
| `/account/ads` | Account | Search (collapsed) | `Account › Advertise` | |

**URL contract for browse state:**

```
/marketplace?scope=jobs|services   # default: services (matches today's initial tab)
            &q=<string>            # omit when empty
            &cat=<category>        # jobs scope only; free text, encoded
            &mode=<workMode>       # jobs scope only
            &min=<cents>&max=<cents>
            &sort=recent|price_asc|price_desc
```

Read with `useSearchParams`, write with `router.replace` (not `push`) for filter tweaks so the back button exits browse rather than unwinding every chip toggle. Use `router.push` only for scope changes, which are genuine destinations. Absent parameters mean defaults; never serialize a default.

---

## 4. Design tokens

Tailwind v4 CSS-first `@theme`, extending `src/styles/globals.css` rather than replacing it. The existing file already declares a warm-white / near-black / deep-green / yellow palette in OKLCH. **That is a real palette decision and it should be kept and sharpened, not replaced.**

### 4.1 Palette rationale

Six named colors. The reasoning, stated plainly:

- **Field** `oklch(0.42 0.12 145)` — a deep, desaturated green, already the `--primary`. Green earns its place here on two grounds. First, the product is named after a flower and the work is physical and outdoor-adjacent — the browse content is electricians, plumbers, faucets, panel upgrades. Second, and more practically, green is the least-used brand color in the marketplace category: Upwork is green but bright and lime-forward; Airbnb, Fiverr, TaskRabbit, Thumbtack, and Angi occupy red, coral, and blue. A dark, low-chroma green at C=0.12 is nothing like Upwork's `#14a800` and reads as considered rather than energetic — which matches "calm, sparse, near-monochrome."
- **Pollen** `oklch(0.9 0.14 100)` — a warm yellow, already `--accent`. Used **only** for the active state on the category rail and for the "new" affordance. Never for a button. This is the direct analogue of Airbnb's single-accent discipline (one Rausch, nothing else): one accent, one job.
- **Ink** `oklch(0.18 0.01 140)` — near-black with a faint green cast, so text sits in the same family as the primary rather than floating as neutral gray.
- **Paper** `oklch(0.985 0.004 95)` — warm off-white. Cards go pure white on top of it, which produces card separation from value alone and lets borders stay near-invisible.
- **Slate** `oklch(0.48 0.015 140)` — the muted text color. One muted value, not a ramp of five.
- **Clay** `oklch(0.55 0.2 25)` — destructive/alert only. Never navigational.

**What I deliberately avoided.** The three current defaults in AI-generated interface design are: cream + serif + terracotta (reads as a natural-wine e-commerce site and would make a jobs marketplace feel unserious); near-black + acid-green or acid-lime accent (reads as a developer tool or a crypto product, and the acid note collides with real green); and hairline-rule broadsheet minimalism with a display serif (reads editorial, and there is no editorial content here — the content is priced service listings). Daisy's existing green-and-yellow-on-warm-white is more specific than any of them and less generic than plain gray. Keeping it is the opinionated choice, not the lazy one.

**Type is deliberately not a differentiator.** The brief describes a system font stack; the codebase uses Geist with a system fallback. Both are correct and neither should change. In a photo-and-price grid the images and the prices carry the personality — the type's job is to disappear. This mirrors the Airbnb principle observed in the fetched spec: display weights at 500–600 rather than 700+, letting layout and a single accent drive hierarchy.

### 4.2 Token declarations

Additive. Existing `--color-*` / `--radius-*` mappings in `@theme inline` are unchanged; these are navigation-specific tokens.

```css
@theme {
  /* ---- Navigation semantic colors (light) ---- */
  --color-nav-surface:        oklch(1 0 0);
  --color-nav-surface-scroll: oklch(1 0 0 / 0.92);
  --color-nav-hairline:       oklch(0.88 0.01 95);
  --color-nav-ink:            oklch(0.18 0.01 140);
  --color-nav-ink-muted:      oklch(0.48 0.015 140);
  --color-nav-active:         oklch(0.42 0.12 145);   /* Field */
  --color-nav-active-wash:    oklch(0.42 0.12 145 / 0.10);
  --color-nav-accent:         oklch(0.9 0.14 100);    /* Pollen */
  --color-nav-accent-ink:     oklch(0.25 0.04 145);
  --color-nav-focus:          oklch(0.42 0.12 145);

  /* ---- Type scale with roles ---- */
  --text-nav-label:      0.875rem;  /* 14px — sidebar + header links */
  --text-nav-label--line-height: 1.25rem;
  --text-nav-label--font-weight: 500;

  --text-tab-label:      0.625rem;  /* 10px — mobile bottom bar (matches today) */
  --text-tab-label--line-height: 0.875rem;
  --text-tab-label--font-weight: 500;

  --text-chip:           0.8125rem; /* 13px — category rail chips */
  --text-chip--line-height: 1.125rem;
  --text-chip--font-weight: 500;

  --text-search:         1rem;      /* 16px — never smaller: iOS zooms below 16 */
  --text-search--line-height: 1.5rem;

  --text-crumb:          0.75rem;   /* 12px — breadcrumbs */
  --text-crumb--line-height: 1rem;

  --text-card-title:     0.875rem;
  --text-card-title--font-weight: 600;
  --text-card-meta:      0.75rem;

  /* ---- Navigation spacing ---- */
  --spacing-nav-x:        0.75rem;
  --spacing-nav-gap:      0.5rem;
  --spacing-rail-gap:     0.5rem;
  --spacing-grid-gutter:  1rem;    /* 16px — Airbnb's card gutter */
  --spacing-section:      4rem;    /* 64px — Airbnb's section rhythm */
  --spacing-touch:        2.75rem; /* 44px floor */

  /* ---- Navigation dimensions ---- */
  --nav-header-h:         3.5rem;  /* 56px, = existing --app-header-height */
  --nav-header-h-md:      4rem;    /* 64px desktop */
  --nav-rail-h:           3rem;    /* 48px category rail */
  --nav-bottom-h:         4rem;    /* = existing --mobile-nav-height */
  --nav-sidebar-w:        15rem;
  --nav-sidebar-w-icon:   3.25rem;
  --nav-filter-rail-w:    15rem;
  --nav-search-h:         2.75rem;
  --nav-search-h-open:    3.5rem;

  /* ---- Radii ---- */
  --radius-nav-pill:      9999px;  /* search control, chips */
  --radius-nav-item:      0.5rem;
  --radius-nav-card:      0.875rem; /* 14px — matches the observed Airbnb card radius */

  /* ---- Elevation (restrained: 3 steps, no more) ---- */
  --shadow-nav-flat:   none;
  --shadow-nav-raised: 0 1px 2px oklch(0.18 0.01 140 / 0.06);
  --shadow-nav-float:  0 4px 16px oklch(0.18 0.01 140 / 0.10),
                       0 1px 3px  oklch(0.18 0.01 140 / 0.06);

  /* ---- Motion ---- */
  --ease-nav-out:   cubic-bezier(0.16, 1, 0.3, 1);   /* entrances */
  --ease-nav-inout: cubic-bezier(0.4, 0, 0.2, 1);    /* state changes */
  --duration-nav-instant: 100ms;  /* press */
  --duration-nav-fast:    150ms;  /* hover, active, color */
  --duration-nav-base:    200ms;  /* collapse, chip, popover */
  --duration-nav-sheet:   250ms;  /* sheets, drawers */
}

.dark {
  --color-nav-surface:        oklch(0.22 0.012 145);
  --color-nav-surface-scroll: oklch(0.22 0.012 145 / 0.92);
  --color-nav-hairline:       oklch(1 0 0 / 0.12);
  --color-nav-ink:            oklch(0.96 0.005 95);
  --color-nav-ink-muted:      oklch(0.72 0.015 95);
  --color-nav-active:         oklch(0.72 0.10 145);
  --color-nav-active-wash:    oklch(0.72 0.10 145 / 0.16);
  --color-nav-accent:         oklch(0.78 0.14 100);
  --color-nav-accent-ink:     oklch(0.20 0.04 145);
  --color-nav-focus:          oklch(0.72 0.10 145);
  --shadow-nav-raised: 0 1px 2px oklch(0 0 0 / 0.30);
  --shadow-nav-float:  0 4px 16px oklch(0 0 0 / 0.45),
                       0 1px 3px  oklch(0 0 0 / 0.30);
}
```

**Deliberately absent:** a spacing ramp (Tailwind's is fine), a shadow ramp beyond three steps (elevation is not a hierarchy tool in a flat, hairline-separated interface), and any font token beyond the existing `--font-sans`.

---

## 5. Component specifications

Every component below maps to a route that exists today. Nothing is specified for a hypothetical page.

### 5.1 Global header

**Desktop (≥768px) anatomy.** The current desktop shell has *no header at all* — only a collapsible sidebar. That is why there is nowhere to put search. Add a 64px header spanning the content area, to the right of the sidebar.

```
┌──────────┬───────────────────────────────────────────────────────────────────┐
│          │  ╭─────────────────────────────────────────────╮                  │
│  Daisy   │  │ [Jobs ▾] │ 🔍  Search open jobs…        (→) │      [Post a job]│  64px
│  .work   │  ╰─────────────────────────────────────────────╯                  │
│          ├───────────────────────────────────────────────────────────────────┤
│ ● Browse │  All (42) · Electrical (9) · Plumbing (7) · Roofing (5) · … →      │  48px rail
│ ○ Home   ├───────────────────────────────────────────────────────────────────┤
│ ○ Reqsts │
│          │   (content)
│ ─────────│
│ (AV) Ben │
└──────────┴───────────────────────────────────────────────────────────────────┘
 240px sidebar          hairline 1px  ·  surface oklch(1 0 0)  ·  sticky top-0
```

Wordmark stays in the sidebar (where it lives today). The header holds only search, and a single primary action button on the right when the route has one.

**Mobile (<768px) anatomy.** Keep the existing 56px sticky header but change its contents: **remove the hamburger** — it duplicates the bottom tab bar — and replace it with either the wordmark (top-level routes) or a back chevron + truncated title (detail routes).

**States.**

| State | Treatment |
| --- | --- |
| Default (scrollY = 0) | `--color-nav-surface`, `--shadow-nav-flat`, 1px `--color-nav-hairline` bottom, search expanded on `/marketplace` |
| Scrolled (scrollY > 24) | `--color-nav-surface-scroll` + `backdrop-blur`, `--shadow-nav-raised`, search collapsed |
| Focus-within | Header keeps its scrolled treatment; search expands regardless of scroll |
| Loading | Header chrome never shows a skeleton. Route transitions animate a 2px `--color-nav-active` top progress bar. Never a spinner in the header. |

**Breakpoints.** <768px: 56px, wordmark-or-back + optional icon action, no sidebar, bottom bar owns primary nav. 768–1023px: 64px, sidebar in `collapsible="icon"` (56px), search full width. ≥1024px: 64px, sidebar expanded 240px, search capped at `max-width: 32rem` and left-aligned to the content column — not centered. (Airbnb centers because the pill is the page's protagonist; here the results are.)

**Keyboard.** `Tab` order: skip link → sidebar/back → search scope → search input → primary action. A visually-hidden-until-focused **skip to content** link is the first focusable element on the page; it is not optional and is missing today. `/` focuses the search input from anywhere (unless focus is already in a text field). `Escape` in search blurs and collapses.

**ARIA.** `<header>` with `role="banner"` implicit. Primary nav `<nav aria-label="Primary">` (already correct in both mobile components). Search region `<search>` element, or `<div role="search">` for broader support. The route progress bar is `aria-hidden` — announce navigation via a polite live region containing the new page title instead.

### 5.2 Search control

**Desktop anatomy — expanded (on `/marketplace`, and on any route at scrollY = 0 where search is primary):**

```
╭────────────┬──────────────────────────────────────────────┬───────╮
│  Jobs   ▾  │  Search open jobs…                           │  (→)  │  56px
╰────────────┴──────────────────────────────────────────────┴───────╯
  scope         input                                          submit
  ~104px        flex-1                                          40px circle
  radius: --radius-nav-pill · 1px --color-nav-hairline · bg --color-nav-surface
```

**Desktop — collapsed (scrolled, or any route where search is secondary):**

```
╭──────────────────────────────────╮
│ 🔍  Jobs · electrician        ✕  │   44px, radius pill, max-w 22rem
╰──────────────────────────────────╯
```

The collapsed pill states the current scope and query as text — Airbnb's collapsed pill summarizes the search rather than becoming a bare icon, which preserves the "you are looking at filtered results" signal. `✕` clears.

**Mobile anatomy.** Full-width 44px pill under the header on `/marketplace` only; collapsed to a 44px icon button in the header elsewhere. Tapping focuses the inline input — **no full-screen overlay** (see 2.1 rejection).

**Scope selector.** shadcn `Select` styled as a borderless trigger inside the pill's left segment, divided from the input by a 1px hairline (Airbnb's segment-divider idiom applied to a real two-value choice). Options: **Jobs**, **Services**. Changing scope writes `?scope=` and clears `?cat=` (categories are jobs-only), and does a `router.push` — it is a destination change.

**States.** Default: hairline border, `--color-nav-ink-muted` placeholder. Hover: border → `--color-nav-ink-muted`. Focus-within: 2px `--color-nav-focus` ring at 2px offset, border transparent, `--shadow-nav-raised`. Filled: submit orb solid `--color-nav-active`; clear button appears. Loading: submit orb shows a 16px spinner and gets `aria-busy="true"`; **the input stays enabled** — never disable an input mid-typing. Disabled: not a state that occurs; search is never disabled.

**Keyboard.** `/` focuses. `Enter` submits (writes URL params). `Escape` clears if filled, blurs if empty. `Alt+↓` opens the scope select (Radix default). Arrow keys move within the select; they never leave the pill.

**ARIA.** `<form role="search">`; input `aria-label="Search the marketplace"`; scope select `aria-label="Search scope"`; the results region gets `aria-live="polite"` announcing `"{n} results"` — debounced to 500ms so keystroke-level changes are not narrated.

### 5.3 Category rail

Directly promoted from the landing's existing implementation: count occurrences, sort by frequency descending then alphabetically, slice to 8, prepend an "All" chip.

**Desktop anatomy** — 48px band directly under the header, `position: sticky` at `top: var(--nav-header-h-md)`, 1px hairline below, horizontally scrollable with `overflow-x-auto` and fading edge masks. Right-edge chevron button appears only when content overflows.

**Mobile anatomy** — identical band at 44px, sticky under the 56px header, no chevrons (native touch scroll), with `scroll-snap-type: x proximity` and `scroll-padding-inline-start: var(--spacing-nav-x)`.

```
┌────────────────────────────────────────────────────────────┐
│ (All 42) (Electrical 9) (Plumbing 7) (Roofing 5) (Land… →  │
└────────────────────────────────────────────────────────────┘
```

**Chip states.**

| State | Treatment |
| --- | --- |
| Default | bg `transparent`, 1px `--color-nav-hairline`, text `--color-nav-ink-muted`, radius pill, `--text-chip`, min-height 32px, padding-x 12px |
| Hover | border `--color-nav-ink-muted`, text `--color-nav-ink` |
| Active | bg `--color-nav-accent` (Pollen), text `--color-nav-accent-ink`, border transparent — **the only Pollen use in navigation** |
| Focus-visible | 2px `--color-nav-focus` ring, 2px offset |
| Loading | 5 chips as `Skeleton` at 32×88px; never collapse the rail's height |
| Empty (0 categories) | Rail does not render at all. No "No categories" message. |

**Behavior.** Selecting writes `?cat=`; selecting the active chip clears it. Never more than one active — this is a single-select filter, not a tag cloud, because the client-side `.filter()` behind it is single-valued. On selection, the chosen chip scrolls into view with `block: "nearest", inline: "center"`.

**Keyboard.** The rail is a **tablist-shaped roving-tabindex group**: one tab stop for the whole rail; `←`/`→` move between chips; `Home`/`End` jump to ends; `Enter`/`Space` activate. Do not put eight tab stops in a horizontal filter strip.

**ARIA.** `<div role="tablist" aria-label="Filter by category">` with `role="tab"` + `aria-selected` per chip, since selecting a chip changes the results region — pair with `aria-controls` pointing at the results `id`. Counts are inside the accessible name: `"Electrical, 9 jobs"`.

**Where it appears:** `/marketplace` with `scope=jobs`, and the landing's job section (already there). **Not** on `/work`, `/services`, `/account` — those have their own status/type filters and stacking two horizontal filter strips is how a nav becomes a cockpit.

### 5.4 Filter surface

Four groups only, all client-side, all reflected in the URL: **Category** (radio list, jobs only — redundant with the rail at desktop, so hide it there), **Budget** (min/max, `tabular-nums`, cents), **Work mode** (checkbox group from `workMode` values), **Sort** (radio: recent / price ascending / price descending).

**Desktop (≥1024px):** a 240px left rail inside the content area, sticky at `top: calc(var(--nav-header-h-md) + var(--nav-rail-h))`, own scroll, groups separated by hairlines. Grid becomes `[240px] [1fr]`, results dropping from 3-up to 2-up. Upwork's rail, at a quarter of the density.

**Below 1024px:** a `Filters (2)` button in the header row opens a shadcn `Sheet` from the bottom (`side="bottom"`, `max-height: 85dvh`), containing the same four groups, with a sticky footer holding `Clear all` and `Show 24 results`. Airbnb's filter-sheet idiom.

**States.** Default: no chrome, count badge absent. Active: button shows a count badge in `--color-nav-active-wash`, and applied filters render as removable chips above the results. Loading: **results skeleton, not filter skeleton** — controls stay live so a mistaken filter can be undone immediately. Empty results: `EmptyState` (already built) with a `Clear all filters` action, not a generic "nothing here."

**Keyboard.** Desktop rail is in normal document order after the rail and before results. Sheet traps focus (Radix default), returns focus to the trigger on close, and closes on `Escape`. The footer's `Show N results` is the last stop.

**ARIA.** Each group `<fieldset>` + `<legend>`. Sheet `aria-labelledby` its title. Applied-filter chips are `<button>` with accessible name `"Remove filter: Electrical"`.

### 5.5 Mobile bottom tab bar

Four items plus one elevated center action. This is what `globals.css` already reserves 2.5rem of extra bottom padding for.

```
        ╭───────╮
        │   +   │  ← elevated action, 56px circle, --color-nav-active,
   ╭────╯       ╰────╮   translate-y -18px, --shadow-nav-float
┌──┴─────────────────┴──────────────────────────────────────┐
│   ⌂          ⌕            (+)          ▤          ◉        │  64px + safe-area
│  Home      Browse        Post        Requests   Account    │  10px labels
└────────────────────────────────────────────────────────────┘
   /home   /marketplace   /create      /work     /account
```

**Provide mode** swaps slot 3's label and destination to **List** → `/services`, and its icon to `Package`. Slots 1, 2, 4, 5 are identical. This is the whole role reshape at mobile — one slot.

**Anatomy.** 64px + `env(safe-area-inset-bottom)` (already implemented correctly). Each tab: 20px icon over a 10px label, entire cell tappable at ≥44px in both dimensions. The center action is a 56px circle rising 18px above the bar with `--shadow-nav-float`.

**States.** Default: `--color-nav-ink-muted`. Active: `--color-nav-active` for icon and label, plus a filled icon variant if available — **color alone must not carry the active state**, so the fill change (or a 3px top indicator bar) is required, not decorative. Press: `scale(0.96)` for 100ms. Focus-visible: 2px inset ring, inset because the bar is flush to the viewport edge and an outset ring would clip. Disabled: no tab is ever disabled. Badge: a 6px dot at the icon's top-right for unread activity on Requests, with a visually-hidden `", new activity"` appended to the label.

**Breakpoint.** `md:hidden`, unchanged. **Deletion:** remove `MobileHeader`'s hamburger `Sheet` entirely — with five slots in the bar it duplicates every destination.

**Keyboard.** Standard tab order; the bar is the last landmark in DOM order but rendered fixed at the bottom, which is already how the current code does it and is correct — screen-reader users reach primary nav after content rather than wading through it on every page.

**ARIA.** `<nav aria-label="Primary">` (already present), `<ul>`/`<li>`, `aria-current="page"` on active (already present). The center action is a `<a>` with a visible label — it is a link to `/create`, not a button.

### 5.6 Role switch

The missing control. `onboardingChoice` is set once at `/welcome` and is currently unreachable and unchangeable afterward.

**Placement:** inside the account `DropdownMenu` (desktop sidebar footer and mobile Account route), directly under the user's name, above `Account`. Upwork's placement, and correct: role is an account property, not a navigation destination.

**Desktop anatomy** — a `DropdownMenuRadioGroup` inside the existing menu:

```
┌────────────────────────────────┐
│ Benjamin                       │
│ ────────────────────────────── │
│ VIEWING AS                     │
│  ●  Hiring                     │
│  ○  Providing                  │
│ ────────────────────────────── │
│  Account                       │
│  Advertise                     │
│ ────────────────────────────── │
│  Sign out                      │
└────────────────────────────────┘
```

**Mobile anatomy** — the same radio group as a section at the top of `/account`, rendered as two full-width 56px rows with a check on the active one. Not hidden behind a menu on the surface the user visits to change settings.

**Behavior.** Switching persists `onboardingChoice`, then navigates to the new mode's slot-1 destination (`/home` for hire, `/services` for provide) so the user immediately sees the consequence. Never switch silently in place — an unexplained nav reshape reads as a bug.

**States.** Default: two radio items, one checked. Hover: menu-item wash. Active/checked: check indicator plus `--color-nav-active` text. Focus-visible: Radix's default menu focus ring, retained. **Loading:** the item shows a 14px spinner and the group gets `aria-busy="true"` while the mutation is in flight; **the menu stays open** — closing it mid-mutation destroys the only feedback surface. Error: an inline `--color-destructive` message inside the menu, and the radio reverts.

**Also required:** a persistent, always-visible mode indicator. The account trigger in the desktop sidebar footer gains a second line reading `Hiring` or `Providing` in `--text-crumb` / `--color-nav-ink-muted`. Without it, the user can only learn their mode by opening a menu — and a nav that silently reshapes based on invisible state is the failure this whole section exists to prevent.

**Keyboard / ARIA.** Radix `DropdownMenuRadioGroup` supplies `role="radiogroup"` / `role="menuitemradio"` / `aria-checked` and arrow-key navigation. Add `aria-label="Viewing as"`. After a successful switch, announce `"Now viewing as a provider"` in a polite live region — the visual change is large and off-screen for screen-reader users.

### 5.7 Breadcrumbs

Applied only to `/work/[id]`, `/work/[id]/edit`, `/work/[id]/review`, `/services/[id]`, `/providers/[id]`, `/account/ads`.

**Desktop:** a 12px row above the page title, `--color-nav-ink-muted`, `/` or `›` separators (`aria-hidden`), the final crumb `aria-current="page"` and not a link. Truncate the middle crumb to 32 characters with an ellipsis and a `title` attribute.

**Mobile:** **collapse to a single back affordance in the header** — `‹ {parent label}` — rather than rendering a wrapping trail. Two lines of breadcrumb on a 375px screen costs more than it returns.

```
Desktop:  Requests  ›  Panel upgrade in Oakland  ›  Review
Mobile:   ‹ Panel upgrade
```

**States.** Default muted, hover underlines and darkens to `--color-nav-ink`, focus-visible gets the standard 2px ring. No loading state — render the label from the route param or a skeleton word of fixed width so the row never shifts height.

**ARIA.** `<nav aria-label="Breadcrumb"><ol>…`. The mobile back link's accessible name is `"Back to {parent}"`, not `"Back"`.

### 5.8 The card as a navigation target

Cards are the highest-traffic navigation control in this product and the current implementation has a specific structural flaw worth fixing.

**Current:** `/marketplace` wraps the entire card body in a single `<Link>`. That works, but it makes it impossible to add a secondary target — and the provider name (`s.ownerName`) *should* link to `/providers/[profileId]`, which is precisely why that route is currently orphaned.

**Recommended anatomy — one primary link, optional nested targets, via the pseudo-element overlay pattern:**

```
┌──────────────────────────────┐
│                              │  Image: aspect-video, --radius-nav-card top,
│         cover image          │  bg --color-muted, object-cover
│                              │
├──────────────────────────────┤
│ Kitchen faucet replacement   │  --text-card-title, line-clamp-2
│ Marisol Vega                 │  --text-card-meta → /providers/[id]  ← nested
│                              │
│ $150                         │  tabular-nums, mt-auto
└──────────────────────────────┘
```

The container is `position: relative`. The title's `<a>` carries a `::after` with `position:absolute; inset:0` making the whole card clickable. The provider-name `<a>` gets `position:relative; z-index:1` to sit above the overlay. Result: one card, two real destinations, two tab stops, a single unambiguous accessible name per link, and no nested-anchor invalid HTML.

**States.** Default: `--shadow-nav-raised`, 1px hairline. Hover: `bg-muted/40` (matches today) and image `scale(1.02)` over 200ms — **image only, never the card box**, so grid geometry never moves. Focus-visible: 2px `--color-nav-focus` ring at 2px offset **on the card container** (`:focus-within`), not on the bare inline text — the visible focus target must match the clickable area. Press: `scale(0.99)` for 100ms. Loading: `Skeleton` at the card's exact height, so the grid does not reflow when data lands. Visited: no distinct styling — marketplace items are revisited routinely and a purple-link idiom is wrong here.

**Grid rhythm.** `gap: var(--spacing-grid-gutter)` (16px), 1-up below 640px, 2-up at 640px, 3-up at 1024px, 4-up at 1536px. Between major sections, `var(--spacing-section)` (64px). Both numbers taken from the observed Airbnb spec.

---

## 6. Motion and the accessibility floor

### 6.1 What animates

| Element | Property | Duration | Easing |
| --- | --- | --- | --- |
| Search collapse/expand | `width`, `height`, `opacity` | `--duration-nav-base` (200ms) | `--ease-nav-inout` |
| Header surface on scroll | `background-color`, `box-shadow` | `--duration-nav-fast` (150ms) | `--ease-nav-inout` |
| Nav item hover/active | `color`, `background-color` | `--duration-nav-fast` | `--ease-nav-inout` |
| Category chip selection | `background-color`, `border-color` | `--duration-nav-base` | `--ease-nav-inout` |
| Filter sheet | `transform: translateY` | `--duration-nav-sheet` (250ms) | `--ease-nav-out` |
| Dropdown / popover | `opacity`, `scale(0.96→1)` | `--duration-nav-base` | `--ease-nav-out` |
| Press feedback | `scale(0.96–0.99)` | `--duration-nav-instant` (100ms) | linear |
| Card image hover | `transform: scale(1.02)` | `--duration-nav-base` | `--ease-nav-out` |
| Route progress bar | `width` | indeterminate | linear |

### 6.2 What must never animate

- **Layout-affecting properties on the nav itself.** No animated `height` on the header, no animated `width` on the sidebar container, no animated `gap` in the grid. Content must not reflow while the user is reading it.
- **The category rail's height.** Skeleton chips occupy full height during load. A rail that appears and pushes content down is worse than a rail that arrives late.
- **Active-state changes triggered by route navigation.** When the page changes, the new active tab is simply active. A crossfade or sliding indicator during a route change competes with the content transition and reads as lag.
- **Anything on first paint of the nav chrome.** The header, sidebar, and bottom bar are present on load, not entered. `surface-enter` is for content, and the existing utilities already scope it that way.
- **Badge and count appearance.** A notification dot must not pulse. It is information, not an attention-getting device.

### 6.3 `prefers-reduced-motion`

`globals.css` already ships a global reduce block (clamping `animation-duration` and `transition-duration` to `0.01ms`) plus targeted overrides for `.surface-enter`, `.surface-fade`, `.list-stagger`, and `.surface-press`. **Keep it and extend it.** Under reduced motion:

- All transforms resolve instantly to their end state. No sliding, no scaling — including the card image hover and every press effect.
- The filter sheet and dropdowns appear and disappear with **no transition at all** — not a faster slide. A 60ms slide is still a slide.
- The search collapse becomes an instant swap between expanded and collapsed forms.
- The route progress bar is replaced by a static `aria-busy` region; an indeterminate animated bar is exactly the kind of continuous motion the preference is asking to stop.
- **Opacity-only crossfades at ≤150ms are permitted** to remain, because they do not induce vestibular symptoms and their removal makes state changes feel like flicker.

Detect in JS too, not only CSS: `window.matchMedia("(prefers-reduced-motion: reduce)")` must gate any `scrollIntoView({ behavior: "smooth" })` call — notably the category rail's scroll-active-chip-into-view behavior, which is JS-driven and therefore invisible to the CSS block.

### 6.4 Focus

- `:focus-visible` only — never `:focus`. Mouse users must not see rings; keyboard users must always see them.
- **Uniform treatment:** 2px solid `--color-nav-focus`, 2px offset, radius matching the element. One ring, everywhere. Inset only where an element is flush to a viewport edge (the bottom tab bar).
- Contrast of the ring against its adjacent background must meet **3:1**. Field green on white and its dark-mode counterpart both clear this; verify any future accent against it.
- **Focus is never removed without replacement.** The existing `outline-none` on the sidebar account trigger is acceptable only because `focus-visible:ring-2` immediately follows. Keep that pairing as an invariant.
- **Focus return is mandatory:** sheet, dropdown, and dialog all return focus to their trigger on close. Radix does this; do not override it.
- **The skip link is required** and does not exist today. First focusable element on every page, visually hidden until focused, targeting `#main-content` on the content wrapper in `daisy-app-shell.tsx`. Without it, keyboard users traverse the full sidebar on every navigation.

### 6.5 Touch targets

- **44×44px minimum** for every interactive nav element, expressed as `--spacing-touch`. The existing `size-11` (44px) and `min-h-11` usage is correct and should become the enforced standard.
- Where a control is visually smaller than 44px — the 32px category chips, the 12px breadcrumb links — extend the hit area with padding or a `::before` overlay at `inset: -6px`. Do not scale the visual up to meet the number; scale the *target* up.
- **Minimum 8px between adjacent targets.** The bottom bar's grid cells satisfy this by construction. The category rail's `--spacing-rail-gap` (8px) is the floor, not a starting point to shrink from.
- Bottom-bar cells must remain ≥44px tall *inside* the safe-area inset, not including it. The current implementation gets this right by setting the `<ul>` height to `--mobile-nav-height` and applying `padding-bottom: env(safe-area-inset-bottom)` to the `<nav>`.

### 6.6 Contrast minimums

| Pair | Requirement | Notes |
| --- | --- | --- |
| Nav label vs. surface | **4.5:1** | `--color-nav-ink-muted` on `--color-nav-surface` must be verified in both themes; if it falls short, darken the muted token rather than bolding the text |
| Active nav label vs. surface | **4.5:1** | Field green on white; verify the dark-mode variant too |
| Chip text on Pollen | **4.5:1** | This is the pair most at risk — a light yellow with dark-green text; verify, and darken `--color-nav-accent-ink` if needed |
| Focus ring vs. adjacent bg | **3:1** | Non-text contrast |
| Hairline borders | **exempt** | Decorative separators, not information. Anything that *carries* information (input borders, control boundaries) must hit **3:1** |
| Icons conveying state | **3:1** | Non-text contrast |
| Badge dot vs. surface | **3:1** | Plus a text equivalent in the accessible name |

**Non-negotiable:** color is never the sole carrier of state. Active tabs pair color with an icon-fill change or an indicator bar. Applied filters pair color with a count. Status badges pair color with a text label — which `WorkStatusBadge` already does correctly.

---

## 7. Migration map

Ordered by user-visible impact per unit of work. Every item names the file.

### Tier 1 — high impact, low effort

**1. Put Browse and Post in the nav.**
`src/lib/daisy/nav.ts` — extend all three arrays to include `/marketplace` (Browse) and `/create` (Post a job, `emphasize: true` for hire; `/services` stays emphasized for provide). Extend `isNavActive` with a `/marketplace` case.
*Impact:* the public browse surface and the primary conversion action become reachable. Currently neither is in any menu. This is a data-only change to one file and both the sidebar and the bottom bar pick it up automatically.

**2. Move browse state into the URL.**
`src/app/(app)/marketplace/page.tsx` — replace `useState` for `tab` and `searchQuery` with `useSearchParams` + `router.replace`. Rename `tab` to `scope` in the URL for consistency with the search control.
*Impact:* browse results become shareable, back-button-correct, and refresh-survivable. Prerequisite for saved searches, server-side filtering, and SSR of results. The largest architectural unlock in the list, and it is confined to one file.

**3. Add the role switch.**
`src/components/daisy/app-shell/desktop-sidebar.tsx` — a `DropdownMenuRadioGroup` in the existing account menu, plus the mode label on the trigger. Mirror as a section on `/account`. Needs one new mutation to persist `onboardingChoice`.
*Impact:* fixes a real dead end. Today the role is set once at `/welcome` and can never be changed or even seen.

**4. Delete the mobile hamburger sheet.**
`src/components/daisy/app-shell/mobile-nav.tsx` — remove the `Sheet` from `MobileHeader`; keep the title, add a back chevron on detail routes.
*Impact:* removes an exact duplicate of the bottom bar and frees the header's left slot for back navigation, which nothing currently provides. Net deletion of code.

**5. Add the skip link.**
`src/components/daisy/app-shell/daisy-app-shell.tsx` — one visually-hidden-until-focused anchor, and `id="main-content"` on the existing content `<div>`.
*Impact:* keyboard users stop traversing the sidebar on every navigation. Roughly six lines.

### Tier 2 — high impact, moderate effort

**6. Promote the category rail from the landing to `/marketplace`.**
Extract the `categories` `useMemo` from `src/ribs/landing/landing.view.tsx` into a shared `CategoryRail` component; render on `/marketplace` when `scope=jobs`; wire to `?cat=`. Add the roving-tabindex keyboard model and `role="tablist"` (the landing's current chips are plain buttons).
*Impact:* delivers "browse without deciding anything yet" on the surface where it matters. The derivation logic already exists and is already correct.

**7. Build the header search control.**
New component; mount in `daisy-app-shell.tsx` as a desktop header, and swap `/marketplace`'s current inline `Input` + `Button` form for it. Includes the scope `Select` and the collapse-on-scroll behavior.
*Impact:* the desktop shell currently has no header and therefore no search anywhere outside `/marketplace`'s page body. Depends on item 2.

**8. Add the mobile center action.**
`mobile-nav.tsx` — five slots with an elevated `/create` circle. `globals.css` already reserves the space (`app-content-pad` adds `2.5rem`); the control was never built.
*Impact:* posting becomes one tap from anywhere on mobile. Also makes an existing CSS comment true.

**9. Link provider names on cards.**
`src/app/(app)/marketplace/page.tsx` — apply the overlay pattern from 5.8 so `s.ownerName` links to `/providers/[profileId]`. Requires `profileId` on the `services.listActive` payload.
*Impact:* un-orphans `/providers/[profileId]`, which no card in the product currently links to.

### Tier 3 — worthwhile, larger

**10. Breadcrumbs on detail routes.** New component; mount on `/work/[id]/*`, `/services/[id]`, `/providers/[id]`, `/account/ads`. Requires the parent entity's title, which detail pages already fetch.

**11. Filter rail and filter sheet.** New components on `/marketplace`; four groups, client-side, URL-reflected. Depends on items 2 and 6.

**12. Stop redirecting providers from `/home`.** `src/app/(app)/home/page.tsx` — remove the `redirect("/services")`, give `DashboardScreen` a provider variant. Resolves the "Services" naming collision at its root and restores a real fifth nav slot in provide mode.

**13. Land a `/providers` index.** Makes the `Browse › Providers › {name}` breadcrumb honest and gives the provider directory an entrance. Needs a `provider.list` procedure.

**14. Add Browse to the landing header.** `src/ribs/landing/landing.view.tsx` — the marketing header currently offers only Sign in and Get started, so a signed-out visitor cannot reach `/marketplace` from the top of the page at all.

---

## 8. Open questions

Things this document could not resolve from the code alone.

1. **Is `/services` meant to stay private?** Everything in the nav gets simpler if provider listing management moves to `/account/services` or `/listings` and `/services` becomes the public catalog matching `/services/[id]`. That is a route rename with redirect implications, and it is a product call.
2. **Should `scope` default to Services or Jobs?** The code currently defaults to `services`. On the landing, jobs are the hero content. These disagree, and the answer depends on which side of the marketplace is thinner today — which is not knowable from the code.
3. **Will `category` ever become a controlled taxonomy?** The rail's design (derived, unillustrated, top-8) is a direct consequence of free-text `varchar(128)`. A real taxonomy table would justify icons, hierarchy, and a landing page per category — and would change section 5.3 substantially.
4. **Do users need both roles simultaneously?** I recommended one nav with a switch on the reading that `onboardingChoice` is a starting intent. If a meaningful number of users genuinely operate as both at once, Upwork's separate-profiles model becomes the better answer and section 3 should be revisited.
5. **Is there unread/notification state to badge?** I specified a badge slot on Requests but found no unread model in the schema. If none exists, drop the badge rather than inventing a count.
6. **When does search move server-side?** `work.browse` filters an unpaginated `listPublished()` in memory. The filter and rail specs assume client-side filtering over a modest result set. There is a listing count at which this stops being viable; where that threshold sits is a data question I cannot answer from the repository.
7. **Should the landing and the app share a header?** They are currently separate implementations. Unifying them would make the signed-out browse experience continuous with the signed-in one, at the cost of coupling marketing to the app shell.

---

## Sources

- [VoltAgent/awesome-design-md — `design-md/airbnb/DESIGN.md`](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/airbnb/DESIGN.md) — fetched and read; source of all specific Airbnb measurements cited above. A community reconstruction, not an Airbnb publication.
- [Upwork Help — How to search for jobs on Upwork](https://support.upwork.com/hc/en-us/articles/211063078-How-to-search-for-jobs-on-Upwork) — surfaced via search summary; direct fetch returned HTTP 403.
- [Upwork Help — Be a client and a freelancer](https://support.upwork.com/hc/en-us/articles/17980481990291--Be-a-client-and-a-freelancer) — surfaced via search summary; direct fetch returned HTTP 403.
- [Upwork Help — Add or switch account type](https://support.upwork.com/hc/en-us/articles/115013660327-Add-or-switch-account-type) — surfaced via search summary.
- [GigRadar — The Ultimate Upwork Search Filters Guide](https://gigradar.io/blog/the-ultimate-upwork-search-filters-guide) — third-party; source of the saved-search limit and boolean-operator claims.
- [ScrapingBee — Airbnb web scraping guide](https://www.scrapingbee.com/blog/how-to-web-scrape-airbnb-data/) and [SearchApi — Airbnb API documentation](https://www.searchapi.io/docs/airbnb-api) — third-party; source of the Airbnb URL parameter fragments.
- Daisy.work source, read directly: `src/lib/daisy/nav.ts`, `src/components/daisy/app-shell/{daisy-app-shell,desktop-sidebar,mobile-nav}.tsx`, `src/ribs/landing/landing.view.tsx`, `src/app/(app)/{marketplace,services,work,home}/page.tsx`, `src/server/api/routers/work.ts`, `src/styles/globals.css`.
