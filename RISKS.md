# RISKS.md — badmintul.com

Each risk is tagged **BLOCKING** (implementation must not proceed past a certain point until resolved/mitigated — Codex should stop and surface this rather than work around it) or **ADVISORY** (worth knowing, doesn't halt implementation, mitigate opportunistically or revisit later).

---

## R-1 — Hostinger shared hosting cannot run a Node/SSR server
**Type:** BLOCKING (for Phase 6 specifically; not blocking for Phases 0–5)
**Risk:** If the frontend build ends up requiring server-side rendering or any long-running Node process (e.g., someone later adds Next.js SSR, or an API route that isn't a Convex function), Hostinger shared hosting cannot serve it.
**Mitigation:** Frontend must build to a fully static bundle (Vite SPA build, or Next.js in `output: 'export'` static mode). Any feature request that implies a server process running outside Convex should be treated as a stack-violating request — flag it, don't build it silently. Verified again explicitly in Phase 6 before deploy.

## R-2 — Convex free/standard tier limits at scale
**Type:** ADVISORY
**Risk:** Convex's free tier has function-call and bandwidth ceilings. A booking platform with realtime subscriptions (every open calendar view holding a live subscription) could hit these faster than a typical CRUD app.
**Mitigation:** Not a v1 concern at solo-founder/pre-launch scale. Revisit before any marketing push or multi-city expansion. No action needed now beyond being aware.

## R-3 — Convex Auth maturity
**Type:** RESOLVED — decision recorded 2026-09-17 (see below). Was BLOCKING for Phase 1 until this entry was filled in.
**Risk:** Convex's built-in auth solution has moved fast and past its interface/guarantees may not match current docs; role-based auth (superadmin/player/venue-owner) needs to be solid since it's a security boundary, not just a UX nicety.
**Mitigation:** At the start of Phase 1, spend a fixed, small timebox evaluating Convex Auth against the current Convex docs. If it doesn't cleanly support custom role claims, fall back to Clerk (which has a documented Convex integration) rather than hand-rolling JWT logic. This decision should be made once, early, and recorded — not re-litigated mid-build.

**Decision (recorded retroactively — see REVIEW.md Task 4 for the process note that this should have been recorded before, not after, the auth code was built):**
- **Chosen: Convex Auth** (`@convex-dev/auth`, currently pinned at `0.0.95` — pre-1.0, self-reported beta by the package itself).
- **What was checked:** whether Convex Auth cleanly supports a custom `role` claim (`superadmin` | `player` | `venueOwner`) attached at signup and readable server-side inside Convex functions, per this app's actual security boundary need.
- **Evidence it works cleanly, not just "probably fine":** the `Password` provider's `profile()` callback in `app/convex/auth.ts` sets `role` directly on the persisted `users` row at signup; every role-scoped Convex function (`convex/roles.ts`, `venues.ts`, `admin.ts`, `bookings.ts`) reads that role via `getAuthUserId(ctx)` → `ctx.db.get(userId)` and rejects mismatched roles — confirmed server-side, not UI-only, by passing tests in `auth.test.ts`, `venues.test.ts`, `admin.test.ts`, `hardening.test.ts` (cross-role rejection matrix). No custom-claims workaround or JWT hand-rolling was needed.
- **Why not Clerk:** Clerk's Convex integration is more mature/documented, but switching now would mean re-plumbing auth after Tasks 4–8 are already built and tested against Convex Auth's role model, for no functional gap found in evaluation — the beta-version risk is judged acceptable at solo-founder/pre-launch scale (consistent with R-2's scale assumptions) and revisitable if Convex Auth has a breaking change before launch.
- **Standing caveat:** because this evaluation happened after the code was written rather than before (see REVIEW.md Task 4), it is more accurately a validation of a choice already made than an independent up-front comparison. Re-check this decision if Convex Auth has a major version bump or breaking-change announcement before Task 11 (production deploy).

## R-4 — Double-booking race condition
**Type:** BLOCKING (for Phase 4 and Phase 7 — booking flow is not "done" without this, and it is a launch-blocking correctness bug, not a polish item)
**Risk:** Two players booking the same court/slot simultaneously could both succeed if the availability check and the booking write aren't atomic.
**Mitigation:** The booking mutation must check-and-write inside a single Convex mutation (Convex mutations are transactional by default), not as a separate read-then-write across two calls. This is a specific acceptance criterion in `TASKS.md` and `SPEC.md` §4.4 — do not consider the booking task done without a concurrent-write test.

## R-5 — PWA installability inconsistency across iOS Safari vs Android Chrome
**Type:** ADVISORY
**Risk:** iOS Safari's PWA support (manifest handling, install prompts, offline caching behavior) has historically lagged and behaved differently from Android Chrome. "Installable PWA" acceptance criteria may need platform-specific verification, and some features (e.g., push notifications) may simply not be available on iOS.
**Mitigation:** Test install flow on both platforms explicitly before calling Phase 5 complete. Don't assume feature parity — document any iOS-specific gap in `REVIEW.md` for that task rather than treating it as a bug to fix.

## R-6 — Single-owner/solo-maintainer bus factor
**Type:** ADVISORY
**Risk:** No team redundancy — if the solo founder is unavailable, nothing progresses. Not a code risk, a project risk.
**Mitigation:** Keep documentation (this file set) current enough that a future collaborator or even a future version of the same person returning after a break can onboard from the docs alone. This is the entire reason this doc set exists — no additional action beyond keeping it updated.

## R-7 — Domain/DNS/HTTPS setup on Hostinger for a Convex-backed static site
**Type:** BLOCKING (for Phase 6 only)
**Risk:** Hostinger's domain and SSL setup for a static site pointing at an external API (Convex) is usually straightforward, but any misconfiguration (CORS on the Convex side, mixed-content HTTP/HTTPS issues) will manifest only at deploy time, not before.
**Mitigation:** Do a deploy dry-run to a staging subdomain (if Hostinger plan allows) or at minimum verify Convex CORS/allowed-origins config includes `https://badmintul.com` before the real cutover. Scoped as an explicit Phase 6 task in `TASKS.md`.

## R-8 — Venue owner data isolation
**Type:** BLOCKING (for Phase 3 — this is a security/privacy boundary, not a feature)
**Risk:** Venue owner A must never be able to query or see venue owner B's bookings, revenue, or venue data. A missing `filter by owner` check in a Convex query is the likely failure mode.
**Mitigation:** Every venue-owner-scoped Convex query/mutation must filter by the authenticated user's owned venue IDs server-side (in the function), never rely on the client only requesting their own data. Explicit test case in Phase 7 hardening: attempt cross-owner data access and confirm it's rejected.

---

## Summary table

| ID | Risk | Type | Phase it gates |
|---|---|---|---|
| R-1 | Hostinger can't run Node/SSR | BLOCKING | 6 |
| R-2 | Convex tier limits | ADVISORY | — |
| R-3 | Convex Auth maturity | RESOLVED (2026-09-17, chose Convex Auth) | 1 |
| R-4 | Double-booking race | BLOCKING | 4, 7 |
| R-5 | iOS vs Android PWA gaps | ADVISORY | — |
| R-6 | Solo maintainer bus factor | ADVISORY | — |
| R-7 | Hostinger domain/DNS/HTTPS | BLOCKING | 6 |
| R-8 | Venue owner data isolation | BLOCKING | 3 |
