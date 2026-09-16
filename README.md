# SupportDesk

A customer support ticketing and SLA management platform: a realtime agent
workspace, automatic SLA tracking, Gemini-powered AI assist, real-data
analytics, and role-based admin — built end to end on Next.js and MongoDB.

## Features

- **Ticketing with a real state machine** — open/pending/on_hold/resolved/closed,
  every transition validated server-side (`server/services/ticketStateMachine.js`).
- **SLA automation** — a per-priority policy computes each ticket's deadline;
  a background job (`server/jobs/slaMonitorJob.js`) sweeps active tickets,
  keeps their SLA state current, and raises notifications/emails on
  approaching/critical/breached transitions.
- **Realtime workspace** — ticket, message, and notification updates stream
  to connected agents over Server-Sent Events (`app/api/realtime`), so the
  workspace stays live without polling or a manual refresh.
- **AI assist (Gemini)** — on-demand ticket summaries, category/priority
  suggestions, and drafted replies (`server/ai/`). Every suggestion is
  advisory: nothing is ever auto-applied or auto-sent.
- **Analytics** — ticket volume, resolution time, first-response time, SLA
  compliance, and agent/team workload computed directly from MongoDB
  (`server/services/analyticsService.js`), with an optional on-demand AI
  narrative on top.
- **Admin & RBAC** — agent/team_lead/admin roles gate assignment,
  unassignment, and org management; admins manage users, teams, and SLA
  policy, with every sensitive action recorded to an audit log.
- **Customer portal** — customers self-register, sign in, reset a forgotten
  password, and create/view their own tickets, and reply on their own
  ticket's conversation thread (with attachments) — a separate session/cookie
  from the staff app (`server/services/customerAuthService.js`), so the two
  never collide in the same browser.
- **Admin-managed agents** — agents and admins are never self-registered;
  an admin creates an agent account and the agent completes setup via a
  one-time invite link (`/set-password`) — the same mechanism an admin uses
  to reset a locked-out agent's password.
- **Email + attachments** — transactional email on ticket lifecycle events
  (dev-safe log transport by default) and secure, size/type-validated
  ticket attachment uploads via Cloudinary, for both agents and customers.
- **Profiles & avatars** — every staff and customer account has a
  self-service profile page (`/profile`, `/portal/profile`): edit your own
  name/title (staff) or name/phone/company (customer), upload a profile
  photo, and change your own password (current-password-verified, and
  invalidates every other active session for that account). Admin-only
  fields (role, team, active status, plan) are never reachable through
  these self-service routes.
- **Audit logging** — every sensitive admin action *and* every self-service
  profile/avatar/password change (staff or customer) is recorded to an
  append-only audit log (`/admin/audit`), attributed to whichever account
  actually performed it.
- **Rate limiting** — beyond login, registration, and forgot-password,
  self-service password changes, profile/avatar updates, and portal ticket
  creation/messaging/attachment uploads are all throttled per-account
  (`server/utils/rateLimit.js`).

## Tech stack

Next.js 16 (App Router, route handlers only — no separate API server) ·
React 19 · MongoDB / Mongoose · Tailwind CSS v4 · bcryptjs (session auth) ·
Gemini API · Cloudinary · Nodemailer · Vitest

JavaScript throughout — no TypeScript.

## Getting started

Prerequisites: Node 20+, a local MongoDB instance (`mongodb://127.0.0.1:27017`
by default).

```bash
npm install
cp .env.example .env.local   # fill in MONGODB_URI at minimum
npm run seed                 # seeds demo teams, customers, agents, tickets
npm run dev
```

Open http://localhost:3000 — the landing page is public.

- **Staff** sign in at `/login` with a seeded agent account (see the seed
  script's output for the demo password). `hana.kobayashi@supportdesk.io`
  is the permanent seeded demo admin account.
- **Customers** sign in at `/portal/login` with any seeded customer email
  (same demo password), or self-register a new account at `/portal/register`.

All other environment variables in `.env.example` (Cloudinary, email, Gemini)
are optional in development: each feature degrades cleanly to a safe default
(a clear "not configured" response, or a log-only transport) rather than
crashing when its variables are unset.

## Testing

```bash
npm test        # vitest — unit + integration, against a disposable
                 # `supportdesk_test` database, never the dev database
npm run lint
npm run build
```

Integration tests cover authentication (staff and customer), object-level
authorization (assignment rules, notification/ticket ownership isolation),
the ticket state machine, SLA calculations, the full customer → agent
reply → resolve flow, portal messaging/attachments, self-service
profile/avatar/password changes and their audit-log entries, and rate-limit
enforcement. Every test cleans up exactly what it created.

## Project structure

```
app/            Route handlers (app/api/**) and pages (App Router)
components/     UI, organized by area (tickets, admin, analytics, portal, marketing, ui)
server/         Business logic: models, services, validators, jobs, ai, email, attachments
lib/            Client-side API wrappers, auth/session helpers, shared constants
tests/          Vitest unit + integration tests
scripts/        Database seed script
```

Route handlers stay thin — request parsing and response shaping only.
Business logic (validation, authorization, persistence) lives in
`server/services/*`, so it's the same code path whether it's called from a
route handler or a background job.

## Security notes

- Session auth via HTTP-only, `SameSite=Lax` cookies — never a client-readable
  token.
- Every sensitive operation re-derives the acting user from the server-side
  session and re-checks authorization there, never trusting a client-supplied
  role or id.
- Passwords hashed with bcrypt. Login, registration, forgot-password,
  self-service password changes, self-service profile/avatar updates, and
  portal ticket creation/messaging/attachment uploads are all rate-limited
  (per IP+account for the auth routes, per-account for everything else,
  since those already require a valid session).
- Self-service password changes require the current password and invalidate
  every other active session for that account.
- Ticket attachments are validated (size/MIME allowlist) and served only via
  short-lived signed URLs, scoped to the ticket they were uploaded to.
  Profile avatars are validated the same way but served via standard public
  delivery (not signed/expiring) — a deliberate difference, since an avatar
  needs a stable URL usable directly in the UI, and isn't sensitive content
  the way a ticket attachment can be.
- No secrets are committed — `.env.local` is gitignored; `.env.example`
  documents every variable with no real values.

## Known limitations

- The knowledge base, team, and settings areas referenced in the original
  product spec aren't built; the primary nav only links to what's actually
  implemented.
- This runs as a single Node process by design (in-memory job runner, event
  bus, and rate limiter) — appropriate for its current scope, but it would
  need a shared store (Redis, or similar) before running as multiple
  instances behind a load balancer.
