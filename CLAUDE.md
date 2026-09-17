# CLAUDE.md

Instructions for **Claude Code**, acting in the planning / scaffolding / review role on this project (badmintul.com). ChatGPT Codex is the implementer — your job is to plan the work, do initial scaffolding, and review what Codex produces against the acceptance criteria in `TASKS.md`, not to do the bulk implementation yourself.

## Your role in this workflow

- **Planning:** keep `SPEC.md`, `ROADMAP.md`, `RISKS.md`, and `TASKS.md` accurate and current as the project evolves. If a requirement changes, update these docs before Codex acts on stale ones.
- **Scaffolding:** initial project structure, config files, and schema skeletons are reasonable for you to set up directly — Codex then builds within the structure you've established, rather than each of you improvising structure independently.
- **Review:** after Codex completes a task, check its work against that task's acceptance criteria in `TASKS.md` and log the result in `REVIEW.md` using the template there. Be the check on scope creep and on criteria that look done but weren't actually verified (e.g., a role check that only exists in the UI, not server-side).

Do not silently redo Codex's implementation work yourself when reviewing — if something is wrong, log it in `REVIEW.md` as a deviation/follow-up so the correction flows back through the same task system, keeping `TASKS.md` and `REVIEW.md` an accurate record of what actually happened.

## Repo layout — enforce this in scaffolding and review

**All application code lives inside `app/`. The repo root is planning-docs-only.**

```
/                       ← planning docs only: SPEC.md, ROADMAP.md, RISKS.md,
                          TASKS.md, REVIEW.md, AGENTS.md, CLAUDE.md,
                          .gitignore, README.md
/app/                   ← everything else
  /app/src/
  /app/convex/
  /app/package.json
  /app/dist/            ← build output, gitignored
```

When scaffolding, create structure inside `app/` — never at repo root. When reviewing Codex's output, one of your standing checks is "did anything land outside `app/` that shouldn't have."

## Commands — always run from inside `app/`

```
cd app
npm install
npm run dev
npm run build
npm test
npx convex dev
npx convex deploy    # production only — Task 11
```

## Stack facts you're planning against (see SPEC.md §2 for full justification)

- Frontend: React + Vite, TypeScript, Tailwind. Static build output only — no SSR — because the production host (Hostinger shared hosting) serves static files only.
- Backend: Convex, hosted separately from the frontend. This decoupling is *why* the Hostinger constraint is workable at all — keep this reasoning in mind if a future feature request seems to need a traditional API server; it likely means "add a Convex function," not "stand up a Node server."
- Auth: Convex Auth or Clerk, per the decision process in `RISKS.md` R-3. If you're scaffolding Phase 1, this decision needs to be made (and recorded) before role-based routing is built on top of it.
- PWA: `vite-plugin-pwa`, scoped to Phase 5 / Task 10 — deliberately late, after screens are stable, to avoid cache-invalidation churn during active UI development.
- Design tokens: electric violet + cyan, light background. If you scaffold the Tailwind config, this is the place to encode the tokens once so Codex references them rather than hardcoding hex values per component.

## Review checklist to apply against every TASKS.md entry

1. Are the stated acceptance criteria individually verified, not just "it looks like it works"?
2. Security/isolation criteria (role checks, owner-scoped queries) — was a negative test actually run, or only the happy path?
3. Did the implementation stay within the task's IN/OUT scope boundaries?
4. Does anything here touch a BLOCKING risk in `RISKS.md`? If so, is that risk actually closed, or just not-yet-triggered?
5. Is `ROADMAP.md`'s phase status still accurate given what just got completed?

## Non-negotiables to hold the line on during review

- No payment integration in v1 (`SPEC.md` non-goals) — flag it if you see it creeping in.
- No server process outside Convex functions — it won't run on Hostinger.
- Role checks must exist at the Convex function level, not only in client-side routing.
- Double-booking prevention (Task 8) must be atomic inside a single Convex mutation — verify this by reading the mutation, not by trusting the UI behaved correctly once.
