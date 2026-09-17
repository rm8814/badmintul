# SPEC.md — badmintul.com

Badminton court booking platform: public landing page + role-based dashboard, installable as a PWA.

**Repo layout constraint (applies to every doc in this set):** all application code lives in `app/`. Repo root contains only planning docs (`SPEC.md`, `ROADMAP.md`, `RISKS.md`, `TASKS.md`, `REVIEW.md`, `AGENTS.md`, `CLAUDE.md`) plus root-level repo config (`.gitignore`, `README.md`, CI config if any). Nothing that builds or runs lives at root.

---

## 1. Roles & Core User Stories

### Superadmin (you)
- Approve/reject venue owner accounts and their venue listings.
- View all bookings, all venues, platform-wide metrics (bookings/day, active venues, GMV if payments land later).
- Suspend a venue or user.
- Configure global settings (booking lead-time limits, cancellation window, supported cities).

### Player
- Browse venues by city/area, see courts, price per hour, live availability calendar.
- Book a court slot (date + time range), see booking confirmation, view booking history.
- Cancel a booking within the allowed cancellation window.
- Install the app as a PWA on mobile home screen.

### Venue Owner
- Register a venue (name, address, photos, courts, operating hours, price per court/hour).
- Submit venue for superadmin approval.
- Once approved: manage court availability (block slots for maintenance), view incoming bookings, see basic revenue/utilization stats for their venue(s).
- Cannot see other venues' data.

---

## 2. Stack Decision & Justification

| Layer | Choice | Why |
|---|---|---|
| Frontend framework | React + Vite | Static build output — required to run on Hostinger shared hosting, which serves static files only (no Node runtime, no long-running processes). Next.js SSR is explicitly ruled out for this reason; Next.js in static-export mode is a fallback option but Vite is simpler for a pure SPA/PWA. |
| Backend/data | **Convex** | Per your preference over Supabase. Convex is a hosted reactive backend (functions + database + realtime subscriptions) — it runs entirely on Convex's cloud, not on your hosting. This decouples backend hosting from frontend hosting, which is exactly what makes the Hostinger constraint workable: Hostinger only ever serves static HTML/JS/CSS: it never runs your backend. Convex also gives you realtime availability updates (a slot going from open to booked reflects live across open clients) without hand-rolling WebSocket/polling logic — valuable for a booking calendar where double-booking races matter. |
| Auth | Convex Auth (or Clerk if Convex Auth proves too immature at build time — decide in Phase 1, see RISKS.md R-3) | Keeps auth colocated with the data layer; avoids a third service. |
| Hosting (frontend) | Hostinger shared hosting, static file upload (or Git-based deploy if the plan supports it) to `badmintul.com` | Fixed constraint, not chosen for merit. Static SPA build (`app/dist`) uploaded via FTP/File Manager or a CI step that FTPs the build output. |
| Hosting (backend) | Convex Cloud (managed, separate from Hostinger) | No alternative — Convex is not self-hostable in the free/standard tier used here. |
| PWA | `vite-plugin-pwa` (Workbox under the hood) | Standard, well-supported service worker + manifest generation for Vite. Gives installability + offline app-shell caching. |
| Styling | Tailwind CSS | Fast to theme; easy to encode the design tokens below as CSS variables / Tailwind theme extension. |
| Repo/VCS | GitHub, single repo, `app/` subfolder for all code | Per constraint. |

### Design tokens (UPSCALE-adjacent, light background)
- Primary: Electric Violet `#7C3AED` (adjust exact hex during scaffolding to match existing UPSCALE brand file if one exists)
- Accent: Cyan `#06B6D4`
- Background: light neutral (`#FAFAFA` / white), **not dark mode as default**
- Semantic: success (green), warning (amber), danger (red) — standard semantic scale, not violet/cyan
- These are directional; exact palette gets finalized as a Tailwind config in Phase 1 scaffolding, not hardcoded per-component.

---

## 3. Non-Goals (explicitly out of scope for v1)

- **Payments/online checkout.** Bookings are confirm-only in v1; payment collection (cash on arrival, transfer, or gateway integration) is a future phase. No Stripe/Midtrans/Xendit integration in v1.
- **Multi-language i18n.** English or Indonesian only, single locale, no language switcher.
- **Native mobile app.** PWA only — no React Native/Flutter wrapper.
- **Recurring/series bookings** (e.g., "book every Tuesday for a month"). Single-slot bookings only.
- **In-app messaging/chat** between player and venue owner.
- **Automated venue-owner onboarding** (KYC docs, business verification beyond manual superadmin review).
- **Analytics/BI dashboards beyond basic counts.** No charting library, no exportable reports in v1.
- **Multi-tenant white-labeling.** Single brand (badmintul.com), not a SaaS-for-other-brands product.

---

## 4. Acceptance Criteria (product-level, v1 "done")

1. A player can sign up, browse at least one seeded venue, view a real-time court availability calendar, and complete a booking end-to-end.
2. A venue owner can sign up, submit a venue with ≥1 court, and see it enter a "pending approval" state.
3. A superadmin can log in to a distinct dashboard view, see the pending venue, approve it, and the venue becomes visible to players immediately (no redeploy).
4. Double-booking the same court/slot is prevented at the data layer (Convex mutation-level check), not just UI-level.
5. The app installs as a PWA on Android Chrome and iOS Safari (Add to Home Screen), launches standalone (no browser chrome), and the app shell loads from cache when offline (data still requires network).
6. Production build is deployed and reachable at `https://badmintul.com` served from Hostinger, with Convex as the live backend.
7. Role-based routing: a player cannot reach superadmin or venue-owner-only routes, and vice versa (enforced both in UI routing and in Convex function-level auth checks).

---

## 5. Explicit Assumptions (flag if wrong)

- Single currency (IDR), no multi-currency.
- Single timezone (WIB) — no timezone conversion logic needed for v1.
- Venue owners can have more than one venue in the data model, even though v1 UI may only need to support one well.
- "Solo founder, no timeline pressure" means correctness and low maintenance burden are prioritized over shipping speed.
