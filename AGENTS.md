# AGENTS.md

Instructions for **ChatGPT Codex**, acting as implementer on this project (badmintul.com). Read this before touching any code.

## Your role in this workflow

This project is planned and scaffolded by Claude Code, and implemented, debugged, and tested by you (Codex). Planning docs (`SPEC.md`, `ROADMAP.md`, `RISKS.md`, `TASKS.md`) are written by/with Claude Code and are authoritative — treat them as your spec, not as suggestions. `TASKS.md` is written specifically as your handoff brief: read it in full before starting, and implement tasks **in the order listed**, one at a time.

## Repo layout — read this before creating any file

**All application code lives inside `app/`. The repo root is planning-docs-only.**

```
/                       ← planning docs only: SPEC.md, ROADMAP.md, RISKS.md,
                          TASKS.md, REVIEW.md, AGENTS.md, CLAUDE.md,
                          .gitignore, README.md
/app/                   ← everything else lives here
  /app/src/
  /app/convex/
  /app/package.json
  /app/dist/            ← build output, gitignored
```

**Never create a `package.json`, `src/`, `convex/`, or any build artifact at repo root.** If you find yourself about to run `npm install` or `npm run build` and your working directory is the repo root, stop — `cd app` first.

## Commands — always run from inside `app/`

```
cd app
npm install
npm run dev        # local dev server
npm run build      # production build → app/dist
npm test           # test suite (if/when configured)
npx convex dev      # local Convex dev deployment
npx convex deploy   # production Convex deployment (Task 11 only)
```

Do not attempt these from repo root — there is no `package.json` there.

## Stack facts (see SPEC.md §2 for full justification)

- Frontend: React + Vite, TypeScript, Tailwind CSS. **Static build only** — no SSR, no Node server. This is required because the production host (Hostinger shared hosting) can only serve static files.
- Backend: **Convex** (hosted, not self-hosted). All data access and business logic goes through Convex queries/mutations, not a separate API server.
- Auth: Convex Auth or Clerk — see `RISKS.md` R-3 for the decision process; don't assume one without checking what's already been decided in this project's history.
- PWA: `vite-plugin-pwa`. Installable, offline app-shell caching. Offline does NOT mean offline data mutation — see Task 10's scope boundary in `TASKS.md`.
- Design tokens: electric violet + cyan accents, **light background** (not dark mode default). Exact values live in the Tailwind config once scaffolded — check there before hardcoding a hex value in a component.

## How to work a task from TASKS.md

1. Read the full task entry: goal, scope boundaries (IN/OUT), and acceptance criteria.
2. Respect the OUT boundaries as strictly as the IN ones — building extra "obviously useful" functionality outside a task's declared scope is not helpful here; it makes review harder and can violate a non-goal in `SPEC.md`.
3. If an acceptance criterion can't be met without a decision that hasn't been made (check `RISKS.md` for BLOCKING items relevant to the current phase), stop and surface this rather than guessing.
4. When done, fill out a `REVIEW.md` entry for the task using its template before moving to the next task.
5. Verify security/isolation-sensitive acceptance criteria (role checks, owner-scoped data) with an actual negative test (attempt the disallowed action and confirm rejection), not just by inspecting that the "happy path" works.

## Non-negotiables

- No payment integration in v1 (`SPEC.md` non-goals).
- No server-side code outside Convex functions — nothing that needs a persistent Node process, since it won't run on Hostinger.
- Role-based access checks must exist at the Convex function level, not only in client-side routing/UI hiding.
- The double-booking check (Task 8) must be atomic inside a single Convex mutation — this is a named BLOCKING risk (`RISKS.md` R-4), not a nice-to-have.
