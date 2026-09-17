# TASKS.md — badmintul.com

**Audience: ChatGPT Codex, acting as implementer.** Each task below is a self-contained handoff brief. Implement tasks **in order** — later tasks assume earlier ones are done. Do not reorder, merge, or skip tasks without flagging it back to the human first.

**Global rules for every task:**
- All code goes inside `app/`. Never create source files at repo root. Repo root is for `SPEC.md`, `ROADMAP.md`, `RISKS.md`, `TASKS.md`, `REVIEW.md`, `AGENTS.md`, `CLAUDE.md`, `.gitignore`, `README.md` only.
- All commands (`npm install`, `npm run dev`, `npm run build`, `npm test`, `npx convex dev`, etc.) are run from inside `app/`, never from repo root.
- If a task's acceptance criteria can't be met because of a decision that hasn't been made yet (see `RISKS.md` BLOCKING items), stop and surface the blocker — don't guess and proceed.
- After finishing a task, fill out a `REVIEW.md`-style entry (see that file's template) before moving to the next task.

---

## Task 1 — Repo & `app/` scaffold

**Goal:** Working Vite + React + TypeScript + Tailwind project inside `app/`, installable and running locally.

**Scope boundaries:**
- IN: `app/` folder created with Vite React-TS template, Tailwind installed and configured, basic folder structure (`app/src/pages`, `app/src/components`, `app/src/lib`), `.gitignore` covering `app/node_modules`, `app/dist`.
- OUT: No Convex yet (Task 2). No auth. No real UI screens beyond a placeholder homepage confirming the build runs. No PWA plugin yet (Task 8).

**Acceptance criteria:**
1. `cd app && npm install && npm run dev` starts a local dev server with no errors.
2. `cd app && npm run build` produces `app/dist` with no errors.
3. Tailwind classes visibly apply on the placeholder homepage (e.g., a colored div proves the pipeline works).
4. Repo root contains no application source files — verify with a directory listing.
5. `.gitignore` excludes `app/node_modules` and `app/dist`.

---

## Task 2 — Convex project setup

**Goal:** Convex connected to the app, a trivial query/mutation round-trips successfully.

**Scope boundaries:**
- IN: `npx convex dev` initialized inside `app/`, Convex client wired into the React app, one placeholder table + one query + one mutation proving the connection works end to end.
- OUT: No real schema yet (Task 3). No auth yet.

**Acceptance criteria:**
1. `app/convex/` folder exists with a working schema file (even if minimal) and at least one function.
2. The React app can call the Convex query and render its result on screen.
3. The React app can call the Convex mutation and see the query result update reactively (no manual refetch).
4. Convex dev deployment URL/keys are stored in `app/.env.local` (or equivalent), and `.env.local` is gitignored.

---

## Task 3 — Data model: users, roles, venues, courts, bookings

**Goal:** Full Convex schema for the domain, per `SPEC.md` §1–2.

**Scope boundaries:**
- IN: Convex schema definitions for `users` (with a `role` field: `superadmin` | `player` | `venueOwner`), `venues` (owned by a user, has an approval status), `courts` (belongs to a venue), `bookings` (references court + player + time slot + status).
- OUT: No UI for any of this yet. No auth enforcement logic yet (Task 4). Do not add payment fields — per `SPEC.md` non-goals, no payment integration in v1.

**Acceptance criteria:**
1. Schema file defines all four tables with explicit field types (use Convex's schema validators, not `v.any()` anywhere).
2. `venues` has an approval status field with at least `pending` / `approved` / `rejected` states (see `SPEC.md` §4.2–4.3).
3. `bookings` has a status field distinguishing at least `confirmed` / `cancelled`.
4. Relationships are modeled via Convex ID references (`v.id("venues")` etc.), not denormalized strings.
5. Schema deploys cleanly with `npx convex dev` — no validation errors.

---

## Task 4 — Auth & role-based access

**Goal:** Users can sign up/log in, get assigned a role, and role determines what routes/data they can access.

**Scope boundaries:**
- IN: Auth provider decision executed per `RISKS.md` R-3 (Convex Auth if viable within the timebox, else Clerk). Signup flow captures role selection (player or venue owner — superadmin accounts are seeded manually, not self-service). Convex functions check the caller's role server-side before returning role-scoped data.
- OUT: No password reset flow, no email verification flow, no social login — email/password (or magic link, whichever the chosen provider makes simplest) is sufficient for v1.

**Acceptance criteria:**
1. A new user can sign up as either "player" or "venue owner" and the role persists in the `users` table.
2. Superadmin accounts exist only via manual seeding (a documented script or Convex dashboard action) — there is no public "become superadmin" path.
3. At least one Convex query/mutation demonstrates server-side role checking: calling a venue-owner-only function as a player is rejected (test this explicitly, don't just assume the UI hides the button).
4. If R-3's timebox concludes that the chosen auth approach won't support custom role claims cleanly, this is flagged back to the human before proceeding — not silently worked around.

---

## Task 5 — Venue owner: venue & court creation

**Goal:** A logged-in venue owner can create a venue with courts and submit it for approval.

**Scope boundaries:**
- IN: Form to create a venue (name, address, description, photos — photo upload can use Convex file storage), form to add one or more courts to a venue (name, price/hour, operating hours), submit action that sets venue status to `pending`.
- OUT: No editing of an already-approved venue's core details in this task (that's a later enhancement, not v1-blocking — flag as future work if it comes up, don't build it now). No multi-venue-per-owner UI polish — the data model supports it (Task 3) but v1 UI only needs to handle it without crashing, not optimize for it.

**Acceptance criteria:**
1. A venue owner can submit a venue with ≥1 court and see it appear in their own dashboard with status "Pending approval."
2. The venue is NOT visible in any player-facing browse view while pending.
3. Convex mutation for venue/court creation validates required fields server-side (not just client-side form validation).
4. Per `RISKS.md` R-8: the venue owner's dashboard query only returns venues owned by the authenticated user — verify by attempting to query another owner's venue ID and confirming rejection.

---

## Task 6 — Superadmin: approval queue & platform view

**Goal:** Superadmin can see pending venues, approve/reject them, and see basic platform metrics.

**Scope boundaries:**
- IN: Superadmin-only route showing a list of pending venues with approve/reject actions, a simple metrics view (count of venues by status, count of bookings, count of active players — pull these as straightforward Convex aggregation queries, no charting library).
- OUT: No suspend/ban functionality yet (that's implied by `SPEC.md` §1 but not required for v1 "done" per `SPEC.md` §4 acceptance criteria — build it only if time allows after Task 12; do not block on it). No configurable global settings UI (lead-time limits etc.) — hardcode reasonable defaults as constants for v1, per `SPEC.md` non-goals spirit (avoid over-building admin config surface not explicitly required).

**Acceptance criteria:**
1. Superadmin logs in and lands on a distinct dashboard (not the player or venue-owner view).
2. A pending venue submitted in Task 5 appears in the approval queue.
3. Clicking "approve" changes the venue's status to `approved` and it becomes visible in player browse (verify against Task 7 once that exists, or via a direct Convex query check now).
4. Metrics view shows at least: total venues by status, total bookings, total registered players — numbers must come from real Convex queries, not hardcoded placeholders.
5. A non-superadmin (player or venue owner) attempting to access the superadmin route is redirected/blocked, both in UI routing and if they try calling the underlying Convex function directly.

---

## Task 7 — Player: browse venues & view availability

**Goal:** A player can browse approved venues and see a real-time court availability calendar.

**Scope boundaries:**
- IN: Venue list/browse page (approved venues only), venue detail page showing its courts, a calendar/time-grid UI showing which slots are booked vs. open for a selected court and date.
- OUT: No search/filter-by-city UI polish beyond a basic filter if trivial — don't over-invest in search UX for v1. No favoriting/wishlist features.

**Acceptance criteria:**
1. Only venues with status `approved` appear in the browse list (confirm the pending venue from Task 5 is absent until approved in Task 6).
2. Selecting a venue and court shows a calendar/grid reflecting actual booking data from Convex, not mock data.
3. The availability view updates reactively if a booking is made elsewhere while the page is open (Convex subscription, not manual refresh) — this can be verified by opening two browser sessions.

---

## Task 8 — Player: booking flow (with double-booking prevention)

**Goal:** A player can book an open slot; the same slot cannot be double-booked.

**Scope boundaries:**
- IN: Booking action (select slot → confirm → booking created with status `confirmed`), booking history view for the logged-in player, cancellation action within a configurable cancellation window (hardcode the window as a constant per Task 6's scope note).
- OUT: No payment step (non-goal per `SPEC.md`). No booking modification (change time/date of an existing booking) — cancel-and-rebook is the v1 pattern, don't build an edit flow.

**Acceptance criteria:**
1. Booking a slot marks it unavailable immediately for all other viewers (via the reactive subscription from Task 7).
2. **Critical (per `RISKS.md` R-4):** the availability check and the booking write happen inside a single Convex mutation. Write an explicit test (or documented manual test) that fires two booking mutations for the same slot concurrently and confirms exactly one succeeds.
3. A player can view their own booking history and see status (`confirmed`/`cancelled`).
4. Cancelling a booking within the allowed window sets status to `cancelled` and the slot becomes bookable again; attempting to cancel outside the window is rejected with a clear message.
5. A player cannot view or cancel another player's booking (server-side check, not just UI hiding).

---

## Task 9 — Public landing page

**Goal:** Marketing/landing page at the root route, distinct from the authenticated dashboard.

**Scope boundaries:**
- IN: Single landing page (hero, brief value prop per role — player/venue owner — call-to-action to sign up/log in), using the design tokens from `SPEC.md` §2 (electric violet + cyan on light background).
- OUT: No blog, no multi-page marketing site, no CMS integration. Copy can be placeholder-quality — this is a structural/visual task, not a copywriting task.

**Acceptance criteria:**
1. Unauthenticated visitors to `/` see the landing page, not a login wall or blank screen.
2. Landing page visually uses the specified color tokens (violet/cyan accents, light background) — not dark mode, not an unrelated palette.
3. Landing page has working navigation to signup/login.
4. Landing page is responsive (usable on a mobile viewport width, since this will also be the PWA install entry point).

---

## Task 9a — Landing page `/login` link (DONE 2026-09-17)

**Goal:** Fix the missing `/login` navigation on the landing page found during Task 9's independent review (see `REVIEW.md`).

**Scope boundaries:**
- IN: Add a working `/login` link to `Landing.tsx` alongside the existing `/signup` CTA.
- OUT: No other landing-page changes.

**Acceptance criteria (all met, see `REVIEW.md` Task 9):**
1. `npm test` passes, including `landing.test.ts`'s `/login` assertion.
2. A manual click-through from `/` reaches the login form.

---

## Task 10 — PWA: manifest, service worker, installability

**Goal:** The app is installable and the app shell works offline.

**Scope boundaries:**
- IN: `vite-plugin-pwa` configured, manifest (name, icons, theme color matching design tokens, `display: standalone`), service worker caching the app shell (static assets), install verified on both Android Chrome and iOS Safari per `RISKS.md` R-5.
- OUT: No offline data mutation queueing (e.g., "book while offline, sync later") — that's a significant feature beyond v1 scope; offline just means the app shell loads, not that booking works without network.

**Acceptance criteria:**
1. Manifest is valid (icons present at required sizes, theme/background color set) — verify with browser devtools "Application" panel showing no manifest errors.
2. App is installable via "Add to Home Screen" on Android Chrome, launches standalone (no browser UI).
3. App is installable via "Add to Home Screen" on iOS Safari — document any behavioral gap vs. Android in `REVIEW.md` for this task rather than treating a platform limitation as a bug.
4. With network disabled after first load, the app shell (layout, navigation) still renders — data-dependent screens may show an appropriate "offline" or loading state rather than a crash.

---

## Task 11 — Deployment: Convex production + Hostinger static hosting

**Goal:** `badmintul.com` serves the production build, backed by a production Convex deployment.

**Scope boundaries:**
- IN: `npx convex deploy` to a production Convex deployment, production build (`app/dist`) uploaded to Hostinger (FTP or File Manager, whichever is available), domain pointed at the hosted files, HTTPS enabled, Convex CORS/allowed-origins updated to include `https://badmintul.com` (per `RISKS.md` R-7).
- OUT: No CI/CD pipeline automation required for v1 — manual deploy steps are acceptable and should be documented in this task's `REVIEW.md` entry so they're repeatable, but building a GitHub Actions pipeline is optional future work, not required here.

**Acceptance criteria:**
1. `https://badmintul.com` loads the production build over HTTPS with no mixed-content warnings.
2. The production app successfully reads/writes to the production Convex deployment (not the dev deployment) — verify env vars point correctly.
3. A booking made on the production site is a real write, not against dev data.
4. Deploy steps taken are written down (in this task's `REVIEW.md` entry) in enough detail that they can be repeated for the next deploy.

---

## Task 12 — Hardening pass

**Goal:** Verify the BLOCKING risks in `RISKS.md` are actually closed, not just assumed closed.

**Scope boundaries:**
- IN: Explicit re-test of R-4 (double-booking race) and R-8 (venue owner isolation) against the production or a production-like environment. Explicit cross-role access audit: attempt to access every other role's routes/functions as each role and confirm rejection.
- OUT: No new features. This is a verification task, not a build task — if it surfaces a bug, log it and fix it as a follow-up, don't silently expand this task's scope.

**Acceptance criteria:**
1. Concurrent booking test (from Task 8) is re-run against production Convex and confirmed to still hold.
2. Cross-owner data access attempt (from Task 5) is re-run against production and confirmed rejected.
3. A written audit (in `REVIEW.md`) lists each role × each other role's routes, confirming access is blocked both in UI and at the Convex function level.
4. Any gap found is logged as a new, clearly scoped follow-up task appended to this file — not fixed ad hoc without a record.

---

## Task 12a — Production hardening execution

**Goal:** Complete the live-environment checks that require seeded production data and Hostinger access.

**Acceptance criteria:**
1. ~~Seed one player, one venue owner, one superadmin, one approved venue, and one court in production using a controlled/manual process.~~ **DONE 2026-09-17** — see `REVIEW.md` Task 12a.
2. ~~Re-run the concurrent booking race against the production Convex URL and record exactly one success.~~ **DONE 2026-09-17.**
3. ~~Re-run the cross-owner venue access attempt against production and record rejection.~~ **DONE 2026-09-17.**
4. Upload the production `app/dist/` bundle to Hostinger and verify `https://badmintul.com` reads and writes production Convex data. **STILL BLOCKED** — no Hostinger credentials available. See Task 16 below for the prep work that can happen ahead of credentials arriving.

---

# Phase 8 — Route Architecture, Admin Operability & Deploy Readiness

Added 2026-09-17 after independent review of Tasks 1–12a surfaced four real gaps that don't block the app functioning today, but do block calling Phases 2, 6, and 7 (per `ROADMAP.md`) genuinely complete: dashboards aren't actually routed, there's no repeatable superadmin bootstrap, availability rendering silently assumes browser-local time equals WIB, and Hostinger deploy readiness has no written runbook. None of these are urgent bugs; all are debt worth closing before Task 11/12a criterion 4 is attempted for real, since fixing routing or timezone handling *after* the site is live is more disruptive than fixing it now.

**Ordering:** Task 13 first (touches the most surface area — every panel's entry point), then 14 and 15 (independent of each other and of 13, can be done in either order), then 16 last (pure documentation, lowest risk, easiest to defer).

---

## Task 13 — Role-based dashboard routing

**Goal:** Give each role a real, distinct dashboard URL, per `SPEC.md` §4.3 ("a superadmin can log in to a distinct dashboard view") and §4.7 ("role-based routing... enforced both in UI routing and in Convex function-level auth checks"). Currently `AuthPanel`, `VenueOwnerPanel`, `SuperadminPanel`, and `PlayerBrowsePanel` are all stacked on the single `Home` page and each self-hides based on role — the *access* boundary is real (Convex-side checks are untouched and unaffected by this task), but there's no actual per-role route, which is a gap flagged in `REVIEW.md` Task 6.

**Scope boundaries:**
- IN: Real routes for `/player`, `/venue-owner`, and `/admin` (or equivalent paths), each rendering only its own panel. After a successful login/signup, redirect the user to their role's dashboard route automatically. Visiting a role-mismatched dashboard route (e.g., a player hitting `/admin`) redirects away rather than silently rendering nothing. Keep `/`, `/login`, `/signup` as they are today (the existing lightweight pathname-switch approach in `App.tsx` can be extended — a full router dependency is not required for 4–6 routes, but may be used if it's cleaner than extending the manual switch).
- OUT: No nested sub-routes within a dashboard (e.g., no `/admin/venues/:id`). No changes to any Convex function — this is UI routing only, and the existing server-side role checks remain the actual security boundary; this task must not be treated as a substitute for them.

**Acceptance criteria:**
1. Visiting `/player`, `/venue-owner`, `/admin` directly as the matching role renders only that role's dashboard content.
2. Visiting a role-mismatched dashboard route redirects (e.g., to `/` or `/login`) rather than rendering a blank/empty panel.
3. After login/signup, the user lands on their own role's dashboard route without a manual navigation step.
4. Existing Convex-level role checks are unchanged — verify `npm test` still passes with no modifications to `convex/*.ts` role-check logic.
5. `npm run build` passes; manual click-through confirms all three dashboard routes and the redirect behavior.

---

## Task 14 — Superadmin seeding script + runbook

**Goal:** Replace the informal "insert a `users` row via the Convex dashboard" note (from `REVIEW.md` Task 6) with an actual repeatable, documented process, closing the `RISKS.md` R-6 (bus-factor) gap this creates today.

**Scope boundaries:**
- IN: A Convex `internalMutation` (not a public `mutation`) that promotes an existing user to `superadmin` by email, callable only via `npx convex run` by someone with deploy access — same CLI-only pattern already proven safe in Task 12a's temporary seed script, but this one is permanent since real launch needs it repeatedly (new superadmins over time), not a one-off. A short runbook section added to `app/README.md` with the exact command and a warning that it requires deploy-level Convex access.
- OUT: No UI for this. Per `SPEC.md` and the existing Task 4 design, there must remain no public "become superadmin" path — this task must not create one, even accidentally (e.g., don't expose it as a regular `mutation` reachable from the client bundle).

**Acceptance criteria:**
1. A function (e.g., `convex/admin.ts` or a new file) is declared with Convex's `internalMutation`, not `mutation`, and sets `role: "superadmin"` on the user matching a given email; it throws a clear error if no such user exists.
2. Confirm the function does not appear in the client-reachable API surface used by the React app (i.e., it's not imported/called from any `src/` file) — an `internalMutation` is only reachable via the Convex CLI/dashboard, not `api.*` from the client.
3. `app/README.md` documents the exact `npx convex run` invocation (dev and prod variants) to promote a user to superadmin.
4. `npm test` and `npm run build` pass; a test confirms the promotion mutation works when invoked directly (e.g., via `convex-test`) and that a non-existent email throws.

---

## Task 15 — Timezone-explicit booking availability

**Goal:** `SPEC.md` §5 assumes a single timezone (WIB / Asia/Jakarta) for all booking logic, but `PlayerBrowsePanel`'s current day-boundary and slot-time calculations use `new Date()` and `toLocaleTimeString()` with no explicit timezone — meaning "today's" slot boundaries and displayed times silently follow whatever timezone the *browser* is set to, not WIB. This is currently invisible because development happens in a WIB-adjacent environment, but it's a real correctness gap flagged in `REVIEW.md` Task 7's review, worth closing before more of the booking UI is built on top of it.

**Scope boundaries:**
- IN: Pin day-start/day-end and slot-time calculations, and their display formatting, explicitly to `Asia/Jakarta` (e.g., via `Intl.DateTimeFormat` with `timeZone: 'Asia/Jakarta'`, or a small shared date utility in `app/src/lib/`) rather than relying on browser-local time.
- OUT: No timezone picker or multi-timezone support — single hardcoded WIB, per `SPEC.md` §5's explicit non-goal.

**Acceptance criteria:**
1. Day-start/day-end and slot start-time calculations are computed relative to Asia/Jakarta explicitly — verified by a test that mocks the system/browser timezone away from WIB (e.g., via `vi.stubEnv`/`Intl` mocking or running the relevant calculation with a non-WIB `TZ` env var) and confirms the computed slot boundaries don't shift.
2. Displayed slot times use an explicit Asia/Jakarta format, not implicit browser-local formatting.
3. `npm test` and `npm run build` pass.

---

## Task 16 — Hostinger deploy runbook & CORS checklist (prep only, no credentials required)

**Goal:** Get everything that can be prepared *without* Hostinger credentials fully ready, so that once credentials are available, Task 11 and Task 12a criterion 4 can be executed in one short session rather than figuring out steps at that point. This is documentation work, not a code change, and explicitly does not require access this task doesn't have.

**Scope boundaries:**
- IN: A written, numbered, copy-pasteable runbook (new `DEPLOY.md` at repo root, or a section in `app/README.md`) covering: the exact production build command, the exact Hostinger upload target (public web root) and method (FTP/File Manager), the exact Convex CORS/allowed-origins configuration needed for `https://badmintul.com` (dashboard location or CLI command), and a pre-flight checklist confirming `app/dist`'s bundled `VITE_CONVEX_URL` is the production URL, not dev.
- OUT: No actual FTP upload, no DNS/HTTPS changes, no live verification — all of that remains Task 11/12a's job once Hostinger credentials exist. This task produces the runbook only.

**Acceptance criteria:**
1. `DEPLOY.md` (or the equivalent `app/README.md` section) exists with a numbered runbook covering build, upload target/method, and CORS/allowed-origins steps.
2. The Convex CORS/allowed-origins requirement for `https://badmintul.com` is documented with the exact dashboard location or CLI command to set it (per `RISKS.md` R-7).
3. The runbook includes an explicit pre-flight check (e.g., a `grep` command) to confirm the built `app/dist` bundle references the production Convex URL, not the dev one, before upload.

---

# Phase 9 — UI/UX Polish

Added 2026-09-17. Every screen built in Phases 2–5 is functionally correct (Convex-side logic and role checks are solid per `REVIEW.md`) but was built with minimal, inconsistent styling — this phase closes that gap. Concrete, verified-by-reading-the-code problems motivating this phase: `AuthPanel.tsx` and `VenueOwnerPanel.tsx` have multiple `<input>`/`<select>` elements with **no Tailwind classes at all** (unstyled browser-default fields sitting inside an otherwise branded violet/cyan app); every form uses `placeholder` text as its only label, with no `<label>`/`htmlFor` association (an accessibility gap, not just a visual one); no form anywhere disables its submit button or shows a pending state during the `await` on a mutation, so a slow network invites double-submits; `PlayerBrowsePanel`'s "availability calendar" (per `SPEC.md` §1/§4.1) is a bare vertical list of 14 hour rows, not a grid; and list views (approval queue, "my venues", "my bookings") show a raw `'…'`/nothing while `useQuery` is loading rather than a real loading state, and a plain one-line message with no call-to-action when empty.

**Ordering:** Task 17 first (shared primitives everything else reuses) — doing 18–20 before 17 would mean re-touching every form and list a second time once primitives exist. 18, 19, and 20 can happen in any order relative to each other once 17 lands. Task 21 (accessibility/responsive audit) goes last since it needs to audit the *result* of 17–20, not the pre-polish state. This phase can run independently of Phase 8, but Task 20 (dashboard layout) will be cleaner to do after Phase 8's Task 13 (real dashboard routes) lands, since it's touching the same panels — check with the human/Claude Code reviewer before starting Task 20 if Task 13 isn't done yet, rather than guessing which order is less disruptive.

---

## Task 17 — Shared UI primitives (Button, Input, Select, FormField, Card)

**Goal:** Replace one-off, inconsistent (and in several cases entirely unstyled) form controls and buttons with a small set of shared, reusable components so every screen looks and behaves consistently.

**Scope boundaries:**
- IN: `app/src/components/ui/` (or similar) with a `Button` (primary/secondary/danger variants, using the existing `brand-*` tokens from `app/src/index.css`), a labeled `TextField`/`FormField` wrapper (real `<label htmlFor>`, not placeholder-as-label), a styled `Select`, and a `Card` container for panel sections. Replace the unstyled `<input>`/`<select>` elements in `AuthPanel.tsx`, `VenueOwnerPanel.tsx`, and `PlayerBrowsePanel.tsx` with these.
- OUT: No new design tokens (reuse `brand-primary`/`brand-accent`/etc. from `SPEC.md` §2, already defined). No component library dependency (shadcn/Radix/etc.) — plain Tailwind + React is sufficient at this scale and avoids adding a new external dependency for ~5 components.

**Acceptance criteria:**
1. Every `<input>` and `<select>` in `AuthPanel.tsx`, `VenueOwnerPanel.tsx`, and `PlayerBrowsePanel.tsx` has visible border/padding/focus styling consistent with the rest of the app — verify by loading each form and confirming no unstyled/browser-default fields remain.
2. Every form field has a real `<label>` associated via `htmlFor`/`id`, not a placeholder standing in as the only label.
3. `Button` supports a `disabled` state with a visibly different (not just non-functional) appearance.
4. `npm test` and `npm run build` pass; no behavioral change to any Convex call — this task is presentation-only.

---

## Task 18 — Form submission states (loading, disabled, inline errors)

**Goal:** Prevent double-submission and give the user feedback while a mutation is in flight, using the `Button`/`FormField` primitives from Task 17.

**Scope boundaries:**
- IN: Every form that calls a Convex mutation (`AuthPanel`'s sign in/up, `VenueOwnerPanel`'s venue submission, `SuperadminPanel`'s approve/reject, `PlayerBrowsePanel`'s booking) disables its submit control and shows a pending indicator (e.g., "Submitting…") for the duration of the `await`. Existing error message rendering (already present in `AuthPanel`/`VenueOwnerPanel`) is restyled via `FormField`'s error slot rather than rewritten from scratch.
- OUT: No optimistic UI / client-side prediction of mutation results — Convex's reactive queries already update the UI once the mutation resolves, which is sufficient; don't add complexity here.

**Acceptance criteria:**
1. Clicking a submit/approve/reject/book control while its mutation is pending does not allow a second click to fire a second mutation (verify by simulating a slow network or asserting the control's `disabled` state is true during the `await` in a test).
2. Each of the four forms/actions listed above shows a visible pending state distinct from its resting state.
3. `npm test` and `npm run build` pass.

---

## Task 19 — Booking availability: real calendar/grid layout

**Goal:** Upgrade `PlayerBrowsePanel`'s availability view from a bare vertical list of hour rows to the "live availability calendar" `SPEC.md` §1 and §4.1 actually describe, and add basic date navigation (today/tomorrow at minimum — Task 7 deliberately deferred this).

**Scope boundaries:**
- IN: A grid/calendar-style layout for the selected court's hourly slots (using the `brand-success`/`brand-danger` tokens already used for open/booked states), plus the ability to move the viewed date forward/back by a day (at least today and the next few days — no full month view required). Keep using the existing `getCourtAvailability` query and `Asia/Jakarta`-explicit time handling from Task 15 (Phase 8) if that's landed by the time this task starts; if not, flag it rather than reintroducing the browser-local-time bug Task 15 exists to fix.
- OUT: No multi-court side-by-side comparison view. No week/month calendar view — SPEC.md doesn't require it and it's a meaningfully bigger feature than this task's scope.

**Acceptance criteria:**
1. The availability view is a grid layout (not a plain vertical list), with visually distinct open vs. booked cells using the existing semantic color tokens.
2. A player can navigate to at least the next few days' availability for a selected court, not only "today."
3. Booking a slot still goes through the same `bookings:createBooking` mutation with no change to its double-booking-prevention logic (per `RISKS.md` R-4) — this task must not touch `convex/bookings.ts`.
4. `npm test` and `npm run build` pass.

---

## Task 20 — Dashboard list states: loading, empty, and layout consistency

**Goal:** Replace the current `'…'`-while-loading / bare-one-line-when-empty pattern across the approval queue, "my venues," and "my bookings" lists with real loading and empty states, and make each panel's layout consistent (spacing, card structure) using Task 17's `Card` primitive.

**Scope boundaries:**
- IN: A loading state (skeleton or spinner, not literal `'…'` text) while each `useQuery` is `undefined`; an empty state with a short message *and* a relevant call-to-action (e.g., "No venues yet — submit your first venue" linking to the submission form, "No pending venues" for the approval queue, "No bookings yet — browse venues" for a player) instead of a bare sentence; consistent `Card`-based layout across `VenueOwnerPanel`, `SuperadminPanel`, `PlayerBrowsePanel`.
- OUT: No pagination — list sizes are small enough at this stage that it's not warranted; add it later if real usage shows otherwise. Do this task after Phase 8's Task 13 (real dashboard routes) if that's landed, since both touch the same panel files — check current state before starting rather than assuming ordering.

**Acceptance criteria:**
1. Each of the three list views shows a distinguishable loading state, not literal `'…'` or blank output, while its query is pending.
2. Each list's empty state includes a specific call-to-action relevant to that role, not just a generic "nothing here."
3. All three panels use the shared `Card` primitive from Task 17 for consistent visual structure.
4. `npm test` and `npm run build` pass.

---

## Task 21 — Accessibility & responsive audit

**Goal:** Verify the results of Tasks 17–20 (and the existing Landing page) actually work for keyboard users, screen readers, and mobile viewports — this is a verification task, not a build task, matching `TASKS.md`'s existing pattern for Task 12's audit-style scope.

**Scope boundaries:**
- IN: Keyboard-only navigation check (tab order, visible focus states — confirm `Button`/`FormField` from Task 17 don't suppress `:focus-visible` outlines) across all authenticated dashboard routes from Phase 8's Task 13; color-contrast check for `brand-primary`/`brand-accent` text against their backgrounds (WCAG AA, since SPEC.md's violet/cyan-on-light palette needs a contrast check, not an assumption); mobile-viewport (~375px width) usability check for every dashboard panel, not just the landing page (which Task 9 already covers).
- OUT: No full WCAG audit tooling/CI integration — a documented manual pass is sufficient for v1, per the project's overall bias toward correctness-over-process-heaviness (`SPEC.md` §5). Fix anything found as part of this task rather than only cataloging it, consistent with how Task 9a handled Task 9's finding — but if a fix is large enough to be its own task, stop and log it as a new task rather than silently expanding this one's scope, per Task 12's established pattern.

**Acceptance criteria:**
1. Every interactive control (form fields, buttons, links) is reachable and operable via keyboard alone, with a visible focus indicator at each stop.
2. `brand-primary` and `brand-accent` text/background combinations in actual use are checked against WCAG AA contrast minimums; any combination that fails is fixed (adjusted shade or usage) or explicitly logged as a new follow-up task if the fix is non-trivial.
3. Every dashboard route (`/player`, `/venue-owner`, `/admin` from Task 13) is usable at a 375px-wide viewport with no horizontal scrolling and no cut-off/overlapping content.
4. Findings and fixes are logged in `REVIEW.md`, following the same audit-log pattern as Task 12.

---

## Task 13a — Clean up stale `Home.tsx`

**Goal:** Fix a real gap found during independent review of Task 13 (see `REVIEW.md`): `Home.tsx` — the component that still renders at `/login`, `/signup`, and any unrecognized path — was never revisited when Task 13 added real per-role dashboard routes. It still contains the original Task 1/2 scaffold placeholder markup ("Tailwind pipeline check", a "Test query + mutation" button wired to `connection.recordCheck`) and stacks `AuthPanel`, `VenueOwnerPanel`, `SuperadminPanel`, and `PlayerBrowsePanel` unconditionally — the exact pre-Task-13 pattern that task existed to eliminate.

**Scope boundaries:**
- IN: Remove the dead scaffold markup and the three non-auth panels from `Home.tsx`, leaving only `AuthPanel` (which is the entirety of what `/login` and `/signup` need now that `/player`, `/venue-owner`, and `/admin` are real routes handled by `RoleDashboard`).
- OUT: No routing changes beyond this — `App.tsx`'s existing fallback-to-`Home` behavior for unrecognized paths is fine to keep as-is.

**Acceptance criteria:**
1. `Home.tsx` no longer references `connection.getStatus`/`connection.recordCheck` or any Task 1/2 placeholder text.
2. `Home.tsx` renders only `AuthPanel` (plus whatever minimal page chrome — heading, layout — is appropriate).
3. Visiting `/login` and `/signup` shows only the login/signup form, not any role-specific panel.
4. `npm test` and `npm run build` pass.

---

## Task 15a — WIB-format the "My bookings" timestamp list

**Goal:** Fix a narrow gap found during independent review of Task 15 (see `REVIEW.md`): `PlayerBrowsePanel`'s availability grid correctly uses `formatWibTime`/explicit `Asia/Jakarta` formatting, but the "My bookings" list two lines below still uses `new Date(booking.startTime).toLocaleString()` — implicit browser-local time, the exact pattern Task 15 exists to eliminate, just missed in one spot.

**Scope boundaries:**
- IN: Replace the `toLocaleString()` call in `PlayerBrowsePanel`'s booking-history list with `formatWibTime` (or an equivalent explicit-`Asia/Jakarta` formatter) from `app/src/lib/wib.ts`.
- OUT: No other changes to booking history display or logic.

**Acceptance criteria:**
1. The "My bookings" list displays each booking's time using an explicit `Asia/Jakarta` format, not implicit browser-local formatting.
2. `npm test` and `npm run build` pass.

---

## Task 22 — Fix stuck sign-out on a stale authenticated session (DONE 2026-09-18)

**Goal:** Fix a real bug the user hit directly: navigating to `/login` while already authenticated with a stale/mismatched-role session showed only a "Sign out" button that appeared to do nothing when clicked, blocking them from logging back in as a freshly-promoted superadmin account.

**Context:** Codex made a first attempt at this (uncommitted, not logged as a task) that called `signOut()` fire-and-forget (`void signOut().catch(...)`) immediately followed by `window.location.replace('/')`. On review, this was found to likely make the underlying bug *worse*, not better: `@convex-dev/auth`'s `signOut()` awaits a server call before erasing the local token (`node_modules/@convex-dev/auth/dist/react/client.js`), and a full-page navigation typically aborts in-flight requests — so navigating away before `signOut()` resolves risks the local session token never actually being cleared, silently.

**Scope boundaries:**
- IN: `AuthPanel.tsx`'s sign-out path now `await`s `signOut()` before navigating, with a disabled/pending state (`isSigningOut`, "Signing out…") consistent with every other mutation-backed control in the app (Task 18's pattern).
- OUT: No change to the underlying reason a stale/mismatched session can be reached in the first place — that's a Convex Auth session-lifecycle question, not something this fix attempts to solve.

**Acceptance criteria (all met, see `REVIEW.md`):**
1. `signOutAndReturnToLogin` awaits `signOut()` before calling `window.location.replace('/')`.
2. The sign-out button shows a disabled "Signing out…" state while the call is in flight.
3. `npm test` and `npm run build` pass.
