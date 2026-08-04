# orchestrator memory

## session 2026-08-04 — daisy.work → publishable

Baseline audit:
- tree clean; landing + work.browse committed (88b9964), not in main
- no auth lib installed; all procedures publicProcedure; ensureDemoUser hard-codes maya@daisy.work
- src/server/mocks/* has zero importers (dead)
- extra routes: saved, organization, payments, profile, inbox

Decisions:
- auth = next-auth v5 + Google OAuth
- extra routes = delete outright
- dispatch = all 4 tasks in parallel, file-ownership fenced

| timestamp | task_signal | agent_type | duration_s | outcome | files_changed |
|---|---|---|---|---|---|
| 2026-08-04 | auth+trpc-gating | general-purpose | pending | | |
| 2026-08-04 | prune-mocks-routes | general-purpose | pending | | |
| 2026-08-04 | landing-seo-copy | general-purpose | pending | | |
| 2026-08-04 | apply-flow | general-purpose | pending | | |
