# ROADMAP.md — badmintul.com

Status values used below: **Not started** / **In progress** / **Complete** / **Blocked**.
This file tracks phase-level status only. Task-level detail and acceptance criteria live in `TASKS.md`. Update the status column here whenever a phase's task set is entirely done (Complete), partially done (In progress), untouched (Not started), or stuck on an external/decision dependency (Blocked — note the blocker inline).

| Phase | Goal | Status | Depends on |
|---|---|---|---|
| 0 — Repo & Environment Setup | Repo structure, `app/` scaffold, Convex project, Hostinger access confirmed | In progress — `app/` scaffold + Convex project done (Tasks 1–2); Hostinger access still not confirmed | — |
| 1 — Data Model & Auth | Convex schema for users/roles/venues/courts/bookings; auth wired end to end | Complete — schema (Task 3) and auth mechanics (Task 4) implemented, tested, and independently verified; R-3 decision recorded in RISKS.md 2026-09-17 | Phase 0 |
| 2 — Superadmin Core | Superadmin login, venue approval queue, platform metrics view | In progress — approval queue/metrics/role-gating implemented and tested (Task 6); no superadmin seed script/runbook exists yet, and the dashboard isn't a distinct route (role-gated component on the same page instead) | Phase 1 |
| 3 — Venue Owner Core | Venue owner signup, venue/court creation, pending-state UX | Complete — Task 5 implemented and independently verified, including the R-8 owner-isolation negative test | Phase 1 |
| 4 — Player Core | Browse venues, live availability calendar, booking flow, booking history | Complete — Tasks 7–8 implemented and independently verified, including the R-4 concurrent-booking negative test | Phase 1, Phase 3 (needs at least one approvable venue) |
| 5 — PWA & Landing Page | Public landing page, manifest + service worker, installability, offline app shell | In progress — landing page `/login` link fixed 2026-09-17, `npm test` now passes clean (21/21); PWA (Task 10) manifest/service-worker is solid but Android/iOS device install verification (R-5) is still outstanding and blocks calling this phase fully Complete | Phase 4 (needs real app screens to wrap) |
| 6 — Deployment | Production Convex deployment, Hostinger static hosting, domain + DNS + HTTPS on badmintul.com | Blocked — Convex production deployment exists, but Hostinger upload/domain/HTTPS (R-1, R-7) has not happened; no hosting credentials available in this environment | Phase 5 |
| 7 — Hardening & Launch Check | Double-booking race test, role-boundary audit, cross-device PWA install test | Complete for what doesn't need Hostinger — cross-role audit and R-4/R-8 re-tests (Task 12a) now run and confirmed against actual production Convex (2026-09-17), not just the local simulator; cross-device PWA install (R-5) still needs a physical device | Phase 6 |

## Notes on sequencing

- **Phase 4 depends on Phase 3**, not just Phase 1, because a player needs at least one real, approved venue with courts to book against — building the player flow against pure mock data risks schema drift from the venue-owner flow. Build venue owner core first, seed one approved venue, then build player flow against real data.
- **PWA work (Phase 5) is deliberately last before deployment**, not first. Wrapping unfinished screens in a service worker early creates cache-invalidation debugging overhead for no benefit — do it once the screens are stable.
- **Nothing in Phases 0–5 depends on Hostinger being reachable.** Local dev against a Convex dev deployment works standalone; Hostinger only enters the picture at Phase 6. Don't let Hostinger account/FTP setup block earlier phases — that's why it's scoped to Phase 0 as "access confirmed" only (not full deploy pipeline).

## How to update this file

When a phase's tasks (see `TASKS.md`) are all checked off, flip that row to Complete and move the "current phase" pointer below. Don't mark a phase Complete if its acceptance criteria in `TASKS.md` haven't been individually verified — task-complete and acceptance-criteria-met are not the same thing.

**Current phase:** Work has substantively progressed through Phases 0–7 in a single Codex pass (Tasks 1–12, see REVIEW.md), without the per-task human/Claude Code review gate CLAUDE.md and TASKS.md require. On independent review (2026-09-17), every concrete defect found so far has been fixed the same day: R-3's missing evaluation record (RISKS.md), the landing page's failing `/login` test (Task 9a), and R-4/R-8's re-verification against real production rather than just the local `convex-test` simulator (Task 12a criteria 1–3, executed against `frugal-vole-549` with seeded test data cleaned up afterward). Remaining open items are now all genuinely external — no more known code defects: Phase 0 (Hostinger access), Phase 2 (superadmin seed script/runbook, distinct dashboard routing — not blocking, just not built), Phase 5 (Android/iOS device install verification, R-5), Phase 6 and Task 12a criterion 4 (actual Hostinger upload/DNS/HTTPS + live booking verification — both need the same missing hosting credentials).
