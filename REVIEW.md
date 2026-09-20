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
## Task 28a — Fix sign-out landing on `/login` instead of `/`

**Date completed:** 2026-09-18
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review." The task's own acceptance criterion explicitly warned that a race condition "may not reproduce every single time — confirm it's actually fixed, not just working once," so a single pass wasn't enough — I stress-tested it with three full login/sign-out cycles in a real browser.

### How it works
`auth-navigation.ts` exports a module-level mutable flag (`signOutInProgress`) and a setter (`markSignOutInProgress`). `AppShell.tsx` calls the setter synchronously, before `await signOut()` — so by the time `isAuthenticated` later flips to `false` and triggers a re-render, the flag is already `true`. `RoleDashboard.tsx`'s effect now checks `if (signOutInProgress || ...) return` first, so it no longer fires its own `window.location.replace('/login')` during a sign-out-caused auth transition, leaving `AppShell`'s explicit `window.location.replace('/')` as the only navigation that happens.

### Acceptance criteria check
- [x] **Criterion 1 — independently verified with 3 full login → sign-out cycles in a real browser, not just one.** Signed in as `demo@example.com`, clicked Sign out, landed on `/`. Repeated two more times from a fresh `/login` load each time. All three landed on `/`, zero landed on `/login`. The fix is genuinely deterministic, not just working by luck on the first try.
- [x] Criterion 2 — verified in code: the unauthenticated-visitor and role-mismatch branches in `RoleDashboard.tsx`'s effect are unchanged; only the top-level `signOutInProgress ||` guard was added.
- [x] Criterion 3 — `npm test` (61/61, re-run) and `npm run build` pass.

### Scope boundary check
- Stayed inside declared IN/OUT: yes.
- Out-of-scope work done anyway: none.

### Deviations / notes
The fix relies on an unreset module-level flag, which Codex's own note flags honestly: it "resets on a full page load, so it cannot suppress future unrelated auth redirects." This is safe *today* because the app's entire navigation model is full-page `window.location.replace` calls (no client-side router) — every sign-out forces a real page load, which reinitializes the module and clears the flag automatically. This is a fragile assumption baked into the fix, not a bug: if this codebase ever migrates to client-side routing (e.g., adopting a router in a future task) without revisiting this flag, `signOutInProgress` could get stuck `true` and silently disable `RoleDashboard`'s legitimate unauthenticated/role-mismatch redirects for the rest of that session. Flagging as forward-looking technical debt, not something to fix now — correct trade-off for the current architecture, worth a comment in the code or a note here for whoever touches routing next.

### Follow-up tasks created
None now — the technical-debt note above is not actionable until/unless a routing migration is ever proposed; recorded here so it isn't rediscovered from scratch at that point.
## Process note on Tasks 32–41 (Phases 12–13)

**This entire batch — two new phases, ten tasks, all planned and implemented in one pass — was self-authored by Codex, not assigned by a human or by Claude Code's planning role, per the user: "i accidentally asked codex to plan phases and tasks to work on visual."** Per `CLAUDE.md`, planning phases/tasks is Claude Code's role and Codex is the implementer; per `TASKS.md`'s own global rules, tasks are meant to be done "in order," with a `REVIEW.md` entry filled out "before moving to the next task" — ten tasks landing at once, unreviewed between each, is the same batching pattern flagged as a process violation back in the Task 2 review (which covered Tasks 1–12 landing in one undifferentiated pass). Codex did keep the good habit of marking every entry "Pending independent review" rather than self-certifying, and the task briefs it wrote for itself are reasonably well-scoped (clear IN/OUT boundaries, sensible ordering, honest constraints like "no invented legal claims"). On the merits, I'm accepting this plan rather than discarding it — see below — but flagging the process gap explicitly: this needs review checkpoints between tasks, not just a well-written review log after the fact.

**Technical verdict:** solid work overall — design tokens are implemented with correct Tailwind v4 syntax, the layout rollout is consistent, the SEO/footer/trust content is honest and responsible (no fabricated legal text, no invented testimonials/ratings). One real quality problem: **Task 33's entire 12-component library is unused dead code** — see that task's entry below. One minor scalability note on Task 39. One cosmetic bug (a misplaced import) found and fixed directly. All 82 tests pass, build is clean, verified live in a browser (title/metadata updates correctly per route, footer links resolve, placeholder policy pages render honestly, no horizontal overflow at desktop width).

## Task 32 — Commercial design tokens

**Date completed:** 2026-09-18
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review." Independently verified against `index.css`.

### Acceptance criteria check
- [x] Criterion 1 — verified: `@theme` block adds `--color-surface*`, `--color-border-*`, `--color-content-muted`, `--color-focus-ring`, `--color-status-*`, `--spacing-*`, `--text-*` (with matching `--line-height` pairs, correct Tailwind v4 syntax), `--radius-*`, `--shadow-*`, and `--breakpoint-xs` — all the categories the task brief listed.
- [x] Criterion 2 — verified: `--color-brand-primary`/`accent`/`success`/`warning`/`danger` (the values independently contrast-checked in Task 21's review) are untouched; only the focus-ring outline color changed from `brand-accent` to the new `focus-ring` token, and I confirmed those are the same hex value (`#0e7490`) — a rename, not a visual change.
- [x] Criterion 3 — `npm test` (82/82, re-run) and `npm run build` pass.

### Scope boundary check
- Stayed inside declared IN/OUT: yes — stylesheet only.
- Out-of-scope work done anyway: none.

### Deviations / notes
None.

### Follow-up tasks created
None.
## Task 33 — Shared commercial UI components

**Date completed:** 2026-09-18
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review." The self-review's "Deviations" note says "the new components are available for Tasks 34–41; existing screens are intentionally not migrated in this task" — implying later tasks would consume them. **This did not happen.**

### Acceptance criteria check
- [x] Criterion 1 — verified: all 12 components exist (`Alert.tsx`, `Badge.tsx`, `DataTable.tsx`, `Drawer.tsx`, `EmptyState.tsx`, `Modal.tsx`, `PageHeader.tsx`, `SectionHeader.tsx`, `Skeleton.tsx`, `StatCard.tsx`, `Tabs.tsx`, `Toast.tsx`), each reasonably compact and using the Task 32 tokens (e.g. `Modal.tsx` genuinely handles Escape-to-close and backdrop-click-to-close; `DataTable.tsx` is a real generic table, not a stub).
- [x] Criterion 2 — verified in code: the keyboard/dismissal behaviors claimed are actually implemented, not just tested by string-matching (`Modal`'s `useEffect` registers a real `keydown` listener for Escape).
- [x] Criterion 3 — `npm test` (82/82) and `npm run build` pass.

**Real problem, not caught by the self-review or its own tests:** I ran `grep -rl` across every `.tsx` file in `src/pages/` and `src/components/` for an import of each of these 12 components. **Zero matches for all twelve.** `PageHeader`, `SectionHeader`, `Badge`, `Alert`, `Modal`, `Drawer`, `EmptyState`, `Skeleton`, `Tabs`, `StatCard`, `DataTable`, `Toast` are not used anywhere in the actual application — not in `Landing.tsx`, not in `InfoPage.tsx`, not in any dashboard panel. I then checked whether Tasks 34–41 (which were supposed to consume them, per this task's own note) actually did: they didn't — `Landing.tsx`, `AppShell.tsx`, `RoleDashboard.tsx`, `Home.tsx`, and the shared form controls were all restyled using raw Tailwind utility classes built on the Task 32 tokens directly (`content-container`, `rounded-card`, `border-border-subtle`, etc.), never by importing any of Task 33's components. This is a complete component library built and tested in isolation with **no consumer anywhere in the codebase** — exactly the kind of speculative, premature abstraction this project's own conventions argue against (`CLAUDE.md`: "Don't add features... beyond what the task requires... No half-finished implementations"). It compiles and its own tests pass, so it wasn't caught by `npm test`/`npm run build`, only by actually checking for usage.

### Scope boundary check
- Stayed inside declared IN/OUT: yes, technically — presentation-only, no Convex changes.
- Out-of-scope work done anyway: arguably the inverse problem — in-scope work (12 components) that never got integrated anywhere, making the scope boundary check pass while the actual deliverable (per the task's own goal, "reusable pieces for a coherent product interface") wasn't achieved.

### Deviations / notes
None beyond the dead-code finding above.

### Follow-up tasks created
- **Task 33a (new, appended to `TASKS.md`):** Either wire each of the 12 components into a real screen where it fits, or delete the ones with no near-term consumer. Recommend deletion by default per this project's established anti-premature-abstraction stance, unless a concrete near-term task already needs a specific one (e.g., `Toast` if a future task adds mutation-success notifications, `Modal` if a future task adds a confirm-before-destructive-action flow) — keep only what's about to be used, not what might be useful someday.
## Task 34 — Responsive application layout system

**Date completed:** 2026-09-18
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review." Verified via `git diff` that `content-container` was genuinely applied to `Landing.tsx`, `Home.tsx`, `AppShell.tsx`, and `RoleDashboard.tsx` consistently — this is the task that actually delivered the layout consistency Task 33's unused components were meant to provide, just via utility classes instead.

### Acceptance criteria check
- [x] Criterion 1 — added and applied a shared `content-container` utility to auth, landing, shell, and role-dashboard wrappers.
- [x] Criterion 2 — responsive page padding and full-width container behavior are preserved at 375px, tablet, and desktop widths without introducing fixed narrow dashboard wrappers.
- [x] Criterion 3 — repeated container and dashboard spacing patterns now use the shared utility; tests and build pass (67 tests across 35 files).

### Scope boundary check
- Stayed inside declared IN/OUT boundaries: yes. Layout wrappers and tests changed only; no feature or Convex data-access changes were made.
- Out-of-scope work done anyway: none.

### Deviations / notes
The existing landing sections retain their section-specific vertical rhythm; the shared container now standardizes their horizontal content bounds and the authenticated shell/dashboard flow.

### Follow-up tasks created (if any)
None.
## Task 35 — Commercial visual QA pass

**Date completed:** 2026-09-18
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review" and, per its own "Deviations" note, was honest that this was "code-level responsive and token checks," not full device/browser testing — consistent with what I found. I independently checked live in a browser at desktop width: confirmed `document.documentElement.scrollWidth === clientWidth` (no horizontal overflow) on the landing page. I was not able to complete a live 375px mobile check this session due to browser-automation tooling flakiness (repeated CDP screenshot timeouts unrelated to the app) — this remains an open verification gap, not a known failure.

### Findings and fixes
- Shared cards and controls still used the pre-commercial radius, border, surface, shadow, and focus classes; they now use `rounded-card`, `rounded-control`, `border-border-*`, `bg-surface`, `shadow-card`, and the centralized focus token.
- The landing page retained repeated max-width container markup; its main content sections now use the shared `content-container` utility.
- The authenticated shell header now wraps its role badge and sign-out control safely at narrow widths.

### Acceptance criteria check
- [x] Criterion 1 — shared controls, cards, shell, landing containers, and status treatments use the commercial design system consistently.
- [x] Criterion 2 — the responsive QA contract covers shared containers and narrow shell wrapping; no new fixed-width or overflow-prone layout was introduced.
- [x] Criterion 3 — findings are recorded here and `npm test`/`npm run build` pass (69 tests across 36 files).

### Scope boundary check
- Stayed inside declared IN/OUT boundaries: yes. This was a visual consistency and responsive cleanup; no analytics, copywriting strategy, or workflow feature was added.
- Out-of-scope work done anyway: none.

### Deviations / notes
The QA was performed through code-level responsive and token checks; full device/browser matrix testing remains part of the existing physical-device PWA and production-hosting work.

### Follow-up tasks created (if any)
None.
## Task 36 — Conversion-focused landing hero

**Date completed:** 2026-09-18
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review." Verified live in a browser — hero copy is clearer ("Temukan waktu main yang pas, tanpa drama"), CTAs route to `/signup` correctly, visually polished.

### Acceptance criteria check
- [x] Criterion 1 — the hero now states the product value clearly and presents one primary player CTA plus a distinct venue-owner CTA.
- [x] Criterion 2 — both CTAs route to the existing signup flow; no new backend search or booking behavior was added.
- [x] Criterion 3 — the hero uses responsive grid and CTA classes, with mobile-stacked actions and a compact availability preview.
- [x] Criterion 4 — `npm test` and `npm run build` pass (71 tests across 37 files).

### Scope boundary check
- Stayed inside declared IN/OUT boundaries: yes. The landing hero and its acceptance tests were redesigned; no backend search or booking behavior was added.
- Out-of-scope work done anyway: none.

### Deviations / notes
The existing landing sections were retained but updated to use the commercial tokens introduced in Tasks 32–35 for visual consistency.

### Follow-up tasks created (if any)
None.
## Task 37 — Player and venue-owner value sections

**Date completed:** 2026-09-18
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review." Verified live: both sections describe real, currently-shipped product behavior (live slots, maintenance blocking from Task 23, revenue/utilization from Task 25) — no forward-looking claims about unbuilt features.

### Acceptance criteria check
- [x] Criterion 1 — added a player section explaining live slots, clear selection, and confirmed booking history.
- [x] Criterion 2 — added a venue-owner section explaining submission, maintenance blocking, incoming operations, revenue, and utilization.
- [x] Criterion 3 — both sections have distinct signup CTAs and collapse from two columns to one on small screens.
- [x] Criterion 4 — `npm test` and `npm run build` pass (73 tests across 38 files).

### Scope boundary check
- Stayed inside declared IN/OUT boundaries: yes. Content describes existing product behavior; no unsupported claims, CMS, backend, or new feature was added.
- Out-of-scope work done anyway: none.

### Deviations / notes
none.

### Follow-up tasks created (if any)
None.
## Task 38 — Trust and product proof sections

**Date completed:** 2026-09-18
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review." Verified no fabricated testimonials/ratings/customer counts exist anywhere in `Landing.tsx` — matches the task's own explicit prohibition and the project's honesty standard already established in Task 40's placeholder pages.

### Acceptance criteria check
- [x] Criterion 1 — added factual booking rules and explicit WIB availability guidance.
- [x] Criterion 2 — added venue approval, support, and current coverage messaging without fabricated proof.
- [x] Criterion 3 — trust content uses responsive cards and readable mobile spacing.
- [x] Criterion 4 — `npm test` and `npm run build` pass.

### Scope boundary check
- Stayed inside declared IN/OUT boundaries: yes. No testimonials, ratings, customer counts, or unsupported performance claims were added.
- Out-of-scope work done anyway: none.

### Deviations / notes
none.

### Follow-up tasks created (if any)
None.
## Task 39 — Public venue discovery cards

**Date completed:** 2026-09-18
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review."

### Acceptance criteria check
- [x] Criterion 1 — verified in `convex/venues.ts`'s `listApprovedVenues`: still filters `suspended !== true` (Task 26's enforcement untouched), now also returns `courtCount`, `lowestPrice`, `highestPrice` per venue.
- [x] Criterion 2 — verified live on the landing page.
- [x] Criterion 3 — present in code (loading/empty/error branches exist in `Landing.tsx`).
- [x] Criterion 4 — `npm test` (82/82) and `npm run build` pass.

**Minor scalability note, not blocking:** `listApprovedVenues`'s new price/court-count computation issues one `courts` query per venue in a loop (`Promise.all(venues.map(async (venue) => ...))`) — an N+1 query pattern. Not incorrect, and negligible at this project's current scale (a handful of venues), but this is a shared, player-facing, frequently-called query — worth revisiting with a single indexed query or denormalized fields if the venue count ever grows meaningfully. Not logging a task for this now since it's not a correctness issue and the project has no real usage yet to justify the optimization.

### Scope boundary check
- Stayed inside declared IN/OUT: yes.
- Out-of-scope work done anyway: none.

### Deviations / notes
None beyond the scalability note above.

### Follow-up tasks created
None — advisory only, see note above.
## Task 40 — Footer, support, and policy navigation

**Date completed:** 2026-09-18
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review." Verified live: `/terms`, `/support` (and by extension `/privacy`, `/cancellation`, `/venue-owner-info`) all render via the shared `InfoPage` component with honest "this page is being prepared" placeholder copy — no invented legal text, matching the task's explicit prohibition. Footer links found via `find` resolve to the correct routes registered in `App.tsx`.

### Acceptance criteria check
- [x] Criterion 1 — added responsive footer links for auth, support/contact, terms, privacy, cancellation, and venue-owner information.
- [x] Criterion 2 — all destinations resolve through the SPA router.
- [x] Criterion 3 — unsupported policy content is clearly marked as being prepared; no final legal claims were invented.
- [x] Criterion 4 — footer navigation is labeled for assistive technology and adapts to mobile layouts.
- [x] Criterion 5 — `npm test` and `npm run build` pass.

### Scope boundary check
- Stayed inside declared IN/OUT boundaries: yes. Placeholder pages were created only to make approved navigation destinations resolve.
- Out-of-scope work done anyway: none.

### Deviations / notes
none.

### Follow-up tasks created (if any)
None.
## Task 41 — SEO and social sharing readiness

**Date completed:** 2026-09-18
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review."

### Acceptance criteria check
- [x] Criterion 1 — verified in `index.html`: description, canonical, `og:*`, `twitter:*`, and a JSON-LD `WebSite` block all present.
- [x] Criterion 2 — favicon/PWA icons referenced correctly (unchanged from Task 10).
- [x] Criterion 3 — verified live: authenticated/auth routes get correctly different `<title>` values and (per code inspection) `noindex, nofollow`, and I confirmed the canonical `<link>` tag exists in the static HTML baseline so `App.tsx`'s effect always finds it to update (`querySelector` returns non-null on every route, not just `/`).
- [x] Criterion 4 — verified via `npm run build`'s output HTML; `npm test`/`npm run build` pass.

**Minor inaccuracy, not blocking:** `og:image` points at `pwa-icon-512.svg`. Facebook/LinkedIn and some other platforms' link-preview crawlers don't reliably render SVG `og:image` — they generally expect PNG/JPG. Low priority (no PWA PNG icon currently exists to swap in — would need Task 10 revisited to add one), but worth knowing before relying on social share previews looking right.

### Scope boundary check
- Stayed inside declared IN/OUT: yes.
- Out-of-scope work done anyway: none.

### Deviations / notes
None beyond the `og:image` note above.

### Follow-up tasks created
None — the `og:image` format issue is advisory, not logged as a task since it requires a PNG icon asset that doesn't exist yet (would need to extend Task 10's PWA icon set, not just this task).
## Task 33a — Remove unused Task 33 component library

**Date completed:** 2026-09-18
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review." Independently verified via `git status`/`git diff` — all 12 files genuinely deleted, plus their orphaned test file.

### Acceptance criteria check
- [x] Criterion 1 — verified: `Alert.tsx` through `Toast.tsx` (all 12) removed; `Button`, `Card`, `Select`, `TextField` remain and are used throughout `AppShell.tsx`, `VenueOwnerPanel.tsx`, `SuperadminPanel.tsx`, `AuthPanel.tsx`.
- [x] Criterion 2 — re-ran the same `grep -rl` check from the original finding; retained components now have real usages.
- [x] Criterion 3 — `commercial-ui.test.ts` removed, `ui-library-cleanup.test.ts` added in its place; `npm test` (90/90, re-run) and `npm run build` pass.

### Scope boundary check
- Stayed inside declared IN/OUT boundaries: yes. No feature was added to justify retaining unused abstractions.
- Out-of-scope work done anyway: none.

### Deviations / notes
The retained primitives are the components currently used by authenticated and auth screens; the unused library components can be rebuilt when a concrete feature requires them.

### Follow-up tasks created (if any)
None.
## Task 42 — Sidebar and topbar shell

**Date completed:** 2026-09-19
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review." Verified live in a real browser (logged in as `demo@example.com`) — this is a genuine, substantial visual transformation: a real sidebar with active-link highlighting, a topbar with a breadcrumb-style page title, and a role dropdown. It reads as a modern commercial dashboard now, not a bare panel.

### Acceptance criteria check
- [x] Criterion 1 — verified live: `/admin` renders a left sidebar ("SUPERADMIN" section, "Approval queue"/"Metrics" links) and a topbar.
- [x] Criterion 2 — verified in code: `isNavOpen` state controls a `-translate-x-full`/`translate-x-0` off-canvas sidebar on mobile with an overlay button and explicit close button, `lg:static lg:translate-x-0` forces it persistently visible on desktop regardless of state.
- [x] Criterion 3 — verified: `signOutAndReturnHome` is unchanged from the Task 28a-fixed version (`markSignOutInProgress()` before `await signOut()`), now triggered from inside the user-menu dropdown instead of a bare button; suspended users still get wrapped in `AppShell` per `RoleDashboard.tsx`.
- [x] Criterion 4 — `npm test` (90/90) and `npm run build` pass; `git diff --stat app/convex/` confirms zero changes.

**Real gap found, not caught by any test:** the off-canvas mobile sidebar (`<aside>`) has no `aria-hidden`/`inert` applied when `isNavOpen` is `false`. It's visually off-screen via `transform: translateX(-100%)`, but CSS transforms don't remove an element from the keyboard tab order — a keyboard user on a mobile-width viewport can `Tab` into the invisible sidebar's nav links before ever reaching the visible hamburger button or page content. Not a blocker (the links still work if somehow reached, and sighted mouse/touch users never encounter it), but it's a real accessibility gap for keyboard-only users and the kind of thing Task 45's audit was supposed to catch.

### Scope boundary check
- Stayed inside declared IN/OUT: yes.
- Out-of-scope work done anyway: none.

### Deviations / notes
None beyond the aria-hidden gap above.

### Follow-up tasks created
- **Task 44a (see below, appended to `TASKS.md`):** bundles this finding with Task 44's outside-click gap, since both are shell-dismissal/focus-management issues in the same component.
## Task 43 — Split dashboard panels into navigable sections

**Date completed:** 2026-09-19
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review." This is the task with the most consequential finding in this batch — a real, live-confirmed regression against Task 41's own SEO acceptance criteria.

### Acceptance criteria check
- [x] Criterion 1 — verified live: navigating directly to `/admin/metrics` renders the Metrics content (not the approval queue) with "Metrics" correctly highlighted as the active sidebar link.
- [x] Criterion 2 — verified in code: `VenueOwnerPanel`/`SuperadminPanel` still call the same Convex queries/mutations as before (`listMyVenues`, `listBookingsForMyVenues`, `getMyVenueStats`, `listPendingVenues`, `getMetrics`, `setVenueApproval`), now gated behind `view === '...'` conditional blocks instead of always rendering everything.
- [x] Criterion 3 — verified: every new route is still wrapped in `RoleDashboard`, so auth/role-mismatch/suspension gating applies unchanged.
- [x] Criterion 4 — `npm test` (90/90) and `npm run build` pass; zero Convex changes confirmed.

**Real regression found, not caught by any test — verified live, not just by reading code.** `App.tsx`'s SEO effect (from Task 41) classifies a route as "authenticated" using an exact-match array: `['/player', '/venue-owner', '/admin'].includes(path)`. This task added `/venue-owner/bookings`, `/venue-owner/stats`, and `/admin/metrics` as new real routes, but **never updated that array**. I navigated to `/admin/metrics` as the signed-in `demo@example.com` superadmin and confirmed directly via `document.title` and `document.querySelector('meta[name="robots"]').content`:
- Title reads **"badmintul — Informasi"** (the generic `InfoPage` fallback title) instead of "Dashboard — badmintul".
- `robots` meta reads **`index, follow`** instead of `noindex, nofollow`.

This means a private, authenticated-only superadmin dashboard page is currently telling search engines it's fine to index — the exact failure mode Task 41's own acceptance criterion ("authenticated routes do not expose misleading marketing metadata") exists to prevent. The same bug applies to `/venue-owner/bookings` and `/venue-owner/stats` (same array, same missing entries — confirmed by code inspection; a role-mismatch redirect prevented me from viewing that one live under the superadmin test session, but the routing logic is identical).

**Why the test suite missed this:** `dashboard-routes.test.ts` (Task 43's own test) only asserts that certain path strings appear somewhere in `App.tsx`/`AppShell.tsx` source — it never actually renders the app at `/admin/metrics` and checks the resulting title/meta. `seo.test.ts` (Task 41's test) asserts that the literal string `'noindex, nofollow'` appears somewhere in `App.tsx` — true, but only for the three original routes; the test never checks which specific routes receive it. Both tests would pass regardless of whether the new sub-routes were correctly classified, because neither actually exercises the routing logic end-to-end.

### Scope boundary check
- Stayed inside declared IN/OUT: yes on paper — but the task's own criterion 3 (preserving `RoleDashboard`'s gating) didn't account for a *different* gate (`App.tsx`'s route classification for SEO purposes) that also needed updating when new routes were added.
- Out-of-scope work done anyway: none.

### Deviations / notes
Also worth noting, non-blocking: the "split" is presentational only — `VenueOwnerPanel`/`SuperadminPanel` are unchanged single components with a `view` prop and conditional rendering blocks, not actually decomposed into separate view components. All of a panel's Convex queries still fire regardless of which `view` is active (e.g. visiting `/venue-owner/stats` still subscribes to `listMyVenues` and `listBookingsForMyVenues`, just doesn't render their results). This satisfies the letter of the acceptance criteria (distinct URL, distinct rendered content) but not the full spirit of "splitting into sections" — harmless at this app's scale, but worth knowing if this pattern is extended further.

### Follow-up tasks created
- **Task 43a (new, appended to `TASKS.md`):** Fix the SEO/robots misclassification for the new sub-routes — update `App.tsx`'s route-authentication check to match by prefix (or list every actual route) so `/venue-owner/bookings`, `/venue-owner/stats`, and `/admin/metrics` get the same `noindex, nofollow` and correct dashboard title treatment as their parent routes. This is a launch-relevant correctness bug, not cosmetic — flagging it as the priority follow-up in this batch.
## Task 44 — Topbar user menu

**Date completed:** 2026-09-19
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review." Verified live, not just by reading code — including testing the one behavior the self-review didn't explicitly claim.

### Acceptance criteria check
- [x] Criterion 1 — verified live: the menu opens on click (native `<button>`, so Enter/Space also work for free), closes on Escape (confirmed via the `keydown` listener in `AppShell.tsx`), and sign-out from inside it uses the unchanged Task 28a-safe `signOutAndReturnHome`.
- [x] Criterion 2 — verified: no notification/search/settings UI anywhere in the shell.
- [x] Criterion 3 — `npm test` (90/90) and `npm run build` pass.

**Real gap found, not covered by the acceptance criteria or any test:** the dropdown has **no outside-click dismissal** — only the Escape key closes it. Verified live: opened the menu via `.click()`, then clicked an unrelated `<h1>` element on the same page, and the menu (`[role=menu]`) remained open. For a "modern commercial web-app" dropdown, closing on an outside click is the conventional expectation (this is what the sidebar's own overlay button already correctly does on mobile — the user menu just doesn't have an equivalent). Not a functional blocker — Escape still works, and clicking Sign out or another visible action still works — but it's a real, noticeable rough edge a user would hit immediately.

### Scope boundary check
- Stayed inside declared IN/OUT: yes on what was built; the outside-click gap wasn't an explicit acceptance criterion, so this isn't a criteria failure, just a real usability gap worth closing.
- Out-of-scope work done anyway: none.

### Deviations / notes
None beyond the outside-click gap above.

### Follow-up tasks created
- **Task 44a (new, appended to `TASKS.md`):** Add outside-click dismissal to the user menu, and `aria-hidden`/`inert` to the closed mobile sidebar (Task 42's finding) — bundled together since both are shell dismissal/focus-management gaps in the same component (`AppShell.tsx`).
## Task 45 — Shell visual QA pass

**Date completed:** 2026-09-19
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review." The self-review's own "Deviations" note is honest that "the shell QA is covered by source-level responsive and accessibility contracts" — consistent with what I found: this audit, like most in this project, checks that the right CSS classes exist, not that the app behaves correctly when actually used. That's exactly why it missed both the SEO regression (Task 43's finding) and the off-canvas focusability gap (Task 42's finding) and the outside-click gap (Task 44's finding) — none of those are visible from reading class names in source. Independently confirmed no horizontal overflow on the new shell at desktop width, live.

### Findings and fixes
- Standardized sidebar, mobile toggle, overlay, and user-menu focus states on the existing `focus-ring` token.
- Constrained the user-menu width to the viewport at narrow sizes and retained `min-w-0`/wrapping in the topbar to prevent horizontal overflow.
- Confirmed shell surfaces and text use the existing neutral/brand token combinations already used by the commercial design system.

### Acceptance criteria check
- [x] Criterion 1 — sidebar links, collapse controls, and user-menu controls have native keyboard behavior, accessible state attributes, and visible focus indicators.
- [x] Criterion 2 — new shell combinations use existing tokenized surfaces, text, and focus colors; no failing color was introduced.
- [x] Criterion 3 — narrow-width protections cover 375px, tablet, and desktop layouts through responsive wrapping, minimum-width constraints, and viewport-bounded menu width.
- [x] Criterion 4 — findings and fixes are recorded; `npm test` and `npm run build` pass.

### Scope boundary check
- Stayed inside declared IN/OUT boundaries: yes. This was a shell verification and cleanup pass with no new feature or backend change.
- Out-of-scope work done anyway: none.

### Deviations / notes
The shell QA is covered by source-level responsive and accessibility contracts; interactive behavior remains native button/link behavior for browser keyboard support.

### Follow-up tasks created (if any)
None.
## Tasks 43a and 44a — Dashboard route metadata and shell dismissal follow-ups

**Date completed:** 2026-09-19
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review." Task 43a is a genuinely good fix, with a real test-quality improvement over this project's usual pattern. Task 44a's outside-click fix is also genuinely correct. But **Task 44a's `aria-hidden` fix does not work, and independently makes accessibility worse than before on desktop** — this is the standout finding.

### Acceptance criteria check

**Task 43a:**
- [x] Criterion 1 — verified live: navigated to `/admin/metrics`, confirmed `document.title === 'Dashboard — badmintul'` and `document.querySelector('meta[name="robots"]').content === 'noindex, nofollow'` — the exact regression from the prior review is fixed.
- [x] Criterion 2/3 — genuinely improved test quality: `followup-shell-fixes.test.ts` calls the real `isAuthenticatedRoute`/`getRouteTitle` functions from the new `route-metadata.ts` module with actual path strings and asserts real return values (`expect(isAuthenticatedRoute('/admin/metrics')).toBe(true)`), not just checking that a string exists somewhere in source — this is a direct, welcome response to my prior review calling out that exact gap ("add or update a test that actually renders/simulates each route... not just that certain strings exist somewhere in the file").

**Task 44a:**
- [x] Outside-click dismissal — **verified live and genuinely correct.** Opened the user menu via a real click, dispatched a `pointerdown` on an unrelated `<h1>`, confirmed the menu closed. This is a real fix, not a source-string check pretending to be one.
- [ ] **Closed-sidebar focusability — FAILS live verification, and the underlying approach is broken by construction.** I focused a link inside the `<aside>` directly (`link.focus()`) while `aria-hidden="true"` was set, and `document.activeElement === link` was `true` — **the link remains fully focusable via keyboard despite `aria-hidden`.** This is a known, documented ARIA anti-pattern: `aria-hidden="true"` removes an element from the accessibility tree for screen readers, but does **not** remove its focusable descendants from the tab order — the two are independent mechanisms. The original task brief anticipated this and offered `inert` as the alternative specifically because `inert` (unlike `aria-hidden`) *does* remove elements from the tab order; the fix used only `aria-hidden`, which doesn't solve the problem it was meant to solve.
- [ ] **New regression, more severe than the original bug: the sidebar is now `aria-hidden="true"` at desktop width too.** `isNavOpen` starts `false` and is only ever set `true` by the hamburger button, which is `lg:hidden` — so on any desktop-width viewport, `isNavOpen` never becomes `true`, meaning `aria-hidden={!isNavOpen}` evaluates to `aria-hidden="true"` **permanently**, even though `lg:static lg:translate-x-0` makes the sidebar fully visible and functional there. Verified live at 1536px width: `aside.getAttribute('aria-hidden') === 'true'` while `aside.getBoundingClientRect().width > 0` and `visibility !== 'hidden'` — a real, currently-used, always-visible navigation landmark is hidden from every screen reader user on desktop, all the time. This is worse than the bug it was meant to fix: the original issue only affected keyboard users on a *closed mobile* drawer; this affects *all* screen reader users on the *primary, always-visible* desktop sidebar.
- [x] Escape-close, sidebar overlay-click-close, and sign-out are all unaffected — verified unchanged in the diff.
- [x] `npm test` (92/92) and `npm run build` pass — neither the focusability regression nor the desktop `aria-hidden` regression is caught by any test, since `followup-shell-fixes.test.ts`'s check for this is `expect(shell).toContain('aria-hidden={!isNavOpen}')` — a string-match on the exact broken expression, which "passes" precisely because the broken code is present.

### Scope boundary check
- Stayed inside declared IN/OUT: yes on files touched (`App.tsx`, `AppShell.tsx`, new `route-metadata.ts`).
- Out-of-scope work done anyway: none — but see the new regression above, which is an unintended side effect within the declared scope, not scope creep.

### Deviations / notes
Task 43a's fix and its test are a genuine improvement in this project's testing discipline — worth calling out positively, not just critically. Task 44a's outside-click half is equally solid. The `aria-hidden` half needs to be redone: it requires knowing whether the sidebar is at its "always-visible desktop" breakpoint (e.g., via `matchMedia('(min-width: 1024px)')` or an equivalent resize-aware check) and only applying `aria-hidden`/`inert` when the sidebar is *actually* off-screen (mobile AND closed) — `isNavOpen` alone conflates "mobile drawer state" with "is the sidebar hidden," which are different things once the `lg:` breakpoint always shows it regardless of that state. `inert` should be used instead of `aria-hidden` for the actually-hidden case, per the original task's own suggestion, since only `inert` removes descendants from the tab order.

### Follow-up tasks created
- **Task 44b (new, appended to `TASKS.md`):** Fix the sidebar's hidden-state accessibility for real — condition `aria-hidden`/`inert` on whether the sidebar is genuinely off-screen (mobile viewport AND closed), not on `isNavOpen` alone, and use `inert` rather than `aria-hidden` so focus is actually blocked, not just hidden from the accessibility tree while remaining tabbable. Verify live with `element.focus(); document.activeElement === element` at both mobile and desktop widths, not just a source-string check.
## Task 44b — Sidebar hidden-state accessibility

**Date completed:** 2026-09-19
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review." This is a genuinely correct fix, and the test quality is a real step up — worth calling out as the model for how this class of fix should be tested going forward.

### Acceptance criteria check
- [x] **Criterion 1 — verified live, the severe regression is fixed.** At 1536px width (the same viewport where I previously found `aria-hidden="true"` permanently applied), `document.querySelector('aside').inert` is now `false`. Also re-confirmed the sidebar is still genuinely usable there: `link.focus()` on a sidebar link succeeds (`document.activeElement === link`) — the fix didn't overcorrect into making the desktop sidebar non-interactive.
- [x] Criterion 2 — verified via the exported `shouldInertSidebar(isDesktop, isNavOpen)` pure function and its dedicated test (`sidebar-focus.test.ts`): `shouldInertSidebar(false, false) === true` (mobile, closed → inert), matching the real HTML `inert` attribute now used instead of `aria-hidden` — the mechanism that actually removes descendants from the tab order, per the original task's own correct suggestion.
- [x] Criterion 3 — verified via the same test: `shouldInertSidebar(false, true) === false` (mobile, open → not inert) and `shouldInertSidebar(true, *) === false` (desktop, either state → never inert). Escape/overlay/outside-click/sign-out are untouched in the diff.
- [x] **Criterion 4 — this is the one I want to highlight.** `sidebar-focus.test.ts` tests the actual decision function against all four points in the desktop×open state matrix, with real boolean assertions — not a string-match against implementation text. This is a direct, correct response to my prior review's specific complaint ("a test that actually checks focusability... not a string-match against the exact expression used in the implementation — the prior test... passed precisely because it matched the broken code verbatim"). The old broken assertion in `followup-shell-fixes.test.ts` was also updated rather than left stale.
- [x] Criterion 5 — `npm test` (93/93, re-run) and `npm run build` pass.

### Scope boundary check
- Stayed inside declared IN/OUT: yes — sidebar focus management only.
- Out-of-scope work done anyway: none.

### Deviations / notes
Could not force a true mobile-width viewport live this session (the browser-automation `resize_window` tool didn't take effect, same tooling limitation noted in earlier reviews) — so criterion 2's mobile-closed case is verified via the unit-tested pure function and code inspection rather than a live DOM check at mobile width. Given the pure function is simple, directly tested across its full input domain, and the only thing gating the actual `inert` attribute in the JSX, I'm treating this as sufficient verification rather than a gap — the desktop case (the one with the severe regression) was verified live, which was the priority.

### Follow-up tasks created
None. This closes out Phase 14's known issues — no open code-fixable defects remain in this batch.
## Task 46 — Player My Bookings and cancellation

**Date completed:** 2026-09-19
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review." Independently verified via code inspection and the passing test suite.

### Acceptance criteria check
- [x] Criterion 1 — verified: `/player/bookings` lists bookings with a Cancel button only on `status === 'confirmed'` rows.
- [x] Criterion 2 — verified: `pendingCancellation` disables the button and shows "Cancelling…" during the call; `listMyBookings` is a live query, so status updates reactively with no extra code needed.
- [x] Criterion 3 — verified: `cancellationError` surfaces `caught.message` (e.g., the server's 2-hour-window rejection) via `role="alert"`.
- [x] Criterion 4 — verified in `AppShell.tsx`'s `roleNav.player`.
- [x] Criterion 5 — `npm test` (104/104, re-run) and `npm run build` pass; `git diff --stat app/convex/` for this task alone shows no changes (bookings.ts is untouched by Task 46 specifically — the diff includes admin.ts/venues.ts changes from Tasks 47–49 in the same batch, which is expected).

### Scope boundary check
- Stayed inside declared IN/OUT: yes.
- Out-of-scope work done anyway: none.

### Deviations / notes
None. This is the cleanest task in the batch — no new backend surface, straightforward UI wiring.

### Follow-up tasks created
None.
## Task 47 — Venue owner availability and maintenance management

**Date completed:** 2026-09-19
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review," and its "Deviations" note transparently disclosed the `listMyVenues` shape change rather than hiding it — good practice.

### Acceptance criteria check
- [x] Criterion 1 — verified: block form's court `<Select>` is populated from `venues?.flatMap(v => v.courts...)`, so an owner can only pick from their own courts (also enforced server-side by `requireOwnedCourt` inside `createCourtBlock`, defense in depth). Confirmed the WIB-explicit date math (`new Date(`${blockDate}T${blockStart}:00+07:00`)`), consistent with Task 15's established pattern.
- [x] **Criterion 2 — this is the R-8-style check, confirmed real.** `listBlocksForMyVenues` derives owner → venues → courts → blocks, never trusting a client-supplied id. `court-blocks.test.ts`'s new test creates blocks as two different owners and asserts owner A's query returns only their own block (`toHaveLength(1)`, correct `courtId`) — re-ran this test directly, passes. Real isolation, not just UI hiding.
- [x] Criterion 3 — verified: `blockError` surfaces `caught.message`, including the "existing confirmed booking" rejection from Task 23's unchanged mutation logic.
- [x] Criterion 4 — verified in `AppShell.tsx`.
- [x] Criterion 5 — `npm test` (104/104) and `npm run build` pass.

**Minor gap, not in the original acceptance criteria:** `deleteBlock`'s Remove button has no pending/disabled state — unlike every other mutation-backed control in this project since Task 18 (including the Approve/Reject buttons in this same superadmin panel file). Not a correctness bug (a double-click just produces a harmless "not found" error on the second call), but a real consistency gap worth closing.

### Scope boundary check
- Stayed inside declared IN/OUT: yes — the `listMyVenues` shape addition is a reasonable, disclosed extension needed to populate the court picker, not scope creep.
- Out-of-scope work done anyway: none.

### Deviations / notes
`listMyVenues`'s new `courts` field was verified non-breaking: `VenueOwnerPanel`'s "overview" view still only reads `venue.name`/`venue.approvalStatus`, so the added field doesn't affect existing rendering.

### Follow-up tasks created
- **Task 47a (see below, bundled with Tasks 48/49's similar gaps, appended to `TASKS.md`):** add pending/disabled states to `deleteBlock`, `toggleSuspended`, and `toggleUserSuspended` — none of the three new suspend/remove controls in this batch have one, unlike every other mutation-backed control in the project.
## Task 48 — Superadmin venue moderation view

**Date completed:** 2026-09-19
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review."

### Acceptance criteria check
- [x] Criterion 1 — verified: `listAllVenues` (`ctx.db.query("venues").collect()`, no status filter) backs `/admin/venues`, showing pending/approved/rejected alike.
- [x] Criterion 2 — verified via `admin.test.ts`'s new test: suspends an approved venue, confirms it disappears from `listApprovedVenues` — real end-to-end check, not just "the mutation was called."
- [x] Criterion 3 — verified: `player.query(api.admin.listAllVenues, {})` rejects with `'Superadmin role required'` in the same test — re-ran, passes.
- [x] Criterion 4 — verified in `AppShell.tsx`.
- [x] Criterion 5 — `npm test` (104/104) and `npm run build` pass.

**Same minor gap as Task 47:** `toggleSuspended` has no pending/disabled state — bundled into Task 47a below.

### Scope boundary check
- Stayed inside declared IN/OUT: yes.
- Out-of-scope work done anyway: none.

### Deviations / notes
None beyond the pending-state gap, bundled into Task 47a.

### Follow-up tasks created
See Task 47a below.
## Task 49 — Superadmin user moderation view

**Date completed:** 2026-09-19
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review." Criteria 1–6 as stated are genuinely met, with a real standout: the field-minimization test. But this task introduces a real, live-confirmed product-safety gap the acceptance criteria never anticipated — **a superadmin can suspend their own account with one click and no confirmation, permanently locking themselves out.**

### Acceptance criteria check
- [x] Criterion 1 — verified live at `/admin/users`.
- [x] Criterion 2 — verified via `admin.test.ts`: after `setUserSuspended`, the suspended player's `listMyBookings` call rejects with `'suspended'` — real end-to-end enforcement, matching Task 26a's existing guarantee.
- [x] Criterion 3 — verified: both `listUsers` and `setUserSuspended` reject a non-superadmin identity with `'Superadmin role required'`.
- [x] **Criterion 4 — this is the standout piece of this whole batch.** The test doesn't just check a couple of expected fields are present — it asserts `Object.keys(player).sort()` equals **exactly** `['_id', 'email', 'role', 'suspended']`, seeding the test user with `name`/`phone` fields specifically to prove they're *not* leaked. This is a materially stronger test than "spot-check" implies, and a good pattern other minimal-projection queries in this codebase should follow.
- [x] Criterion 5 — verified in `AppShell.tsx`.
- [x] Criterion 6 — `npm test` (104/104) and `npm run build` pass.

**Real safety gap found, not anticipated by this task's own acceptance criteria — verified live, not hypothetical.** `listUsers` returns every user in the system, including the calling superadmin themselves — there is no `user._id !== currentUser._id` filter anywhere, client or server. I navigated to `/admin/users` as `demo@example.com` (the only user in this dev deployment, and its only superadmin) and confirmed live: a bright red "Suspend" button sits directly next to that account's own row, with no exclusion, no warning, and no confirmation dialog. **I did not click it** — doing so would immediately lock out the only superadmin account in this deployment, since Task 26a's own (correct) enforcement rejects a suspended user's calls even mid-session, and there is no other superadmin to undo it without falling back to CLI-level access (re-running `promoteUserToSuperadmin` and unsuspending via `--identity`, both of which require deploy access). This is exactly the kind of self-inflicted lockout the review process exists to catch before it happens to a real user, not after.

### Scope boundary check
- Stayed inside declared IN/OUT: yes on what was asked — this gap exists because the task brief (mine) never anticipated the self-suspension case, not because Codex went out of scope.
- Out-of-scope work done anyway: none.

### Deviations / notes
None beyond the safety gap above.

### Follow-up tasks created
- **Task 49a (new, appended to `TASKS.md`, priority):** Prevent self-suspension. Recommend a server-side guard in `setUserSuspended` (reject if `userId === callerId`) as the primary fix — per this project's own standing rule that authorization/safety checks belong at the Convex function level, not only in the UI — plus a client-side disable/hide on the current user's own row as a secondary, non-load-bearing UX nicety.
## Tasks 47a and 49a — Moderation pending states and self-suspension guard

**Date completed:** 2026-09-19
**Implemented by:** Codex
**Reviewed by:** Claude Code

**Note:** Codex correctly marked this "Pending independent review." Task 49a (the priority safety fix) is genuinely, fully correct — both the server-side guard and the client-side self-exclusion were verified independently, including live in a browser. Task 47a is **only partially done**: two of its three controls were fixed correctly, but the venue-suspend button in the "Venues" view was missed entirely, and the new test doesn't catch this because it string-matches the presence of the right code elsewhere in the same file rather than checking that specific button.

### Acceptance criteria check (Task 49a)
- [x] **Server-side guard — verified via a real test, re-run.** `admin.test.ts`'s new test seeds a superadmin and calls `setUserSuspended` on their own id with `suspended: true`, asserting rejection with `'cannot suspend their own account'`. Read the actual guard in `convex/admin.ts`: `requireSuperadmin` now returns the caller's id, and `setUserSuspended` checks `args.userId === callerId && args.suspended === true` before patching — correctly scoped to *suspending* only (self-unsuspend is a non-issue anyway, since a suspended user can't call any superadmin function to begin with, including this one).
- [x] **Client-side exclusion — verified live, not just in source.** Navigated to `/admin/users` as `demo@example.com`: the row for that account shows "Current account" / "Your account" with **no button at all**, not just a disabled one — a cleaner fix than "disabled" would have been, since there's no way to even attempt the action.
- [x] Other-user suspension unaffected — the existing `admin.test.ts` suspension test (suspend a different user, confirm rejection of their subsequent calls) is untouched and still passes.
- [x] `npm test` (107/107, re-run) and `npm run build` pass; `git diff --stat app/convex/` shows a 4-line change to `admin.ts` only — exactly the minimal guard requested, no scope creep.

### Acceptance criteria check (Task 47a)
- [x] `deleteBlock` (`VenueOwnerPanel.tsx`) — verified: `removingBlockId` state, button shows `disabled={removingBlockId !== null}` and "Removing…" — correctly fixed.
- [x] `toggleUserSuspended` (`SuperadminPanel.tsx`, Users view) — verified: `moderationAction` state, button shows `disabled={moderationAction !== null}` and "Saving…" — correctly fixed.
- [ ] **`toggleSuspended` (`SuperadminPanel.tsx`, Venues view) — NOT fixed, despite the acceptance criteria explicitly naming it.** The handler function itself does set `moderationAction` correctly (confirmed in the diff — `setModerationAction(`venue:${venueId}`)` wraps the `setVenueSuspended` call), but the Venues view's actual `<Button>` JSX was never updated to read that state: no `disabled` prop, no conditional label — it's byte-for-byte the same button as before this task. A rapid double-click on a venue's Suspend button can still fire two `setVenueSuspended` calls. This is a genuine, verifiable partial-completion gap, not a difference of interpretation — the original task explicitly named "venue suspension" as one of the three controls to fix.
- [x] `npm test` (107/107) and `npm run build` pass — but this doesn't catch the gap above, because `moderation-pending.test.ts` only asserts `adminSource` (the whole file's raw text) *contains* `moderationAction !== null` somewhere — which is true, since the Users-view button has it — without checking that the *specific* Venues-view button does too. This is the same "string exists somewhere in the file" failure mode flagged repeatedly in this project's history (Task 43's original SEO regression, Task 44a's `aria-hidden` regression) — the fix pattern for catching it (test the actual behavior/DOM output, not source text) still hasn't been applied consistently to every new test in this codebase.

### Scope boundary check
- Stayed inside declared IN/OUT: yes for Task 49a. Task 47a's scope boundary is met for 2 of 3 named controls; the third is simply incomplete, not out-of-scope work.
- Out-of-scope work done anyway: none.

### Deviations / notes
None beyond the incomplete Venues-view fix above.

### Follow-up tasks created
- **Task 47b (new, appended to `TASKS.md`):** Finish Task 47a's third control — add `disabled`/pending-label treatment to the Venues view's Suspend/Unsuspend button in `SuperadminPanel.tsx`, using the `moderationAction` state that already exists and is already correctly set by `toggleSuspended` (only the button's JSX needs updating, not the handler).
