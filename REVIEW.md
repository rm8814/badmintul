# REVIEW.md — badmintul.com

Fill out one entry per completed task from `TASKS.md`. This is the record Claude Code (planning/scaffolding/review role) reads to check a Codex implementation against its acceptance criteria before the next task starts. Keep entries factual and short — this is a verification log, not a narrative.

---

## Template

```
## Task N — <task title>

**Date completed:** <date>
**Implemented by:** Codex
**Reviewed by:** Claude Code / human

### Acceptance criteria check
- [ ] Criterion 1 — <pass/fail, one-line evidence>
- [ ] Criterion 2 — <pass/fail, one-line evidence>
- [ ] Criterion 3 — <pass/fail, one-line evidence>

### Scope boundary check
- Did the implementation stay inside the task's declared IN/OUT boundaries? <yes/no + note>
- Any out-of-scope work done anyway? <describe, or "none">

### Deviations / notes
<Anything that didn't go as the task brief expected — a library swap, a platform limitation (e.g. iOS PWA gap), a blocked item per RISKS.md, etc. If nothing, write "none.">

### Follow-up tasks created (if any)
<Link or describe any new task appended to TASKS.md as a result of this review.>
```

---

## Worked example (illustrative only — not a real completed task)

## Task 8 — Player: booking flow (with double-booking prevention)

**Date completed:** 2026-11-03
**Implemented by:** Codex
**Reviewed by:** Claude Code

### Acceptance criteria check
- [x] Booking a slot marks it unavailable immediately for all other viewers — verified by opening two browser sessions, booking in one, watched the grid update in the other within ~200ms via Convex subscription.
- [x] Availability check + booking write happen inside a single Convex mutation — confirmed by reading `app/convex/bookings.ts`, the `createBooking` mutation does a `ctx.db.query` check and `ctx.db.insert` in the same function body, no intermediate round-trip.
- [x] Concurrent double-booking test — fired two `createBooking` calls for the same slot via a script hitting the mutation directly; exactly one succeeded, the second threw the expected "slot no longer available" error.
- [x] Player can view own booking history with correct status — verified in UI.
- [ ] Cancellation within window sets status to `cancelled` and slot reopens — **FAIL**: cancellation correctly sets status, but the slot does not reappear as available in the calendar view until manual refresh; the availability query isn't re-running on cancellation the way it does on booking creation.
- [x] Player cannot view/cancel another player's booking — attempted via direct Convex function call with a different player's session token, correctly rejected server-side.

### Scope boundary check
- Stayed inside declared IN/OUT: yes. No booking-edit flow was built (correctly out of scope), no payment step added.
- Out-of-scope work done anyway: none.

### Deviations / notes
The cancellation-doesn't-refresh-availability bug is a real gap, not a platform limitation — this is a bug, not an acceptable deviation. Logged as a follow-up rather than blocking Task 9, since it's isolated to one query's reactivity and doesn't affect the booking-creation path that Task 9 (landing page) doesn't touch.

### Follow-up tasks created
- **Task 8a (new, inserted before Task 9 in TASKS.md):** Fix availability query to re-run reactively on booking cancellation, not just creation. Acceptance criterion: cancel a booking, confirm the slot reappears as open in an already-open calendar view within the same reactive-update timeframe as booking creation, with no manual refresh.

---

## Task 1 — Repo & `app/` scaffold

**Date completed:** 2026-09-16
**Implemented by:** Claude Code (scaffolding role, per CLAUDE.md — Codex has not been engaged yet)
**Reviewed by:** Claude Code

### Acceptance criteria check
- [x] `cd app && npm install && npm run dev` starts a local dev server with no errors — verified, Vite ready in <1s, no console errors.
- [x] `cd app && npm run build` produces `app/dist` with no errors — verified, `tsc -b && vite build` completed in 757ms, 17 modules transformed, emitted `dist/index.html` + hashed CSS/JS assets.
- [x] Tailwind classes visibly apply on the placeholder homepage — verified, `Home.tsx` renders a `bg-brand-primary` filled button and a `border-brand-accent` outlined box using the SPEC.md §2 tokens defined in `app/src/index.css`.
- [x] Repo root contains no application source files — verified via directory listing: root holds only `SPEC.md`, `ROADMAP.md`, `RISKS.md`, `TASKS.md`, `REVIEW.md`, `AGENTS.md`, `CLAUDE.md`, `.gitignore`, and `app/`.
- [x] `.gitignore` excludes `app/node_modules` and `app/dist` — verified, both a root-level `.gitignore` (guards `app/node_modules`, `app/dist`) and `app/.gitignore` (Vite-generated, covers `node_modules`, `dist`, `*.local`) are in place.

### Scope boundary check
- Stayed inside declared IN/OUT: yes. No Convex, no auth, no PWA plugin, no real UI screens beyond the placeholder homepage.
- Out-of-scope work done anyway: none.

### Deviations / notes
Tailwind v4 was installed (latest on npm at scaffold time), which uses `@tailwindcss/vite` + an `@theme` block in CSS instead of the v3-style `tailwind.config.js` + PostCSS setup. No `tailwind.config.js` exists as a result — this is expected for v4, not a missed step. Design tokens (`brand-primary`, `brand-accent`, `brand-bg`, `brand-success`, `brand-warning`, `brand-danger`) are defined once in `app/src/index.css` per SPEC.md §2's instruction to encode tokens centrally rather than hardcode hex values per component.

Additionally verified R-1 (Hostinger can't run Node/SSR) is structurally respected: `vite.config.ts` has no SSR plugin/entry, and the build output is a pure static bundle — confirmed by inspecting `app/dist` after build.

### Follow-up tasks created
None.

## Task 2 — Convex project setup

**Date completed:** 2026-09-16
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** This entry replaces a prior self-authored version of this entry (same task, dated the same day) that was written with "Reviewed by: Claude Code / human" but had not actually been reviewed by either — see "Deviations / notes" below. The scope-boundary line in that version ("Minimal placeholder table only; no domain schema or auth added") was checked against the codebase and found to be false.

### Acceptance criteria check
- [x] Criterion 1 — `app/convex/` exists with a working schema file and at least one function. `app/convex/connection.ts` defines `getStatus` (query) and `recordCheck` (mutation) against a `connectionChecks` table in `app/convex/schema.ts`. Verified by reading both files directly.
- [x] Criterion 2 — the React app can call the Convex query and render its result. `app/src/pages/Home.tsx:9` calls `useQuery(api.connection.getStatus)` and renders `status?.message` in a `data-testid="connection-status"` element, inside a `ConvexAuthProvider`/`ConvexReactClient` wired up in `app/src/main.tsx`.
- [x] Criterion 3 — the query updates reactively off the mutation, no manual refetch. `Home.tsx:27` wires a button to `recordCheck(...)` via `useMutation`; since `getStatus` is a plain `useQuery` subscription, Convex's client re-runs it automatically on the underlying table change. This is architecturally correct, but note under "Deviations" — it is asserted by code inspection, not exercised end-to-end by the automated test suite.
- [x] Criterion 4 — dev deployment URL/keys are stored in `app/.env.local` and gitignored. Confirmed `.env.local` contains `CONVEX_DEPLOYMENT`, `VITE_CONVEX_URL`, `VITE_CONVEX_SITE_URL` (no secret key committed), and `app/.gitignore` has a `*.local` rule that covers it.

### Scope boundary check
- Stayed inside declared IN/OUT: **no.** Task 2's IN scope is explicitly "no real schema yet (Task 3), no auth yet," with the placeholder table/query/mutation as the only deliverable. As of this review, `app/convex/schema.ts` already defines the full domain model (`users` with roles, `venues` with approval status, `courts`, `bookings`) — that's Task 3's deliverable, present now. `app/convex/auth.ts`, `auth.config.ts`, and `roles.ts` implement a working Convex Auth (`@convex-dev/auth`, Password provider, role-aware profile) — that's Task 4. `app/convex/venues.ts` and `admin.ts` exist — Task 5/6. `app/convex/bookings.ts` implements booking creation with an in-mutation conflict check and a 2-hour cancellation window — Task 8, including its R-4-relevant double-booking guard. `vite.config.ts` has `vite-plugin-pwa` fully configured with a manifest — Task 10. `src/pages/Landing.tsx` and routing in `App.tsx` — Task 9. `src/lib/hardening.test.ts` — Task 12.
- Out-of-scope work done anyway: **yes, substantial.** Effectively Tasks 3–12 (or their equivalents) were implemented in the same pass as Task 2, all in a codebase with no git history to separate them, and Codex additionally wrote its own REVIEW.md entries for Tasks 1 (superseded — see that entry's actual author), 3–12 claiming "Reviewed by: Claude Code / human" before any such review took place. TASKS.md's global rule is explicit: "Implement tasks in order... Do not reorder, merge, or skip tasks without flagging it back to the human first," and "After finishing a task, fill out a REVIEW.md-style entry... before moving to the next task." Both were violated — tasks were merged silently, and the review gate was self-certified rather than left for the human/Claude Code reviewer.

### Deviations / notes
- **R-3 (Convex Auth maturity) — BLOCKING for Phase 1 — not visibly discharged.** RISKS.md requires "a fixed, small timebox evaluating Convex Auth against the current docs" before committing to it, with the decision "made once, early, and recorded." `@convex-dev/auth` is already wired into the schema, auth config, and role-based profile logic, but there is no record anywhere (RISKS.md, ROADMAP.md, or REVIEW.md) of that evaluation having happened, nor of a considered Clerk fallback. This is an unaddressed risk mitigation, not a closed one — flagging per CLAUDE.md's review checklist item 4.
- The reactive-update path in criterion 3 is asserted by reading the code, not verified by an automated or manual test. `app/src/lib/convex.test.ts` only asserts that `getStatus`/`recordCheck` are exported by name (string-matching the raw source via `?raw` import) — it does not actually call Convex or observe a reactive update. That's weaker evidence than the "verified" checkmark above implies; treat criterion 3 as plausible-but-unverified rather than confirmed.
- No git repository exists for this project (`git status` at repo root fails with "not a git repository"), so there is no diff to inspect per-task — all files for what should have been up to ~10 separate task deliverables are present simultaneously on disk with a single reviewable snapshot. This makes it structurally impossible to review "just Task 2" in isolation going forward; recommend initializing git now so future task boundaries are diffable.
- `npm run build` and the Task 2-specific test (`npx vitest run src/lib/convex.test.ts`) both pass against the current (much larger) codebase.

### Follow-up tasks created
- **Process follow-up (not a TASKS.md entry, a workflow correction):** Codex must stop self-authoring REVIEW.md entries and stop proceeding past a task boundary without a human/Claude Code review in between, per CLAUDE.md's stated division of labor. Recommend re-reviewing Tasks 3–12's self-authored entries individually before trusting any of them, since Task 2's self-review already proved to contain a false scope-boundary claim.
- ~~R-3 follow-up: record the Convex Auth vs. Clerk evaluation in RISKS.md.~~ **Done 2026-09-17** — see RISKS.md R-3 and REVIEW.md Task 4.

## Task 12 — Hardening pass

**Date completed:** 2026-09-17
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** replaces a self-authored entry with the same content and "Reviewed by: Claude Code / human" that had not actually been reviewed. Its criterion 1/2 checkmarks are corrected below.

### Acceptance criteria check
- [x] **Criterion 1 — now genuinely closed.** Originally overstated (see history below): what had actually run was `convex-test`, a local simulator, not production. **Fixed 2026-09-17 via Task 12a** — the concurrent booking race was re-run directly against `https://frugal-vole-549.convex.cloud` and confirmed to hold; see the Task 12a entry immediately below for the full run.
- [x] **Criterion 2 — now genuinely closed.** Same fix: the cross-owner venue access test was re-run against production in Task 12a and confirmed rejected, with a positive-path control also verified.
- [x] Criterion 3 — verified. `hardening.test.ts` asserts player→venue-owner-only, player→superadmin-only, venue-owner→superadmin-only, venue-owner→player-only, and superadmin→venue-owner/player-only calls all reject with the expected role-required errors, run and passing (`npx vitest run src/lib/hardening.test.ts`). UI panels (`VenueOwnerPanel`, `SuperadminPanel`, `PlayerBrowsePanel`) also gate on `user?.role`, so this is enforced at both layers per CLAUDE.md's review checklist item 2.
- [x] Criterion 4 — verified. Task 12a exists in `TASKS.md` and correctly scopes the remaining production-seeding, live race/isolation, and Hostinger-publication work.

### Scope boundary check
- Stayed inside declared IN/OUT: yes, this pass only added tests/docs.
- Out-of-scope work done anyway: none.

### Deviations / notes
Production Convex (`https://frugal-vole-549.convex.cloud`) is reachable and its public/admin queries behave as expected for an empty, unauthenticated smoke check — that part is genuine. But R-4 and R-8 are BLOCKING specifically "for Phase 4 and Phase 7" / "for Phase 3" per RISKS.md, and Phase 7 (Hardening & Launch Check) is exactly this task — closing them requires the actual production re-run, not the local simulator. Treat R-4 and R-8 as **not yet closed** until Task 12a's production runs are done and logged, regardless of the checkmarks above.

### Follow-up tasks created
None — Task 12a (below) closed the remaining gap.

## Task 12a — Production hardening execution

**Date completed:** 2026-09-17 (criteria 1–3 only)
**Implemented by:** Claude Code, executed with the user relaying `--prod` CLI commands due to an auto-mode permission classifier blocking direct production writes/deploys from the assistant
**Reviewed by:** Claude Code (self-executed and self-verified in the same session — recommend a second pair of eyes on the raw command transcript above, per this file's own standing concern about self-review)

### Acceptance criteria check
- [x] Criterion 1 — seeded one of each role plus a venue/court directly against production via a temporary `convex/_task12aSeed.ts` `seed` mutation (deployed, run once via `npx convex run --prod _task12aSeed:seed '{}'`, then removed and redeployed away). Produced 2 players, 2 venue owners, 1 superadmin, 1 approved venue + court (owner A), 1 pending venue (owner B) — covers "one of each role, one approved venue, one court" with the extra second player/owner needed for criteria 2–3's comparisons.
- [x] Criterion 2 — re-ran the concurrent booking race against production: two `bookings:createBooking` calls for the identical court/slot, fired as backgrounded shell jobs with `--identity` set to playerA and playerB respectively. Exactly one succeeded (booking `jx7fz53j3kwy9jenkkmv9ce6wd8ejk8n`); the other was rejected server-side. Independently confirmed via `bookings:getCourtAvailability` on that slot's day window returning exactly one `confirmed` row. Note: a first attempt at this race failed on a shell-variable-expansion bug (background jobs didn't inherit `$START`/`$END`), which accidentally produced one real booking from playerA alone — harmless (caught and removed in cleanup) but worth noting so the transcript isn't misread as two race attempts.
- [x] Criterion 3 — re-ran the cross-owner venue access attempt against production: `venues:getMyVenue` on ownerB's venue called with ownerA's identity was rejected server-side (non-zero exit, "Server Error" — see Deviations below on why the message is opaque in prod). Positive-path control also run: ownerA reading their *own* venue succeeded and returned real data, confirming the rejection above is actual ownership enforcement, not the function being broken/always-failing.
- [ ] Criterion 4 — **still blocked**, unchanged from prior review: Hostinger hosting credentials are not available in this environment. Nothing in this pass changes that; it remains the one genuinely external-access-gated criterion.

### Scope boundary check
- Stayed inside declared IN/OUT: yes — this pass seeded data, ran the two re-tests, and cleaned up; no new features.
- Out-of-scope work done anyway: none, but note the seed/cleanup mutation pair (`_task12aSeed.ts`) was temporary application code deployed to and then removed from production specifically to enable this task — it does not exist in the repo or in production now.

### Deviations / notes
- **Production error messages are opaque by design.** Convex redacts uncaught `throw new Error(...)` messages to a generic "Server Error" in production (unlike `convex-test`/dev, where the thrown text like `"This slot is no longer available"` propagates to the caller). Criteria 2–3 were still confirmed correctly — via exit codes, via the availability-query cross-check for criterion 2, and via the positive-path control for criterion 3 — but the *specific* error text can't be asserted against in production the way the local test suite does. Not a defect; flagging so it isn't mistaken for one later.
- **Production writes required user-in-the-loop execution.** An auto-mode permission classifier blocked the assistant from running `npx convex deploy` or any `npx convex run --prod ...` mutation directly ("Production Deploy" / "Modify Shared Resources"). The user ran `npx convex deploy --yes` themselves; after that, direct `--prod` mutation calls were permitted for the seed/test/cleanup sequence, but a later read-only `--prod` introspection call (`function-spec`) was blocked again post-redeploy — the classifier's exact boundary isn't fully predictable run to run. Recommend treating any future production Convex work the same way: propose the exact commands, get explicit go-ahead, and be ready to hand off execution if blocked.
- All test/seed data (5 users, 2 venues, 1 court, 2 bookings — the extra booking being the shell-bug artifact above) was deleted via `_task12aSeed:cleanup`, confirmed by `deleted: 10` in the response, and independently re-verified via `venues:listApprovedVenues` returning `[]` afterward. Production should be back to its pre-Task-12a empty state.
- R-4 and R-8 (both BLOCKING, gating Phase 4/7 and Phase 3 respectively per RISKS.md) can now be considered **closed against production**, not just against the local simulator — this was the actual gap the earlier Task 12 review flagged.

### Follow-up tasks created
- Task 12a criterion 4 (Hostinger upload/DNS/HTTPS + live booking verification) remains open, blocked on hosting credentials — same as Task 11's outstanding item. No new task needed; it's the same piece of work tracked in both places.

## Task 11 — Deployment: Convex production + Hostinger static hosting

**Date completed:** 2026-09-16
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** replaces a self-authored entry with the same "Reviewed by" claim before review. Its criterion 1/2 checkmarks are corrected below; criteria 3/4 were already honestly left unchecked, which is the right call and consistent with how Task 10 handled its own device-dependent criteria — noted here as a positive pattern worth repeating.

### Acceptance criteria check
- [~] Criterion 1 — "`https://badmintul.com` loads the production build over HTTPS." **Not met, and the checkbox overclaims it.** Only the Convex side (`npx convex deploy` to `frugal-vole-549`) is done; nothing is hosted at `badmintul.com` — Hostinger upload never happened (no FTP/hosting credentials in this environment, per the deviations note). This is the acceptance criterion the task is named for; it should be unchecked, not `[x]`.
- [x] Criterion 2 — verified. `app/.env.production` correctly points at the production Convex URL/site URL and is distinct from dev's `.env.local`. Minor gap: `.env.production` is **not** covered by `app/.gitignore`'s `*.local` rule (it doesn't match the glob), so it would be tracked by git if this repo is ever initialized. Not a secrets leak today (no deploy key in the file, only public URLs), but worth an explicit `.gitignore` rule before it becomes one by habit.
- [ ] Criterion 3 — correctly left unchecked: no production booking write is possible without a live site.
- [ ] Criterion 4 — correctly left unchecked: Hostinger upload/domain/HTTPS steps are not yet repeatable because they haven't been run once.

### Scope boundary check
- Stayed inside declared IN/OUT: yes, given the task's IN scope explicitly includes the Hostinger upload step, and that step is honestly reported as not done rather than silently skipped.
- Out-of-scope work done anyway: none.

### Deviations / notes
This is a genuine external-access blocker (Hostinger credentials), not a quality gap — appropriately not fabricated. Per RISKS.md R-1 and R-7 (both BLOCKING specifically for Phase 6, i.e. this task), neither risk can be marked closed until the actual static upload + domain/HTTPS + CORS verification happens. Task 12a already captures the remaining Hostinger work; this task's own checkbox for criterion 1 should not have read "done."

### Follow-up tasks created
None new — covered by Task 12a. Recommend also adding `.env.production` to `.gitignore` (or renaming/handling it the same way as `.env.local`) as a small housekeeping fix before Task 11 is revisited.

## Task 10 — PWA: manifest, service worker, installability

**Date completed:** 2026-09-16
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** replaces a self-authored entry ("Reviewed by: Claude Code / human" before review took place); content is confirmed accurate on independent check, see below.

### Acceptance criteria check
- [x] Criterion 1 — verified by reading `vite.config.ts`: `VitePWA` manifest has `theme_color: '#7c3aed'`, `background_color: '#fafafa'` (both match SPEC.md §2 tokens), `display: 'standalone'`, and 192×192/512×512 icons; confirmed `dist/manifest.webmanifest` is emitted by `npm run build`.
- [ ] Criterion 2 — correctly left unchecked; Android install/standalone-launch needs a real device, not verifiable here.
- [ ] Criterion 3 — correctly left unchecked; iOS install needs a real device, same reasoning, consistent with R-5's guidance to document platform gaps rather than guess.
- [x] Criterion 4 — verified: `workbox.globPatterns` covers `**/*.{js,css,html,svg,png,ico}`, and `dist/sw.js` + `dist/workbox-*.js` are present after build (confirmed directly in this review).

### Scope boundary check
- Stayed inside declared IN/OUT: yes. No offline mutation queueing was added, matching the OUT boundary.
- Out-of-scope work done anyway: none.

### Deviations / notes
`pwa.test.ts` only string-matches the config source and confirms the two SVG icon files contain `<svg`, so it's build-config verification, not a real installability test — that's the correct level of automated coverage given device testing isn't available, and the entry doesn't overclaim it as more. This task's honesty about what can't be verified here (criteria 2/3 correctly unchecked) is the standard the Task 2, 11, and 12 self-reviews should have matched.

### Follow-up tasks created
None — Android/iOS install verification remains a manual step to do before Phase 5 is called complete, per RISKS.md R-5.

## Task 9 — Public landing page

**Date completed:** 2026-09-16
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** replaces a self-authored entry claiming "npm test... pass" and "Reviewed by: Claude Code / human." **Neither was true at review time — this is the most serious finding in this pass.**

### Acceptance criteria check
- [x] Criterion 1 — verified: `App.tsx` routes `path === '/'` to `Landing`, unauthenticated users see it (no auth gate on that branch).
- [x] Criterion 2 — verified: `Landing.tsx` uses `bg-brand-bg`, `text-brand-primary`, `text-brand-accent`, `from-brand-primary to-brand-accent` — the SPEC.md §2 tokens, light background, no dark mode.
- [x] **Criterion 3 — FIXED 2026-09-17 (Task 9a).** `Landing.tsx`'s nav now has a `href="/login"` link ("Masuk") alongside the existing `/signup` CTA. `npx vitest run src/lib/landing.test.ts` passes (2/2), full `npm test` passes (10 files, 21 tests), and `npm run build` is clean. Originally FAIL — see history below.
- [x] Criterion 4 — verified: layout uses `sm:`/`md:` breakpoint classes throughout (grid, padding, text sizing), mobile-first by default.

### Scope boundary check
- Stayed inside declared IN/OUT: yes on scope (one page, no CMS/blog).
- Out-of-scope work done anyway: none.

### Deviations / notes
This is a real, currently-failing bug, not a platform limitation — it belongs in the same category as the illustrative Task 8 example in this file's worked template ("this is a bug, not an acceptable deviation"). A player has no way to reach `/login` from the landing page's UI at all (only a generic `/signup` CTA in the nav and hero, and one more `/signup` CTA in the venue-owner section) — the login path is only reachable by typing the URL directly. This also means the self-review's "Reviewed by: Claude Code / human" was written without anyone actually running the test suite, which is the same process failure flagged in the Task 2 review.

### Follow-up tasks created
- ~~Task 9a (new, insert before Task 10 in TASKS.md): Add a working `/login` link to `Landing.tsx`.~~ **Done 2026-09-17** — see criterion 3 above.

## Task 8 — Player: booking flow (with double-booking prevention)

**Date completed:** 2026-09-16
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** replaces a self-authored entry (unreviewed "Reviewed by" claim, same process issue as elsewhere). Content independently checked against `app/convex/bookings.ts` and `src/lib/bookings.test.ts` and found accurate — this is the strongest-verified task in the set.

### Acceptance criteria check
- [x] Criterion 1 — verified via code + reactivity architecture: `getCourtAvailability` is a plain Convex `query`, so any component subscribed to it (e.g. `PlayerBrowsePanel`) re-renders automatically when `createBooking` inserts a row, no manual refetch needed.
- [x] **Criterion 2 — this is the R-4-critical one, and it genuinely holds.** Read `convex/bookings.ts`: `createBooking` does its conflict `ctx.db.query(...).first()` check and the `ctx.db.insert(...)` in the same handler body, inside one mutation — Convex mutations are transactional, so there's no read-then-write race window. `bookings.test.ts` fires `Promise.allSettled` on two `createBooking` calls for the identical slot and asserts exactly one fulfills and one rejects — re-ran this test directly in this review (`npx vitest run src/lib/bookings.test.ts`), it passes. This is real evidence, not just a plausible-looking mutation.
- [x] Criterion 3 — `listMyBookings` filters by the authenticated player and returns `status`; `PlayerBrowsePanel` renders it.
- [x] Criterion 4 — `cancelBooking` enforces `CANCELLATION_WINDOW_MS = 2h`, patches status to `cancelled`; `getCourtAvailability`'s query already filters `status === "confirmed"`, so a cancelled slot naturally reappears as open on the next reactive read — no separate re-fetch logic needed (this avoids the exact bug the worked example at the top of this file describes for a hypothetical Task 8).
- [x] Criterion 5 — `cancelBooking` checks `booking.playerId !== playerId` server-side; the test asserts a different player's cancel attempt throws `"does not belong"`.

### Scope boundary check
- Stayed inside declared IN/OUT: yes. No payment step, no booking-edit flow.
- Out-of-scope work done anyway: none, *relative to this task's own diff* — though see the Task 2 review for the broader finding that Tasks 2–12 all landed in one undifferentiated pass with no per-task gating.

### Deviations / notes
None beyond what's noted above. This is the one task in the set where the self-authored claims and the actual code/tests line up.

### Follow-up tasks created
None.

## Task 7 — Player: browse venues & view availability

**Date completed:** 2026-09-16
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** replaces a self-authored entry (unreviewed "Reviewed by" claim). Content checked against `convex/venues.ts`, `convex/bookings.ts`, `PlayerBrowsePanel.tsx`, and `browse.test.ts`.

### Acceptance criteria check
- [x] Criterion 1 — verified: `listApprovedVenues` queries `by_approvalStatus == "approved"`. `browse.test.ts` inserts a pending venue, confirms it's excluded, patches it to approved, confirms it then appears — real negative + positive coverage, re-ran and passing.
- [x] Criterion 2 — `getApprovedVenue` returns the venue plus its courts; `getCourtAvailability` reads confirmed bookings for the chosen court/day range via the `by_court_and_start` index. Covered by a real test with seeded booking data, not just source-string matching.
- [x] Criterion 3 — `availability` in `PlayerBrowsePanel.tsx` is a `useQuery(api.bookings.getCourtAvailability, ...)`, which re-runs automatically on the underlying table's changes — consistent with Task 8's booking-creation path.

### Scope boundary check
- Stayed inside declared IN/OUT: yes. No search/filter/wishlist UI added.
- Out-of-scope work done anyway: none within this task's own diff.

### Deviations / notes
The availability UI (`PlayerBrowsePanel`) only shows "today," hardcoded via `new Date()` at render time, rather than a date picker — TASKS.md's acceptance criteria don't require date navigation for Task 7, so this is in-bounds, but note it as a real UX gap once Task 8's booking flow is exercised for future dates (the 14 rendered hourly slots are always "today's" slots, 08:00–21:00 server-local time, not WIB-aware — SPEC.md §5 assumes single-timezone WIB, and this code uses the browser's local time zone via `Date`/`toLocaleTimeString`, which is only equivalent to WIB if the browser itself is in WIB. Worth a follow-up if this is ever tested from a non-WIB machine/browser.)

### Follow-up tasks created
- **Advisory, not blocking:** confirm timezone handling assumes browser-local == WIB and is intentional, or make it explicit (e.g., format in Asia/Jakarta explicitly) — currently implicit and untested.

## Task 6 — Superadmin: approval queue & platform view

**Date completed:** 2026-09-16
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** replaces a self-authored entry (unreviewed "Reviewed by" claim). Content checked against `convex/admin.ts`, `SuperadminPanel.tsx`, `admin.test.ts`.

### Acceptance criteria check
- [x] Criterion 1 — `SuperadminPanel` renders only `if (isAuthenticated && user?.role === 'superadmin')`, a distinct component from `VenueOwnerPanel`/`PlayerBrowsePanel`. Note: all four role panels (`AuthPanel`, `VenueOwnerPanel`, `SuperadminPanel`, `PlayerBrowsePanel`) are currently rendered unconditionally, stacked, on the single `Home` page (`Home.tsx`) rather than on distinct routes — each self-hides via its own role check, so the *access* boundary is real, but this isn't yet the "distinct dashboard" URL/routing structure SPEC.md §4.3 and §4.7 imply ("log in to a distinct dashboard view" / role-based routing). Functionally gated correctly; not yet architected as separate routes. Flagging as a scope note for Task 4/6 taken together, not a blocking defect.
- [x] Criterion 2 — `listPendingVenues` filters `by_approvalStatus == "pending"`; test confirms a submitted venue appears.
- [x] Criterion 3 — `setVenueApproval` patches status; `admin.test.ts` confirms the venue leaves the pending list after approval.
- [x] Criterion 4 — `getMetrics` computes venue counts by status, total bookings, total players directly from live Convex queries — no hardcoded numbers.
- [x] Criterion 5 — verified server-side: `admin.test.ts` and `hardening.test.ts` both assert a player calling `listPendingVenues`/`getMetrics` gets `"Superadmin role required"`. UI also `skip`s these queries for non-admins (`SuperadminPanel.tsx:8-9`) — both layers covered, satisfying CLAUDE.md's review checklist item 2.

### Scope boundary check
- Stayed inside declared IN/OUT: yes. No suspend/ban, no configurable settings UI.
- Out-of-scope work done anyway: none within this task's own diff.

### Deviations / notes
Superadmin seeding is genuinely manual only (no public path) — correct per spec — but there is **no actual seed script or documented dashboard procedure in the repo**, despite the self-review's Task 4 entry (see below) claiming this is "recorded." A future person picking this up has to reverse-engineer "insert a `users` row with `role: 'superadmin'`" from this REVIEW.md file rather than from a runnable script or written runbook.

### Follow-up tasks created
- Write an actual superadmin-seeding script (or a short runbook in `README.md`/`TASKS.md`) rather than leaving it only as a REVIEW.md note — low effort, meaningfully reduces R-6 (bus-factor) risk.

## Task 5 — Venue owner: venue & court creation

**Date completed:** 2026-09-16
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** replaces a self-authored entry (unreviewed "Reviewed by" claim). Content checked against `convex/venues.ts`, `VenueOwnerPanel.tsx`, `venues.test.ts`. This is R-8's gating task (BLOCKING per RISKS.md) — reviewed with extra scrutiny per CLAUDE.md's non-negotiables.

### Acceptance criteria check
- [x] Criterion 1 — `createVenueWithCourts` inserts with `approvalStatus: "pending"`; `VenueOwnerPanel` lists `listMyVenues` results and renders "Pending approval" for pending status.
- [x] Criterion 2 — verified two ways: the mutation always sets `"pending"` on creation (no path to auto-approve), and `listApprovedVenues`/`getApprovedVenue` (the only venue reads the player surface uses) filter on `approvalStatus === "approved"` — a pending venue is structurally unreachable from player queries, not just hidden in the UI.
- [x] Criterion 3 — verified server-side, not just client-form validation: `createVenueWithCourts` calls `validateText` on name/address/court name/hours and rejects non-positive prices and empty court arrays, all inside the mutation handler.
- [x] **Criterion 4 — this is the R-8 check, confirmed real.** `getMyVenue` throws `"does not belong to the current owner"` if `venue.ownerId !== ownerId`. `venues.test.ts` creates a venue as owner B, then attempts to read it as owner A via `getMyVenue`, and asserts the rejection — re-ran this test directly (`npx vitest run src/lib/venues.test.ts`), passes. `listMyVenues` similarly scopes by `by_ownerId` server-side, never trusting a client-supplied owner id. This satisfies R-8's explicit mitigation ("filter by the authenticated user's owned venue IDs server-side... never rely on the client") and CLAUDE.md's non-negotiable on this exact pattern.

### Scope boundary check
- Stayed inside declared IN/OUT: yes. No approved-venue editing, no payment fields.
- Out-of-scope work done anyway: none within this task's own diff.

### Deviations / notes
The venue submission form only collects one court with hardcoded default operating hours (08:00–22:00); multi-court submission isn't exposed in the UI even though the mutation accepts an array. TASKS.md's OUT scope explicitly allows this ("v1 UI only needs to handle it without crashing, not optimize for it") — acceptable as-is.

### Follow-up tasks created
None — R-8 is genuinely closed for this task's scope (re-verification against production is Task 12a's job, see that entry).

## Task 4 — Auth & role-based access

**Date completed:** 2026-09-16
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** replaces a self-authored entry (unreviewed "Reviewed by" claim). This is R-3's gating task (BLOCKING per RISKS.md, "must be resolved before building role-based routing on top of it") — reviewed with extra scrutiny.

### Acceptance criteria check
- [x] Criterion 1 — `auth.ts`'s `Password` provider profile maps signup params to `role: "player" | "venueOwner"`, persisted via `authTables`/`users` schema; `AuthPanel.tsx` exposes a role `<select>` on the sign-up form only.
- [x] Criterion 2 — verified: `auth.ts`'s profile function does `params.role === "venueOwner" ? "venueOwner" : "player"` — there is no code path where a public signup can produce `role: "superadmin"`. `auth.test.ts` asserts the source doesn't contain a superadmin-granting branch.
- [x] Criterion 3 — real server-side test: `auth.test.ts` calls `roles.getVenueOwnerArea` as a seeded player identity and asserts it throws `"Venue owner role required"` — this is an actual rejected Convex call, not a UI-only assumption, satisfying CLAUDE.md's review checklist item 2.
- [x] **Criterion 4 — FIXED 2026-09-17.** R-3's decision is now recorded in `RISKS.md` itself (not just here): Convex Auth confirmed as the choice, with the evidence for "cleanly supports custom role claims" and the reasoning against switching to Clerk written into R-3's entry, and R-3's status flipped from BLOCKING to RESOLVED. Originally FAIL — see history below for what was wrong before the fix.

### Scope boundary check
- Stayed inside declared IN/OUT: yes on scope (no password reset/email verification/social login added).
- Out-of-scope work done anyway: none within this task's own diff — but see Task 2's review for the finding that Tasks 3–12 all landed together with no per-task human/Claude Code gate in between, which is exactly the scenario R-3's "decide early, don't re-litigate mid-build" guidance was meant to prevent.

### Deviations / notes
Convex Auth is self-reported as beta by its own package (`@convex-dev/auth@0.0.95`); that alone isn't disqualifying, and the retroactive evaluation now recorded in `RISKS.md` R-3 concludes it's an acceptable choice given the working role-claim evidence already in the test suite. The standing caveat, also recorded in R-3, is that this was a post-hoc validation of a choice already made rather than a true up-front comparison — worth re-checking if Convex Auth has a breaking change before Task 11.

### Follow-up tasks created
- ~~R-3 follow-up: update `RISKS.md` R-3 with the actual evaluation outcome.~~ **Done 2026-09-17** — see `RISKS.md` R-3.

## Task 3 — Data model: users, roles, venues, courts, bookings

**Date completed:** 2026-09-16
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** replaces a self-authored entry (unreviewed "Reviewed by" claim); content independently checked against `convex/schema.ts` directly and found accurate.

### Acceptance criteria check
- [x] Criterion 1 — verified by reading `convex/schema.ts`: `users`, `venues`, `courts`, `bookings` all use `defineTable` with explicit `v.*` validators; no `v.any()` anywhere in the file (also asserted by `schema.test.ts`).
- [x] Criterion 2 — `venues.approvalStatus: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))`.
- [x] Criterion 3 — `bookings.status: v.union(v.literal("confirmed"), v.literal("cancelled"))`.
- [x] Criterion 4 — `venues.ownerId: v.id("users")`, `courts.venueId: v.id("venues")`, `bookings.courtId: v.id("courts")`, `bookings.playerId: v.id("users")` — all proper ID references, no denormalized strings.
- [x] Criterion 5 — `npm run build` (which runs `tsc -b`, type-checking against the generated Convex API) passes cleanly in this review; no schema validation errors surfaced.

### Scope boundary check
- Stayed inside declared IN/OUT **for what this file itself contains**: yes — the schema has no payment fields (correctly respecting SPEC.md's non-goal), and the file adds no UI or auth-enforcement logic itself.
- Out-of-scope work done anyway: not in this file, but see the Task 2 review — by the time this schema landed, `auth.ts`, `venues.ts`, `admin.ts`, and `bookings.ts` (Tasks 4–8's actual logic) were already present in the same pass, so "Task 3 done in isolation" doesn't reflect how the work actually happened even though the schema file itself is scoped correctly.

### Deviations / notes
The existing Task 2 `connectionChecks` table remains in the schema so the connection smoke test continues to work. `npm test` and `npm run build` pass.

### Follow-up tasks created (if any)
None.

## Task 18 — Form submission states

**Date completed:** 2026-09-17
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** replaces a self-authored entry (unreviewed "Reviewed by" claim). Independently confirmed in `AuthPanel.tsx` (`isSubmitting`), `VenueOwnerPanel.tsx` (`isSubmitting`), `SuperadminPanel.tsx` (`pendingAction`, shared across approve/reject so a second click can't fire mid-flight), and `PlayerBrowsePanel.tsx` (`pendingBooking`) — all four disable their control and show a distinct pending label during the `await`. Criteria as stated hold.

### Acceptance criteria check
- [x] Criterion 1 — auth, venue submission, approval/rejection, and booking controls disable during their awaited mutation calls.
- [x] Criterion 2 — each action displays a distinct pending label: `Submitting…`, `Approving…`, `Rejecting…`, or `Booking…`.
- [x] Criterion 3 — tests and build pass.

### Scope boundary check
- Stayed inside declared IN/OUT: yes. No optimistic UI was added and Convex mutation logic was unchanged.
- Out-of-scope work done anyway: none.

### Deviations / notes
Approval controls share one pending state so a second approval/rejection cannot be fired while the first is in flight.

### Follow-up tasks created (if any)
None.

## Task 17 — Shared UI primitives

**Date completed:** 2026-09-17
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** replaces a self-authored entry (unreviewed "Reviewed by" claim). Independently read `Button.tsx`, `TextField.tsx`, `FormField.tsx`, `Card.tsx`, `Select.tsx` — real focus-visible styling, real `<label htmlFor>` via `FormField`, real disabled-state styling on `Button`. Criteria as stated hold. `Card` is used by `VenueOwnerPanel`/`PlayerBrowsePanel`; `SuperadminPanel` was confirmed to also use `Card` by the time of this review (post Task 20), so the note below about it being deferred is now resolved.

### Acceptance criteria check
- [x] Criterion 1 — targeted panel controls now use shared styled text fields/selects/buttons with borders, padding, focus rings, and responsive token colors.
- [x] Criterion 2 — every targeted input/select has a real label associated by `id`/`htmlFor` through `FormField`.
- [x] Criterion 3 — `Button` supports primary, secondary, and danger variants plus visible disabled styling.
- [x] Criterion 4 — UI-only refactor; Convex calls were not changed. Tests and build pass.

### Scope boundary check
- Stayed inside declared IN/OUT: yes. No new tokens or component-library dependency added.
- Out-of-scope work done anyway: none.

### Deviations / notes
`Card` is used by the venue-owner and player panels; the superadmin panel remains structurally unchanged for Task 20’s dashboard-state pass.

### Follow-up tasks created (if any)
None.

## Task 16 — Hostinger deploy runbook & CORS checklist

**Date completed:** 2026-09-17
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** replaces a self-authored entry (unreviewed "Reviewed by" claim). Independently confirmed `DEPLOY.md` exists at repo root with the numbered build/upload/CORS/pre-flight steps described below, including the `Select-String` checks for the production vs. dev Convex URL. Criteria as stated hold.

### Acceptance criteria check
- [x] Criterion 1 — root `DEPLOY.md` contains numbered production build, Hostinger public-root upload, HTTPS, and verification steps.
- [x] Criterion 2 — the runbook documents `npx convex dashboard --prod`, the production origin `https://badmintul.com`, and the current app’s lack of custom HTTP-action CORS handlers.
- [x] Criterion 3 — the runbook includes `Select-String` checks that require the production Convex URL and reject the dev URL before upload.

### Scope boundary check
- Stayed inside declared IN/OUT: yes. Documentation and tests only; no FTP, DNS, HTTPS, or live-site changes were attempted.
- Out-of-scope work done anyway: none.

### Deviations / notes
The exact dashboard labels for an allowed-origin field can vary by Convex Auth integration; the runbook directs the operator to the production dashboard and records that this app has no custom HTTP action requiring CORS headers. `npm test` and `npm run build` pass.

### Follow-up tasks created (if any)
None.

## Task 15 — Timezone-explicit booking availability

**Date completed:** 2026-09-17
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** replaces a self-authored entry (unreviewed "Reviewed by" claim). Criteria 1–3 as stated are accurate — but there's a scope gap the self-review didn't catch.

### Acceptance criteria check
- [x] Criterion 1 — verified: `wib.ts`'s `wibDayStartMs` uses `Intl.DateTimeFormat` with `timeZone: 'Asia/Jakarta'` to extract the WIB calendar date, then computes the UTC-ms boundary via `Date.UTC(...) - WIB_OFFSET_MS` — correct regardless of the executing browser/environment's own timezone.
- [~] **Criterion 2 — mostly true, one real gap.** `PlayerBrowsePanel`'s availability grid does use `formatWibTime` (WIB-explicit) and labels the section "Availability (Asia/Jakarta)" — genuinely fixed. But the same file's "My bookings" list, two lines below, still renders `new Date(booking.startTime).toLocaleString()` — implicit browser-local formatting, the exact pattern this task exists to eliminate, just in a spot the task's own scope note (PlayerBrowsePanel) covers but the implementation missed. Minor in isolation, but it's the same bug class the task was written to close, in the same file, in the same task's diff.
- [x] Criterion 3 — `npm test`/`npm run build` pass; `convex/bookings.ts` unchanged.

### Scope boundary check
- Stayed inside declared IN/OUT: yes on the WIB-vs-multi-timezone boundary (no picker added).
- Out-of-scope work done anyway: none.

### Deviations / notes
The availability grid remains today-plus-navigable (Task 19 added the date nav on top of this task's WIB math).

### Follow-up tasks created
- **Task 15a (new, appended to `TASKS.md`):** Apply `formatWibTime`/explicit `Asia/Jakarta` formatting to the "My bookings" timestamp list in `PlayerBrowsePanel`, not just the availability grid — currently the only remaining browser-local-time display in this file.

## Task 14 — Superadmin seeding script + runbook

**Date completed:** 2026-09-17
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** replaces a self-authored entry (unreviewed "Reviewed by" claim). Content independently checked against `convex/admin.ts` and found accurate.

### Acceptance criteria check
- [x] Criterion 1 — verified: `promoteUserToSuperadmin` uses `internalMutation` (not `mutation`), lowercases/trims the email, finds the matching user, throws `"No user found for ${email}"` if none exists, otherwise patches `role: "superadmin"`.
- [x] Criterion 2 — verified: `grep`-checked `src/` for any import of `promoteUserToSuperadmin` or reference via `api.admin.*` — none found; it's only reachable via `internal.admin.promoteUserToSuperadmin`, which the client bundle cannot call.
- [x] Criterion 3 — `app/README.md` documents the dev/prod `npx convex run` invocations.
- [x] Criterion 4 — `npm test`/`npm run build` pass; the function's own test exercises both the success and missing-user-throws paths via `convex-test`.

### Scope boundary check
- Stayed inside declared IN/OUT: yes. No public promotion path, no UI added.
- Out-of-scope work done anyway: none.

### Deviations / notes
None.

### Follow-up tasks created
None.

## Task 13 — Role-based dashboard routing

**Date completed:** 2026-09-17
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** replaces a self-authored entry with an unreviewed "Reviewed by: Claude Code / human" claim. Criteria 1–5 as stated are genuinely true and independently verified below — but a real gap exists that the self-review didn't catch and no test covers.

### Acceptance criteria check
- [x] Criterion 1 — verified: `App.tsx` routes `/player` → `<RoleDashboard role="player"><PlayerBrowsePanel /></RoleDashboard>`, same pattern for `/venue-owner` and `/admin`. `RoleDashboard.tsx` renders only its `children` once role matches.
- [x] Criterion 2 — verified: `RoleDashboard`'s effect calls `window.location.replace('/login')` when unauthenticated, `window.location.replace('/')` when `user.role !== role`.
- [x] Criterion 3 — verified: `AuthPanel.tsx`'s effect watches `isAuthenticated`/`user` and replaces to `/venue-owner`, `/admin`, or `/player` based on the persisted role once auth resolves.
- [x] Criterion 4 — verified via `git diff --stat app/convex/` for the whole Phase 8/9 batch: this task touched no Convex files.
- [x] Criterion 5 — `npm test` (40/40) and `npm run build` both pass on the full working tree.

**Gap found (not in the self-review, not covered by `routing.test.ts`):** `App.tsx`'s fallback branch (anything that isn't `/`, `/login`, `/player`, `/venue-owner`, or `/admin` — which includes `/signup`, the route `Landing.tsx`'s "Booking Sekarang"/"Daftarkan venue" CTAs actually link to) still renders `Home.tsx`. `Home.tsx` was **not touched by this task** and still contains: (a) the Task 1/2 scaffold placeholder markup ("Phase 1 scaffold — Vite + React + TypeScript + Tailwind, ready for Convex and real screens", a "Tailwind pipeline check" div, a "Test query + mutation" button wired to `connection.recordCheck`) — dead UI that should have been removed once real screens existed, and (b) `AuthPanel` stacked directly above `VenueOwnerPanel`, `SuperadminPanel`, and `PlayerBrowsePanel` all rendered unconditionally — the exact "everything stacked on one page, self-hiding by role" pattern this task exists to eliminate. `routing.test.ts` only string-matches `App.tsx`/`RoleDashboard.tsx`/`AuthPanel.tsx` source and never reads `Home.tsx`, so this was invisible to the test suite. Practically: today a new visitor clicking "Daftarkan venue" (→ `/signup`) sees the scaffold placeholder junk and, immediately below the actual signup form, three more panels that call `useQuery`/render conditionally and correctly hide themselves for an unauthenticated visitor — so the *visible* damage right now is mostly the leftover scaffold text and the dead "Test query + mutation" button, not full panel leakage. But it's exactly the kind of debt this task was scoped to remove, and it's a regression waiting to surface (e.g., an authenticated venue owner who navigates back to `/signup` would see their own `VenueOwnerPanel` rendered a second time, disconnected from `/venue-owner`).

### Scope boundary check
- Stayed inside declared IN/OUT: yes for what was touched (`App.tsx`, `RoleDashboard.tsx`, `AuthPanel.tsx`) — but the task's actual goal ("give each role a real, distinct dashboard URL... currently stacked on the single Home page") was left incompletely done because `Home.tsx` itself was never revisited.
- Out-of-scope work done anyway: none.

### Deviations / notes
The app continues using its lightweight pathname routing instead of adding a router dependency — reasonable, consistent with `TASKS.md`'s own suggestion.

### Follow-up tasks created
- **Task 13a (new, appended to `TASKS.md`):** Clean up `Home.tsx` — remove the dead Task 1/2 scaffold placeholder markup and the four stacked panels, leaving only `AuthPanel` (this is what should render at `/login` and `/signup`, which is the entirety of what `Home.tsx` is used for now that Task 13 exists).
## Task 19 — Booking availability: real calendar/grid layout

**Date completed:** 2026-09-17
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** replaces a self-authored entry (unreviewed "Reviewed by" claim). Independently confirmed in `PlayerBrowsePanel.tsx`: a `grid-cols-1 sm:grid-cols-2` layout with success/danger-tinted cells, a legend row, and Previous/Next day buttons bounded to `[0, 3]` days ahead. `convex/bookings.ts` confirmed unchanged in this batch's diff. Criteria as stated hold.

### Acceptance criteria check
- [x] Criterion 1 — `PlayerBrowsePanel` now renders availability in a responsive two-column grid with distinct `brand-success` open and `brand-danger` booked states.
- [x] Criterion 2 — players can move from today through the next three days with Previous day and Next day controls.
- [x] Criterion 3 — booking still calls `api.bookings.createBooking`; `convex/bookings.ts` was unchanged.
- [x] Criterion 4 — `npm test` and `npm run build` pass (36 tests across 17 files).

### Scope boundary check
Stayed inside the declared scope: yes. No multi-court comparison or week/month calendar was added.

### Deviations / notes
Date arithmetic and displayed dates continue to use the explicit `Asia/Jakarta` timezone from Task 15. Previous day is disabled at today and forward navigation is limited to three days ahead.

### Follow-up tasks created (if any)
None.
## Task 20 — Dashboard list states: loading, empty, and layout consistency

**Date completed:** 2026-09-17
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** replaces a self-authored entry (unreviewed "Reviewed by" claim). Independently confirmed real `role="status"` loading placeholders (not literal `'…'`) and empty states with specific CTAs ("Submit your first venue" linking to the form via `#venue-submission`, "Browse venues to book a court", "Return to the home page") across all three panels, all wrapped in `Card`. Criteria as stated hold.

### Acceptance criteria check
- [x] Criterion 1 — venue, approval queue, approved-venue, metrics, and booking queries now show explicit loading states instead of `'…'` or blank output.
- [x] Criterion 2 — empty states include relevant actions or guidance: submit a first venue, return home while no venues are approved, browse venues for a booking, and review the approval queue later.
- [x] Criterion 3 — `VenueOwnerPanel`, `SuperadminPanel`, and `PlayerBrowsePanel` all use the shared `Card` primitive.
- [x] Criterion 4 — `npm test` and `npm run build` pass (38 tests across 18 files).

### Scope boundary check
Stayed inside the declared scope: yes. No pagination or data-access changes were added.

### Deviations / notes
Loading blocks use lightweight animated placeholders with `role="status"`; the underlying Convex queries and mutations remain unchanged.

### Follow-up tasks created (if any)
None.
## Task 21 — Accessibility & responsive audit

**Date completed:** 2026-09-17
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** replaces a self-authored entry (unreviewed "Reviewed by" claim). This is the one entry in this batch whose numeric claims I independently recomputed rather than just reading: contrast ratios for `brand-accent` (#0e7490), `brand-success` (#15803d), and `brand-warning` (#b45309) against white, using the WCAG relative-luminance formula by hand. Results: accent ≈5.36:1, success ≈5.02:1, warning ≈5.02:1, primary (#7c3aed, unchanged) ≈5.70:1, danger (#dc2626, unchanged) ≈4.83:1 — all clear AA (4.5:1) for normal text, danger the closest margin. The self-review's contrast claims hold up under independent recomputation, not just re-reading.

### Audit findings and fixes
- Keyboard focus: `Button` retains a visible `focus-visible` outline, form controls retain focus rings, and a global `a:focus-visible` rule now covers navigation and CTA links.
- Contrast: actual semantic text colors were checked against white/light surfaces. `brand-primary` remains #7c3aed; `brand-accent`, `brand-success`, and `brand-warning` were darkened to #0e7490, #15803d, and #b45309 respectively. These combinations meet WCAG AA for normal text; danger text remains #dc2626.
- Responsive layout: dashboard cards use full-width/max-width constraints, player grids collapse to one column at narrow widths, and the admin approval row now wraps long venue names and action buttons to prevent horizontal overflow at 375px.

### Acceptance criteria check
- [x] Criterion 1 — interactive controls retain keyboard focus indicators; an acceptance test covers button focus and narrow approval-row wrapping.
- [x] Criterion 2 — brand semantic text combinations used on light surfaces were checked and failing light shades were fixed.
- [x] Criterion 3 — dashboard layouts were checked for 375px behavior and narrow-content wrapping; no intentional horizontal overflow remains.
- [x] Criterion 4 — findings and fixes are recorded here; `npm test` and `npm run build` pass (40 tests across 19 files).

### Scope boundary check
Stayed inside the declared audit scope: yes. No WCAG CI integration or unrelated feature work was added.

### Follow-up tasks created (if any)
None.
## Task 13a — Clean up stale `Home.tsx`

**Date completed:** 2026-09-17
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review" rather than self-certifying — matches the process CLAUDE.md/TASKS.md actually call for, a real improvement over earlier batches. Independently verified via `git diff` (not just re-reading the self-report).

### Acceptance criteria check
- [x] Criterion 1 — confirmed via `git diff app/src/pages/Home.tsx`: `connection.getStatus`/`recordCheck` imports and calls, the "Phase 1 scaffold" text, "Tailwind pipeline check" div, and "Test query + mutation" button are all removed.
- [x] Criterion 2 — `Home.tsx` is now 9 lines, rendering only `<AuthPanel initialMode={authMode} />` inside a centered `<main>`.
- [x] Criterion 3 — `App.tsx` routing to `Home` for `/login`/`/signup` is unchanged, so both routes now show only the auth form. Also independently confirmed via `grep` that `VenueOwnerPanel`/`SuperadminPanel`/`PlayerBrowsePanel` no longer appear anywhere in `Home.tsx`.
- [x] Criterion 4 — `npm test` (42/42 across 21 files) and `npm run build` both re-run and pass in this review.

### Scope boundary check
- Stayed inside declared IN/OUT: yes — diff touches only `Home.tsx` plus its new test file.
- Out-of-scope work done anyway: none. `git diff --stat app/convex/` confirms zero Convex changes.

### Deviations / notes
`home-cleanup.test.ts` is a string-match test (same style as most of this project's tests) but it asserts both presence of the fix and absence of the removed panels/scaffold text, so it would genuinely catch a regression, not just confirm intent.

### Follow-up tasks created
None.

## Task 15a — WIB-format the "My bookings" timestamp list

**Date completed:** 2026-09-17
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review" rather than self-certifying. Independently verified via `git diff`.

### Acceptance criteria check
- [x] Criterion 1 — confirmed via `git diff app/src/components/PlayerBrowsePanel.tsx`: the one-line change replaces `{new Date(booking.startTime).toLocaleString()}` with `{formatWibTime(booking.startTime)} WIB`, reusing the same `wib.ts` helper already used by the availability grid — consistent with the rest of the file rather than introducing a second formatting approach.
- [x] Criterion 2 — `npm test` (42/42) and `npm run build` both re-run and pass in this review.

### Scope boundary check
- Stayed inside declared IN/OUT: yes — a one-line change plus its test file. `git diff --stat app/convex/` confirms zero Convex changes.
- Out-of-scope work done anyway: none.

### Deviations / notes
None.

### Follow-up tasks created
None.

## Task 22 — Fix stuck sign-out on a stale authenticated session

**Date completed:** 2026-09-18
**Implemented by:** Codex (initial attempt, uncommitted and not logged as a task) + Claude Code (correction)
**Reviewed by:** Claude Code

**Context:** The user reported this bug directly: while trying to log in as a newly-promoted superadmin, they kept landing on `/login`, which showed only a "Sign out" button that didn't appear to do anything when clicked. They asked Codex to fix it directly; Codex left an uncommitted change rather than logging a task, which is what triggered this review.

### What Codex's first attempt got wrong
The uncommitted diff changed `onClick={() => void signOut()}` to a new `signOutAndReturnToLogin()` that called `void signOut().catch(() => undefined)` **without awaiting it**, immediately followed by `window.location.replace('/')`. Reading `@convex-dev/auth`'s actual implementation (`node_modules/@convex-dev/auth/dist/react/client.js:164-174`) shows `signOut()` awaits a server round-trip (`client.authenticatedCall("auth:signOut")`) *before* erasing the local token. A full-page navigation (`window.location.replace`) typically aborts in-flight requests. So firing `signOut()` and navigating away in the same tick, without waiting, risks the sign-out network call being aborted before the local token is ever cleared — meaning the fix could make the "stuck" bug intermittently worse (a session that looks signed out but isn't) rather than fixing it. This was not caught by Codex's own test (`signout.test.ts`), which only string-matched that `void signOut().catch` and the redirect were present — it asserted the buggy pattern's existence, not its correctness.

### Fix applied (by Claude Code, in `AuthPanel.tsx`)
- `signOutAndReturnToLogin` is now `async` and does `await signOut()` (wrapped in try/catch, matching the library's own error-swallowing behavior) **before** calling `window.location.replace('/')` — the local token is guaranteed cleared before navigation.
- Added an `isSigningOut` state that disables the button and shows "Signing out…" while in flight, matching the loading-state pattern used everywhere else in the app (Task 18).
- Updated `signout.test.ts` to assert the awaited pattern (`async function signOutAndReturnToLogin()`, `await signOut()`, explicitly asserting `void signOut()` is *absent*) and the new pending-state behavior.

### Acceptance criteria check
- [x] Criterion 1 — verified by reading the final `AuthPanel.tsx`: `await signOut()` runs to completion before `window.location.replace('/')`.
- [x] Criterion 2 — verified: button is `disabled={isSigningOut}` and shows "Signing out…" during the call.
- [x] Criterion 3 — `npm test` (44/44 across 22 files) and `npm run build` both pass.

### Scope boundary check
- Stayed inside declared IN/OUT: yes — only `AuthPanel.tsx` and its test changed.
- Out-of-scope work done anyway: none. Did not attempt to diagnose *why* a stale/mismatched-role session can be reached in the first place (a Convex Auth session-lifecycle question) — flagged below as worth watching, not fixed here.

### Deviations / notes
This does not fully close the loop on root cause: it's still not confirmed *why* the user had an authenticated-but-wrong-role session in the browser in the first place (most likely: they signed up/logged in before running the superadmin promotion, and the old session persisted). The fix makes sign-out actually reliable, which is the direct unblock the user needed, but if stale sessions showing the wrong dashboard keep recurring, that's worth a dedicated investigation rather than repeated sign-out patches.

Process note: Codex worked on this without logging a task in `TASKS.md` first, and left it uncommitted rather than flagging it — caught here only because the user mentioned asking for it. Worth reinforcing the existing process (log a task, or at minimum flag it) for direct bug-fix requests, not just planned `TASKS.md` work.

### Follow-up tasks created
- **Advisory, not blocking:** if a user reports landing on a dashboard/login route with an unexpectedly stale role again, investigate whether Convex Auth sessions need an explicit invalidation step after a superadmin promotion (Task 14's `promoteUserToSuperadmin`), rather than relying on the promoted user to notice and sign out themselves.
## Task 23 — Court availability blocking (maintenance slots)

**Date completed:** 2026-09-18
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review." Independently verified against `convex/venues.ts`, `convex/bookings.ts`, `convex/schema.ts`, and `court-blocks.test.ts`.

### Acceptance criteria check
- [x] Criterion 1 — verified: `requireOwnedCourt` walks court → venue → `ownerId`, same pattern as `getMyVenue`'s R-8 check. `court-blocks.test.ts` proves cross-owner block creation *and* removal both reject with "does not belong."
- [x] Criterion 2 — verified: `createCourtBlock` queries for an overlapping confirmed booking before inserting and throws if found.
- [x] **Criterion 3 — this is the R-4-adjacent one, and it genuinely holds.** Read `bookings.ts`'s `createBooking`: the existing booking-conflict check and the new `courtBlocks` overlap check both happen as reads inside the same mutation handler, before the single `ctx.db.insert`, so Convex's transactional guarantee covers both — no new read-then-write race window was introduced. `court-blocks.test.ts` proves a booking into a blocked slot is rejected.
- [x] Criterion 4 — verified in `PlayerBrowsePanel.tsx`: a `getCourtBlocks` query feeds a third grid state ("Blocked", `brand-warning` styling) distinct from "Booked" (`brand-danger`) and "Book" (open, `brand-success`).
- [x] Criterion 5 — `npm test` (52/52 across 26 files, re-run in this review) and `npm run build` pass.

### Scope boundary check
- Stayed inside declared IN/OUT: yes. Single time-range blocks only.
- Out-of-scope work done anyway: none.

### Deviations / notes
None.

### Follow-up tasks created
None.
## Task 24 — Venue owner: bookings view

**Date completed:** 2026-09-18
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review." Independently verified against `bookings.ts`'s `listBookingsForMyVenues`/`getOwnedVenueCourts` and `venue-operations.test.ts`.

### Acceptance criteria check
- [x] Criterion 1 — verified: `getOwnedVenueCourts` (shared with Task 25) derives the caller's venues via `by_ownerId`, then their courts via `by_venueId` — no client-supplied id anywhere in the path. `venue-operations.test.ts` seeds two owners' bookings and confirms owner A's query returns exactly the one booking belonging to A's court.
- [x] Criterion 2 — verified: the query takes `args: {}`, nothing else — scoping is entirely server-derived from the authenticated identity.
- [x] Criterion 3 — `npm test` (52/52, re-run) and `npm run build` pass.

### Scope boundary check
- Stayed inside declared IN/OUT boundaries: yes. The view is read-only with no owner-side booking modification or filtering UI.
- Out-of-scope work done anyway: none.

### Deviations / notes
Booking display includes venue name, court name, explicit WIB-formatted time, and status.

### Follow-up tasks created (if any)
None.

## Task 25 — Venue owner: revenue/utilization stats

**Date completed:** 2026-09-18
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review." Independently verified against `bookings.ts`'s `getMyVenueStats` and `venue-operations.test.ts`.

### Acceptance criteria check
- [x] Criterion 1 — verified: aggregates over `getOwnedVenueCourts` (owner-scoped), summing `court.pricePerHour` per confirmed booking for revenue, and a 7-day booked-hours/open-hours ratio for utilization. `VenueOwnerPanel.tsx` renders both per venue.
- [x] Criterion 2 — **independently recomputed, not just re-read.** The test seeds 3 confirmed bookings at IDR 250/hour each on one venue; 3 × 250 = 750, matching the test's asserted `revenue: 750` exactly. Re-ran `venue-operations.test.ts` directly — passes.
- [x] Criterion 3 — `npm test` (52/52, re-run) and `npm run build` pass.

### Scope boundary check
- Stayed inside declared IN/OUT boundaries: yes. No charting library, date-range picker, or historical report was added.
- Out-of-scope work done anyway: none.

### Deviations / notes
Utilization is a seven-day snapshot using each court's configured daily operating-hours window as the denominator.

### Follow-up tasks created (if any)
None.
## Task 26 — Superadmin: suspend a venue or user

**Date completed:** 2026-09-18
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review." The Convex-layer enforcement is solid and independently verified — but this review found a real, unaddressed consequence of that enforcement: **a suspended user's dashboard crashes to a blank screen instead of showing any message**, because nothing in the React layer accounts for the new error path this task introduced.

### Acceptance criteria check
- [x] Criterion 1 — verified: `venues.suspended: v.optional(v.boolean())` added; `setVenueSuspended` is superadmin-gated; `listApprovedVenues` and `getApprovedVenue` both filter `suspended !== true`. `suspension.test.ts` proves a venue disappears on suspend and reappears on unsuspend.
- [x] Criterion 2 — verified: `users.suspended` added; every role-check helper (`requirePlayer`/`requireVenueOwner`/`requireSuperadmin` in `bookings.ts`, `venues.ts`, `admin.ts`, plus `roles.ts`'s `getUserOrThrow`) now throws `"User account is suspended"` when `user.suspended === true`. `suspension.test.ts` proves a suspended player's `listMyBookings` call is rejected even with a still-valid identity — this is real enforcement of a live session, not just blocking new logins.
- [x] Criterion 3 — verified: a player attempting `setUserSuspended` is rejected with `"Superadmin role required"`.
- [x] Criterion 4 — `npm test` (52/52, re-run) and `npm run build` pass.

**Gap found (not in the self-review, not covered by any test):** every dashboard panel (`PlayerBrowsePanel`, `VenueOwnerPanel`, `SuperadminPanel`) fires its role-scoped queries unconditionally for any user matching the route's role — e.g. `PlayerBrowsePanel.tsx`: `useQuery(api.bookings.listMyBookings, user?.role === 'player' ? {} : 'skip')`. None of them check `user.suspended` before firing. Traced what happens when they don't skip: Convex's `useQuery` (confirmed by reading `node_modules/convex/dist/esm/react/client.js:462-465`) **re-throws synchronously** if the query result is an `Error` — `if (result instanceof Error) { throw result; }`. This app has **no `ErrorBoundary` anywhere** (confirmed via `grep -rn "ErrorBoundary" src/` — no matches). So a suspended player visiting `/player`, a suspended venue owner visiting `/venue-owner`, or a suspended superadmin visiting `/admin` will hit an uncaught render-time exception with nothing to catch it — the practical result is a blank/broken screen, not a "your account is suspended" message. `RoleDashboard.tsx` (the shared wrapper for all three routes) only checks `user.role !== role`, never `user.suspended`, so it doesn't prevent this either. This is exactly the scenario this project's own review standard exists to catch — enforcement that's correct at the data layer but produces an unhandled crash at the UI layer, invisible to `convex-test`-only test coverage since none of it exercises the React render path.

### Scope boundary check
- Stayed inside declared IN/OUT: yes for the Convex-layer work — suspension is a boolean toggle, no audit log/appeal flow.
- Out-of-scope work done anyway: none. The crash gap wasn't caused by out-of-scope work; it's an interaction the task's IN scope didn't account for (the task brief only specified backend enforcement + the two Convex-level tests, not the React consequence of that enforcement).

### Deviations / notes
Authorization helpers remain per-file (not consolidated into one shared helper) — Codex flagged this choice explicitly rather than silently picking one, which is the right call to surface, not a defect.

### Follow-up tasks created
- **Task 26a (new, appended to `TASKS.md`):** Fix the suspended-user crash. Recommended approach: add the suspension check once in `RoleDashboard.tsx` (which already fetches `user` via `api.roles.getCurrentUser` and gates on role) rather than patching three separate panels' query conditions — if `user.suspended === true`, show a clear "Your account has been suspended" message instead of rendering `children`, before any role-scoped query fires. This is a single-point fix consistent with `RoleDashboard`'s existing job of gating access before its children ever mount.
## Task 26a — Fix suspended-user dashboard crash

**Date completed:** 2026-09-18
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review." Independently verified against `RoleDashboard.tsx` and re-ran the full suite.

### Acceptance criteria check
- [x] Criterion 1 — verified: `if (user.suspended === true) return <main>...Your account has been suspended...</main>`, placed exactly as recommended.
- [x] Criterion 2 — verified this is a genuine fix, not cosmetic: the suspension check is an early `return` before the `children`-rendering branch, so `PlayerBrowsePanel`/`VenueOwnerPanel`/`SuperadminPanel` never mount for a suspended user, and their role-scoped queries (`listMyBookings`, `listMyVenues`, etc. — the ones that now throw for a suspended user per Task 26) never fire. Also confirmed *why* this is safe: `RoleDashboard`'s own `useQuery(api.roles.getCurrentUser)` call reads `roles.ts`'s `getCurrentUser`, which does **not** check suspension (`return userId ? await ctx.db.get(userId) : null` — no `getUserOrThrow`) — so `RoleDashboard` itself can never crash reading `user.suspended`, closing the loop cleanly.
- [x] Criterion 3 — verified: the suspension check sits after the existing loading/auth/role-mismatch checks, doesn't alter their logic. Role-mismatch for a suspended user (e.g., a suspended player hitting `/admin`) still correctly hits the role-mismatch branch first, not the suspension message — this is right, since a wrong-role visitor shouldn't learn about someone else's suspension status via a role check they're not even authorized to attempt.
- [x] Criterion 4 — `npm test` (53/53, re-run) and `npm run build` pass. `git diff --stat app/convex/` confirms zero Convex changes, matching the task's OUT scope.

### Scope boundary check
- Stayed inside declared IN/OUT: yes — single-file fix, no panel-level changes.
- Out-of-scope work done anyway: none.

### Deviations / notes
None. This closes Phase 10 — no known open code-fixable defects remain across the project as of this review; only the external blockers (Hostinger credentials, physical-device PWA testing) noted throughout prior reviews.

### Follow-up tasks created
None.

## Task 27 — Fix broken Convex Auth HTTP wiring (critical)

**Date completed:** 2026-09-18
**Implemented by:** Claude Code
**Reviewed by:** Claude Code (found and fixed in the same session — this is genuinely self-reviewed since it was discovered live while dogfooding, not implemented against a pre-written task brief; the fix is small, mechanical, and independently verified against a real browser session, which is stronger evidence than most `Reviewed by` entries in this file)

### What was found
Asked to improve the app's UI/UX and make sure `demo@example.com`/`demo1234` works, I seeded the demo account and then actually clicked through the login flow in a real browser for the first time in this project's history. It never redirected after login — stuck on `/login` showing only a "Sign out" button. Browser console showed a repeating `WebSocket reconnected ... due to AuthProviderDiscoveryFailed` loop.

Traced the root cause: `@convex-dev/auth` requires a `convex/http.ts` file registering `auth.addHttpRoutes(http)` to serve the JWKS discovery endpoint and auth HTTP callbacks. **This file has never existed in the codebase**, going all the way back to Task 4. The dev deployment also only had `JWT_PRIVATE_KEY` set, missing its required companion `JWKS` and `SITE_URL` env vars.

**Why 53 passing tests never caught this:** every single auth-related test in this project — Tasks 4, 5, 6, 7, 8, 12a, 22, 23, 24, 26, 26a — uses `convex-test`'s `t.withIdentity({subject: ...})`, which injects a fake identity directly into the query/mutation context and completely bypasses real JWT issuance, signing, and discovery. Task 12a's "production verification" used the same shortcut (`--identity` on the Convex CLI). Nobody — not Codex, not any of my prior reviews — ever exercised a real `signIn()` call through an actual browser session before this. The entire auth system was untested at the one layer that matters for a real user.

### Fix applied
1. Added `convex/http.ts` with `auth.addHttpRoutes(http)`.
2. Ran `npx @convex-dev/auth --web-server-url http://localhost:5173` — set `SITE_URL` on the dev deployment.
3. The tool detected `JWT_PRIVATE_KEY` already existed and skipped key generation, but `JWKS` was never set (an inconsistent state) — unset `JWT_PRIVATE_KEY` and reran so a matched `JWT_PRIVATE_KEY`/`JWKS` pair was generated together.
4. `npx convex dev --once` to push `http.ts` live.
5. **Verified live, end-to-end, in an actual browser** (not `convex-test`): cleared stale localStorage tokens (left over from before the key rotation), signed in at `/login` with `demo@example.com`/`demo1234`, confirmed a clean redirect to `/admin` rendering the real superadmin dashboard, and confirmed the console's reconnect-loop errors were gone after the fix (present before, absent after — direct before/after comparison).

### Acceptance criteria check
- [x] Criterion 1 — `convex/http.ts` exists, registers `auth.addHttpRoutes(http)`.
- [x] Criterion 2 — dev deployment's `SITE_URL`/`JWT_PRIVATE_KEY`/`JWKS` all set and consistent; confirmed via `npx convex env get` for each and a clean browser console after the fix.
- [x] Criterion 3 — real sign-in verified live in a real browser, redirecting correctly to `/admin`.
- [x] Criterion 4 — `npm test` (53/53) and `npm run build` pass. This fix adds no new test coverage for the class of bug it fixes — flagged explicitly as a gap below.

### Scope boundary check
- Stayed inside declared IN/OUT: yes — one new file, deployment env var configuration, no application logic changed.
- Out-of-scope work done anyway: none, but see the "still needed" note in `TASKS.md` Task 27 — production is almost certainly in the same broken state and hasn't been fixed yet, since this session only touched the dev deployment.

### Deviations / notes
This is the single most consequential finding of the whole project so far: every previous "Complete" phase status in `ROADMAP.md` that depended on auth working (Phases 1, 2, 3, 4, 7) was true *at the Convex-function level* but the actual product — a person opening the site and logging in — has been broken since Task 4. This wasn't caught earlier because CLAUDE.md's review process (which this file has followed rigorously) checks acceptance criteria against `convex-test`/CLI evidence, and nobody had a reason to open an actual browser until asked to today. Worth internalizing as a process lesson: **`convex-test`/`--identity` proves the authorization logic is correct once a session exists; it does not prove a session can ever be created.** Both need real coverage.

### Follow-up tasks created
- Carried in `TASKS.md` Task 27's own text: verify/fix the same issue on production before trusting Task 11/12a, and consider adding a test that exercises real token issuance (not `withIdentity()`).
## Task 27 follow-up — Verify/fix production auth

**Date completed:** 2026-09-18
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly left the unverifiable criterion unchecked rather than claiming it was done — good practice. Independently re-verified the three checked criteria directly against production, not just by re-reading the report.

### Acceptance criteria check
- [x] Production `SITE_URL` is set to `https://badmintul.com` — confirmed via `npx convex env get SITE_URL --prod`.
- [x] Production `JWKS`/`JWT_PRIVATE_KEY` are a matched pair — confirmed two ways: `npx convex env get JWKS --prod` returns a key, and independently `curl https://frugal-vole-549.convex.site/.well-known/jwks.json` returns the **exact same key material live over HTTPS**, proving the discovery endpoint is actually serving it, not just that the env var exists.
- [x] `convex/http.ts` deployed to `frugal-vole-549` — confirmed by the above: the endpoint wouldn't exist at all without it being deployed.
- [ ] Real browser sign-in against production — correctly still unverified, blocked on Hostinger as stated. I did not attempt to work around this (e.g., by pointing a local build at the prod Convex URL) since the task didn't ask for it and Hostinger access is the actual gating dependency for a true end-to-end check.
- [x] `npm test`/`npm run build` pass, re-confirmed in this review (60/60 across 31 files, after Tasks 28–31 landed on top of this).

### Scope boundary check
- Stayed inside declared IN/OUT: yes — deployment/env config only, no code changes in this piece.
- Out-of-scope work done anyway: none.

### Deviations / notes
This closes the config-level risk from Task 27 for production. The one remaining gap (real browser sign-in against `badmintul.com`) is a Hostinger-access blocker, not a code or config gap — consistent with every other Hostinger-dependent item already tracked in `ROADMAP.md`.

### Follow-up tasks created
None new — the live-verification gap is already tracked as part of Task 11/12a's Hostinger dependency.
## Task 28 — Persistent app shell for authenticated routes

**Date completed:** 2026-09-18
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review." Independently verified live in a real browser (not just by reading code) — this was the priority fix for the confirmed dead end from dogfooding, so it got the most scrutiny in this batch. Criteria 1–5 as stated are true, but live testing surfaced one real, reproducible bug not covered by the source-string test.

### Acceptance criteria check
- [x] Criterion 1 — verified live: signed in as `demo@example.com`, landed on `/admin`, and a "Sign out" button was visible and clickable in the header at all times — a complete reversal of the pre-Task-28 state where `read_page` on `/admin` returned zero interactive elements.
- [x] Criterion 2 — verified live: header showed a "Superadmin" badge.
- [x] Criterion 3 — verified in code: `href={roleRoutes[role]}` on the wordmark.
- [x] Criterion 4 — verified in code: `RoleDashboard.tsx`'s suspended branch wraps its message in `<AppShell role={role}>`, so sign-out stays reachable.
- [x] Criterion 5 — `npm test` (60/60, re-run) and `npm run build` pass.

**Bug found in live testing (not caught by `app-shell.test.ts`, which only string-matches source):** clicking Sign out lands on `/login`, not `/` as `AppShell.tsx`'s `signOutAndReturnHome` intends. Root cause: `RoleDashboard.tsx` has its own effect watching `isAuthenticated` that fires `window.location.replace('/login')` whenever it goes false — including the moment `signOut()` itself causes that transition, since `RoleDashboard` is still mounted around `AppShell` at that instant. This races against `AppShell`'s own explicit `window.location.replace('/')` after the same `signOut()` call resolves. In live testing, `RoleDashboard`'s redirect won and the browser ended up at `/login`. Not a dead end (the user can still log back in from there) and not a crash, but it's a real, reproducible deviation from the intended destination, and confusing: the last action was "Sign out," and landing back on a login form reads as if sign-out failed even though it didn't.

### Scope boundary check
- Stayed inside declared IN/OUT: yes — single new component, no sidebar/notifications added.
- Out-of-scope work done anyway: none.

### Deviations / notes
None beyond the race condition above.

### Follow-up tasks created
- **Task 28a (new, appended to `TASKS.md`):** Fix the sign-out destination race. Recommended approach: don't rely on two independent components each calling `window.location.replace` off the same auth-state transition — either have `AppShell` navigate first and have `RoleDashboard`'s effect check a flag/skip redirecting during an in-progress sign-out, or centralize post-sign-out navigation in one place only.
## Task 29 — Branded, clearer auth screens

**Date completed:** 2026-09-18
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review." Verified live in a real browser — this is the single biggest visual improvement in the whole project: `/login` went from a bare unstyled form floating in empty gray space to a properly branded page.

### Acceptance criteria check
- [x] Criterion 1 — verified live: `/login` shows a "badmintul." wordmark and a working "Kembali ke beranda" link back to `/`.
- [x] Criterion 2 — verified live: on `/login`, "Log in" renders filled/primary while "Sign up" renders outlined/secondary — immediately obvious which tab is active, a real fix over the prior identical-looking tabs.
- [x] Criterion 3 — verified live: the form sits in a sensible content area below the header, not centered alone in a mostly-empty viewport.
- [x] Criterion 4 — `npm test` (60/60, re-run) and `npm run build` pass.

### Scope boundary check
- Stayed inside declared IN/OUT boundaries: yes. Only auth-screen chrome and tab presentation changed; fields and auth calls were untouched.
- Out-of-scope work done anyway: none.

### Deviations / notes
none.

### Follow-up tasks created (if any)
None.
## Task 30 — Post-login/post-logout transition feedback

**Date completed:** 2026-09-18
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review." Verified in code and live: `AuthPanel.tsx` checks `isRedirecting` *before* the `isAuthenticated` "Sign out" branch, so the confusing flash I originally found (login succeeds → briefly shows an unrelated "Sign out" button → then the dashboard) is genuinely fixed, not just reordered cosmetically.

### Acceptance criteria check
- [x] Criterion 1 — verified: `submit()` calls `setIsRedirecting(true)` immediately after a successful `signIn()`, and the `isRedirecting` render branch is checked ahead of the `isAuthenticated` branch, so "Redirecting to your dashboard…" is what's shown, not the old "Sign out" flash.
- [x] Criterion 2 — verified: `AppShell`'s `isSigningOut` is set before `await signOut()` and only used to control the button label/disabled state, which remains rendered until the subsequent `window.location.replace` actually navigates away.
- [x] Criterion 3 — `npm test` (60/60, re-run) and `npm run build` pass.

### Scope boundary check
- Stayed inside declared IN/OUT boundaries: yes. Only copy/state feedback was added; no router or transition animation was introduced.
- Out-of-scope work done anyway: none.

### Deviations / notes
none.

### Follow-up tasks created (if any)
None.
## Task 31 — Dashboard layout pass

**Date completed:** 2026-09-18
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review." Verified live and via `git diff --stat app/convex/`.

### Acceptance criteria check
- [x] Criterion 1 — verified live: `/admin` now shows dashboard content flowing naturally below the header at a sensible width, not a small floating card centered in an empty page.
- [x] Criterion 2 — verified: `git diff --stat app/convex/` for this whole batch (Task 27 follow-up through 31) shows zero file changes — only deployment env vars were touched for Task 27, which is expected and outside this criterion's scope.
- [x] Criterion 3 — `npm test` (60/60, re-run) and `npm run build` pass.

### Scope boundary check
- Stayed inside declared IN/OUT boundaries: yes. The change is limited to the `RoleDashboard` outer layout and its acceptance test.
- Out-of-scope work done anyway: none.

### Deviations / notes
The shell and suspended-user gate remain shared wrappers; panel internals were left unchanged.

### Follow-up tasks created (if any)
None.
