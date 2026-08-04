/**
 * One-shot: put a handful of real published jobs in the database so a brand-new
 * environment isn't an empty grid. These are real rows posted by a real account
 * (samples@daisy.work) — they behave exactly like any other job. Nothing about
 * them is faked in the UI.
 *
 * Run:  node --env-file=.env scripts/seed-jobs.mjs
 * Undo: node --env-file=.env scripts/seed-jobs.mjs --remove
 *
 * ponytail: plain postgres + SQL, no drizzle/tsx/ts-node in the loop.
 */
import postgres from "postgres";

const SEED_EMAIL = "samples@daisy.work";

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set. Run with: node --env-file=.env scripts/seed-jobs.mjs");
  process.exit(1);
}

/** Budgets are integer cents. Never floats. */
const JOBS = [
  {
    title: "Swap a 100A panel for a 200A service",
    description:
      "Single-family home, 1970s wiring. Need a licensed electrician to pull the permit, upgrade the main panel to 200A and relabel the circuits. Utility disconnect already scheduled.",
    category: "electrical",
    workMode: "on_site",
    locationLabel: "Sacramento, CA",
    budgetType: "fixed",
    budgetAmount: 320000,
  },
  {
    title: "Two-page landing site for a dog grooming van",
    description:
      "Mobile grooming business, no site today. Needs a home page, a booking link and a service-area map. I have photos and a logo. Copy can be rewritten from my notes.",
    category: "web design",
    workMode: "remote",
    locationLabel: null,
    budgetType: "fixed",
    budgetAmount: 90000,
  },
  {
    title: "Bookkeeping cleanup for 2 years of Stripe payouts",
    description:
      "Small e-commerce LLC. Books drifted from the Stripe payouts and the reconciliation is behind. Need someone comfortable in QuickBooks Online to get it clean before taxes.",
    category: "accounting",
    workMode: "remote",
    locationLabel: null,
    budgetType: "hourly",
    budgetAmount: 6500,
  },
  {
    title: "Move a 1-bedroom apartment across town",
    description:
      "Third floor walk-up to a ground floor unit about four miles away. No piano, one couch, roughly fifteen boxes. Need two movers and a truck on a Saturday.",
    category: "moving",
    workMode: "on_site",
    locationLabel: "Portland, OR",
    budgetType: "fixed",
    budgetAmount: 48000,
  },
  {
    title: "Edit six 8-minute YouTube episodes",
    description:
      "Talking-head interviews with b-roll. Need cuts, captions, thumbnails and a consistent intro. Footage is already in Drive. Roughly one episode a week.",
    category: "video editing",
    workMode: "remote",
    locationLabel: null,
    budgetType: "milestone",
    budgetAmount: 240000,
  },
  {
    title: "Repair a leaking kitchen sink drain",
    description:
      "Slow leak under the sink, cabinet base is starting to swell. Need a plumber to trace it, replace the trap assembly and confirm nothing is leaking behind the wall.",
    category: "plumbing",
    workMode: "on_site",
    locationLabel: "Austin, TX",
    budgetType: "fixed",
    budgetAmount: 28000,
  },
  {
    title: "Spanish translation of a 24-page benefits handbook",
    description:
      "Employee handbook for a small clinic. Needs a natural Latin American Spanish translation, not machine output. Some medical and HR terminology.",
    category: "translation",
    workMode: "remote",
    locationLabel: null,
    budgetType: "fixed",
    budgetAmount: 75000,
  },
  {
    title: "Weekly yard maintenance, quarter-acre lot",
    description:
      "Mow, edge, blow and haul clippings. Every two weeks March through October. Gate code provided. Hedges trimmed twice a season.",
    category: "landscaping",
    workMode: "on_site",
    locationLabel: "Mesa, AZ",
    budgetType: "hourly",
    budgetAmount: 4500,
  },
];

const sql = postgres(url, { prepare: false, max: 1 });

try {
  if (process.argv.includes("--remove")) {
    const [user] = await sql`
      select id from daisywork_user where email = ${SEED_EMAIL} limit 1`;
    if (!user) {
      console.log("Nothing to remove.");
    } else {
      const removed = await sql`
        delete from daisywork_work_order where "requesterId" = ${user.id} returning id`;
      await sql`delete from daisywork_user where id = ${user.id}`;
      console.log(`Removed ${removed.length} sample job(s) and the sample account.`);
    }
    await sql.end();
    process.exit(0);
  }

  // Columns are camelCase, and createdAt has no DB-side default — pass it.
  const [user] = await sql`
    insert into daisywork_user ${sql({
      name: "Daisy Samples",
      email: SEED_EMAIL,
      createdAt: new Date(),
    })}
    on conflict (email) do update set name = excluded.name
    returning id`;

  let inserted = 0;
  for (const job of JOBS) {
    // Idempotent: the same title from the sample account is never posted twice.
    const [existing] = await sql`
      select id from daisywork_work_order
      where "requesterId" = ${user.id} and title = ${job.title} limit 1`;
    if (existing) continue;

    await sql`
      insert into daisywork_work_order ${sql({
        title: job.title,
        description: job.description,
        requesterId: user.id,
        category: job.category,
        // Enum-backed columns are snake_case in the DB; the rest are camelCase.
        work_mode: job.workMode,
        locationLabel: job.locationLabel,
        budget_type: job.budgetType,
        budgetAmount: job.budgetAmount,
        currency: "USD",
        status: "published",
        createdAt: new Date(),
      })}`;
    inserted += 1;
  }

  console.log(
    `Seeded ${inserted} job(s); ${JOBS.length - inserted} already present. Poster: ${SEED_EMAIL}`,
  );
} finally {
  await sql.end();
}
