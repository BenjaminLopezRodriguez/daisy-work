# orchestrator memory

## session 2026-08-04 — daisy.work → publishable

Baseline audit:
- tree clean; landing + work.browse committed (88b9964), not in main
- no auth lib; all procedures publicProcedure; ensureDemoUser hard-coded maya@daisy.work
- src/server/mocks/* zero importers (dead)
- extra routes: saved, organization, payments, profile, inbox

Decisions:
- auth = next-auth v5 + Google OAuth
- extra routes = delete outright
- dispatch = 4 tasks in parallel, file-ownership fenced (worked; zero conflicts)

| timestamp | task_signal | agent_type | duration_s | outcome | files_changed |
|---|---|---|---|---|---|
| 2026-08-04 | landing-seo-copy | general-purpose | 79 | ok | 6 |
| 2026-08-04 | apply-flow | general-purpose | 147 | ok | 7 |
| 2026-08-04 | prune-mocks-routes | general-purpose | 243 | ok | 11 changed, 14 deleted |
| 2026-08-04 | auth+trpc-gating | general-purpose | 247 | ok | 12 |

Orchestrator fixes after merge:
- root.ts: registered application router
- tRPC reserves `apply` as a procedure name → renamed to `application.submit` (build-breaking)
- session.tsx: signed-out ≠ DB error; sign-in prompt instead
- deleted public/favicon.ico (shadowed app/icon.tsx)

Gates: typecheck clean, lint clean, 5 tests pass, build green (SKIP_ENV_VALIDATION locally).

Still human-only: rotate Neon password, Google OAuth creds, AUTH_SECRET, pnpm db:push,
push/merge to main, vercel deploy.
