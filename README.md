# SupportDesk

A customer support ticketing app: tickets, SLA tracking, a realtime agent
workspace, a customer portal, Gemini-based AI assist, and role-based admin.
Built with Next.js (App Router) and MongoDB, running as a single Node
process with no separate backend service.

## Live Demo

- **Live URL:** _not deployed yet — see [Deployment](#deployment)_

### Screenshots

_Add screenshots here, e.g.:_

- Agent workspace (ticket queue + conversation view)
- Ticket detail with SLA indicator and AI assist panel
- Customer portal ticket view
- Admin: teams, users, and audit log

## Project Highlights

- Full-stack app built entirely on Next.js route handlers and MongoDB — no
  separate API server.
- Role-based access control (agent / team lead / admin) enforced
  server-side, with object-level ownership checks on top of role checks.
- Separate customer-facing portal with its own authentication, ticket
  creation, and reply flow, isolated from the staff app.
- Realtime updates over Server-Sent Events for both agents and customers,
  with per-connection filtering so customers only ever see their own data.
- Automated SLA tracking: computed deadlines, a background sweep job, and
  notifications on state changes.
- On-demand AI assistance (Gemini) for ticket summaries, triage
  suggestions, and draft replies — always advisory, never automatic.
- File uploads via Cloudinary for both ticket attachments and profile
  avatars, using two different delivery/security models.
- Security practices: bcrypt password hashing, session invalidation on
  password change, rate limiting, and audit logging.
- 153 automated tests (Vitest) covering authentication, authorization,
  ticket workflow, and realtime/security-sensitive paths.

## Demo Walkthrough

Roughly what there is to click through:

1. Sign in at `/login` as a seeded agent and land on the ticket workspace —
   a queue on the left, conversation + SLA countdown on the right.
2. Open a ticket, reply, and (optionally) attach a file. The reply and any
   SLA/status change show up live in another agent's open session over SSE.
3. Use the AI panel on a ticket to generate a summary, a category/priority
   suggestion, or a draft reply — none of it is applied until you act on it.
4. Sign in at `/portal/login` as a seeded customer (separate session/cookie
   from the staff app), open a ticket, and reply — the agent's next reply
   appears on that page without a refresh.
5. As an admin, visit `/admin` for user/team management, `/admin/sla-policy`
   to edit SLA windows, and `/admin/audit` to see the audit trail those
   actions produce.

## Overview

SupportDesk has two sides:

- A staff app (`/login`, `/tickets`, `/admin`, `/analytics`, `/profile`)
  for agents, team leads, and admins.
- A customer portal (`/portal/*`) where customers register, open tickets,
  and reply on their own conversation thread.

Staff and customers use separate auth systems (different cookies, session
models, and service modules), so a browser can be signed into both at the
same time without conflict.

## Features

- Ticket lifecycle with a server-enforced status state machine
  (open → pending/on_hold → resolved → closed, with limited reopening).
- Per-priority SLA policy with computed deadlines and a background job that
  keeps SLA state current and notifies on approaching/critical/breached
  transitions.
- Realtime updates over Server-Sent Events for the agent workspace and for
  a customer's own open ticket.
- On-demand AI assist (Gemini): ticket summaries, category/priority
  suggestions, drafted replies, and an analytics narrative. Nothing the AI
  produces is applied or sent automatically.
- File attachments on ticket messages and profile avatars, both via
  Cloudinary.
- Self-service profile management for staff and customers: edit your own
  details, upload an avatar, change your own password.
- Admin area: user management, team management (create/rename/delete),
  SLA policy editing, and an audit log of sensitive and self-service
  actions.
- Rate limiting on auth, ticket creation, messaging, uploads, and password
  changes.

## Tech stack

- Next.js 16 (App Router) — route handlers under `app/api/**`, no separate
  API server
- React 19
- MongoDB / Mongoose 9
- Tailwind CSS v4
- bcryptjs for password hashing
- Cloudinary for attachment and avatar storage
- Nodemailer for outgoing email, with a log-only fallback transport
- Gemini API (`gemini-3.6-flash`), called directly over `fetch`, no SDK
- Vitest for unit and integration tests

JavaScript only, no TypeScript.

## Architecture

```
app/            Route handlers (app/api/**) and pages (App Router)
components/     UI, grouped by area: tickets, admin, analytics, portal, profile, sla, layout, ui
server/         models, services, validators, jobs, ai, email, attachments, realtime
lib/            Client-side API wrappers, auth/session helpers, constants, hooks
tests/          Vitest unit + integration tests
scripts/        Database seed script
```

Route handlers stay thin — parse the request, call a service, shape the
response. Validation, authorization, and persistence live in
`server/services/*`, so the same logic runs whether it's called from a
route handler, the SLA job, or a test.

The app runs as a single Node process. Three things are cached on Node's
`global` object so Next.js dev mode's module reloading doesn't reset them
on every edit:

- the Mongoose connection (`server/utils/db.js`)
- the in-process realtime event bus (`server/realtime/eventBus.js`)
- the in-memory rate limiter's counters (`server/utils/rateLimit.js`)

That also means all three are process-local — see Future improvements.

## Core data model

Ten Mongoose models (`server/models/`). The relationships that matter:

```
Customer ──< Ticket >── Team
              │
              ├──< Message  (author is a User or a Customer, via authorModel)
              │
              └── assignee → User

User ──< Team              (an agent optionally belongs to one team)
User/Customer ──< Notification / AuditLog / Session / CustomerSession
```

- `Ticket` requires a `customer` and a `team`; `assignee` is optional
  (nullable).
- `Message.author` is a polymorphic reference (`authorModel`: `"User"` or
  `"Customer"`), matching the same pattern used on `AuditLog.actor`.
- `SlaPolicy` holds one optional override document per priority — most
  installs run on the hardcoded defaults in `lib/constants/sla-policy.js`
  and never create a row here.
- Staff (`User`/`Session`) and customers (`Customer`/`CustomerSession`) are
  intentionally separate collections, not a shared "account" model with a
  type flag — see Authentication & authorization below.

## Authentication & authorization

Two separate auth systems:

| | Staff | Customer |
|---|---|---|
| Model | `User` | `Customer` |
| Session model | `Session` | `CustomerSession` |
| Cookie | `sd_session` | `sd_customer_session` |
| Roles | `agent`, `team_lead`, `admin` | none |
| Sign-up | Admin-created, via invite link | Self-registration |

Both use HTTP-only cookies holding a random session token, looked up
against the database on each request (`getCurrentUser()` /
`getCurrentCustomer()`, wrapped in React's `cache()` so a layout and its
page share one DB lookup per request). No JWTs — a session is revoked by
deleting its row.

Authorization is role-based and checked server-side:

- `hasRole(user, allowedRoles)` / `assertApiRole()` in route handlers,
  mapped to 401/403.
- `requireRole()` in Server Components/layouts, redirects or renders a 403
  page.
- Object-level checks live in the service layer. For example,
  `getTicketForCustomer(ticketId, customerId)` returns `null` for both "no
  such ticket" and "not your ticket" — portal routes map that to 404, never
  403, so a guessed ticket ID never confirms another customer's ticket
  exists.

Agents and admins aren't self-registered. An admin creates the account and
the agent finishes setup through a one-time invite link (`/set-password`),
the same flow used to reset a locked-out agent's password.

## Ticket management workflow

A ticket belongs to a customer and a team, and is optionally assigned to
one agent. Status transitions are validated in one place
(`server/services/ticketStateMachine.js`):

- `open`, `pending`, and `on_hold` move freely between each other, or
  forward to `resolved`/`closed`.
- `resolved`/`closed` can only be reopened to `open`, not back to
  `pending`/`on_hold` directly.

Assignment rules are enforced server-side: an agent can only assign a
ticket to themselves and can't unassign it; a team lead or admin can
assign to anyone or unassign. Assigning a ticket to a new agent creates a
notification and sends an email to that agent; reassigning to the same
agent again does neither.

Messages are one of three types: `agent_reply`, `customer_reply`, or
`internal_note`. Internal notes are agent-only and filtered out
server-side before a customer's message list is built
(`listMessagesForCustomerTicket`).

## SLA monitoring

Each priority has a first-response and resolution window, defined in
`lib/constants/sla-policy.js` and editable at runtime from
`/admin/sla-policy`. SLA windows are wall-clock durations from ticket
creation — there's no business-hours awareness.

SLA state (`healthy` → `approaching` → `critical` → `breached`) is derived
from how much of the resolution window is left (50% remaining =
approaching, 20% = critical). A background job
(`server/jobs/slaMonitorJob.js`), run by a small single-process scheduler
(`server/jobs/jobRunner.js`), sweeps active tickets, updates SLA state when
it changes, and — only on an actual transition — creates a notification
and, for approaching/breached, sends an email to the assignee.

## Realtime updates

Built on Server-Sent Events rather than WebSockets, since the app only
pushes data one direction.

- `server/realtime/eventBus.js` — an in-process `EventEmitter` with three
  event types: `ticket:updated`, `message:created`, `notification:created`.
- `app/api/realtime/route.js` — the staff SSE stream. Any authenticated
  staff member can already read any ticket via REST, so this broadcasts
  ticket/message events to every connection and filters only
  `notification:created` down to the recipient.
- `app/api/portal/realtime/route.js` — the customer SSE stream. Each
  connection is scoped to one ticket, verified with the same
  `getTicketForCustomer` ownership check used elsewhere in the portal,
  since a customer must never receive another customer's events. Internal
  notes are filtered out before anything is sent.
- `lib/realtime/realtimeClient.js` (staff) and
  `lib/realtime/portalRealtimeClient.js` (customer) are `EventSource`
  wrappers on the client. The portal client is a separate module, keyed
  per ticket rather than one shared connection, since a customer
  connection is only valid for the ticket it was opened for.

## AI features (Gemini)

AI output is advisory and on-demand, triggered by a button click, never
run automatically or written back to a ticket on its own:

- Ticket summary — a short summary of the conversation so far.
- Category & priority suggestion — a category label and priority with a
  short rationale; the agent decides whether to apply it.
- Suggested reply — a draft the agent can edit before sending.
- Analytics narrative — an on-demand readout of the computed analytics
  summary.

If `GEMINI_API_KEY` isn't set, AI actions return a 503 ("AI features are
not configured") and the rest of the app, including the rest of Analytics,
keeps working.

## File uploads (Cloudinary)

Two upload paths, handled differently:

- Ticket attachments (`server/attachments/attachmentService.js`) — uploaded
  with Cloudinary's `authenticated` delivery type, which can't be fetched
  from a bare URL. A signed URL is generated on each read (5-minute
  expiry) and never stored. Capped at 10 MB, restricted to a fixed MIME
  allowlist (PNG/JPEG/GIF/WebP/PDF/plain text).
- Profile avatars (`server/attachments/avatarService.js`) — uploaded with
  standard public delivery to a deterministic `public_id` per owner, so a
  re-upload replaces the old one. Public and non-expiring, since an avatar
  isn't sensitive and the UI needs a stable URL to render directly.

Both share one config module (`server/attachments/cloudinaryConfig.js`). If
Cloudinary env vars aren't set, uploads return a 503 and everything else
keeps working.

## Email system

`server/email/emailService.js` has one function per lifecycle event:
ticket created, ticket resolved, ticket assigned, agent reply, customer
reply, SLA approaching, SLA breached, agent invited, agent password reset
(admin-initiated), and customer password reset (self-service).

Every send goes through `safeSend`, which catches and logs failures so a
broken SMTP config or a transient error never fails the write that
triggered it.

Transport selection (`server/email/emailProvider.js`) is automatic: if
`EMAIL_HOST`, `EMAIL_USER`, and `EMAIL_PASSWORD` are all set, it sends real
mail via Nodemailer; otherwise it logs what would have been sent. That's
the default in local development.

## Security considerations

- Session cookies are HTTP-only and not readable from client-side
  JavaScript.
- Sensitive operations re-derive the acting user/customer from the
  server-side session and re-check authorization there — role, ownership,
  and identity are never trusted from client input.
- Passwords are hashed with bcrypt. Self-service password changes require
  the current password and invalidate every other active session for that
  account (the current session is excluded, so you don't log yourself out).
- Rate limiting (`server/utils/rateLimit.js`, an in-memory sliding window)
  covers login, registration, forgot-password, self-service password/
  profile/avatar changes, and portal ticket creation/messaging/attachment
  uploads. Auth routes are keyed by IP+email; authenticated routes by
  account ID.
- Self-service functions (`updateOwnProfile`, `updateOwnAvatar`,
  `changeOwnPassword`) are separate from the admin-facing `updateUser` —
  role, team, and active-status fields aren't reachable through them.
- Sensitive admin actions and self-service profile/avatar/password changes
  are recorded to an audit log (`/admin/audit`), attributed to the account
  that performed them.
- No secrets are committed. `.env.local` is gitignored; `.env.example`
  lists every variable with empty values.

## Example API routes

A representative slice of `app/api/**` — all of it follows the same thin
route / service-layer pattern described above.

| Method | Route | Auth | Notes |
|---|---|---|---|
| `POST` | `/api/auth/login` | none | Staff login, rate-limited by IP+email |
| `GET` | `/api/tickets` | staff | List/filter tickets |
| `PATCH` | `/api/tickets/[id]/status` | staff | Status change, validated by the state machine |
| `PATCH` | `/api/tickets/[id]/assign` | staff | Assignment, role-gated (see Ticket management workflow) |
| `POST` | `/api/tickets/[id]/ai/summary` | staff | On-demand Gemini summary |
| `GET` | `/api/realtime` | staff | SSE stream |
| `POST` | `/api/portal/auth/register` | none | Customer self-registration, rate-limited |
| `GET`/`POST` | `/api/portal/tickets/[id]/messages` | customer | Reply on own ticket only (`getTicketForCustomer`) |
| `GET` | `/api/portal/realtime` | customer | SSE stream scoped to one `ticketId` |
| `POST` | `/api/admin/teams` | admin | Create team |
| `DELETE` | `/api/admin/teams/[id]` | admin | Delete team (blocked if tickets still reference it) |
| `PATCH` | `/api/users/me` | staff | Self-service profile update |

## Testing

```bash
npm test        # vitest — unit + integration
npm run lint
npm run build
```

Integration tests run against a disposable `supportdesk_test` MongoDB
database, never the dev database, and clean up what they create. Currently
19 test files, 153 tests, covering:

- staff and customer authentication
- object-level authorization (assignment rules, ticket/notification
  ownership isolation)
- the ticket status state machine and SLA calculations
- the customer → agent reply → resolve flow, including attachments
- ticket assignment notifications and emails, including the case where the
  email send fails
- portal realtime filtering (same-ticket events forwarded, other-ticket
  and internal-note events not) and cross-customer isolation
- self-service profile/avatar/password changes and their audit log entries
- team lifecycle (create/rename/delete, duplicate names, delete with
  members, delete blocked by tickets)
- rate-limit enforcement

Some route handlers depend on `next/headers`'s `cookies()`, which needs
real Next.js request scope. Where that matters, tests mock `next/headers`
directly (see `tests/integration/portalRealtime.test.js`); otherwise they
test the underlying service functions the routes call.

## Local setup

Prerequisites: Node 20+, a local MongoDB instance.

```bash
npm install
cp .env.example .env.local   # fill in MONGODB_URI at minimum
npm run seed                 # seeds demo teams, agents, customers, tickets
npm run dev
```

Open http://localhost:3000 — the landing page is public.

- Staff sign in at `/login`. `hana.kobayashi@supportdesk.io` is the seeded
  admin account; the seed script prints the shared demo password.
- Customers sign in at `/portal/login` with any seeded customer email
  (same demo password), or register a new account at `/portal/register`.

Cloudinary, email, and Gemini variables are optional in development —
each feature falls back to a clear "not configured" response instead of
crashing when unset.

## Environment variables

From `.env.example`:

```
MONGODB_URI=                 # required

APP_BASE_URL=                # used to build links in outgoing emails; defaults to
                              # http://localhost:3000 if unset

CLOUDINARY_CLOUD_NAME=       # optional — used for both ticket attachments and avatars
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

EMAIL_HOST=                  # optional — all three must be set to send real email;
EMAIL_PORT=587                # otherwise email is logged, not sent
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM="SupportDesk <no-reply@supportdesk.local>"

GEMINI_API_KEY=              # optional — AI features return 503 if unset
```

No `NEXT_PUBLIC_*` variables exist in the app.

## Deployment

Not currently deployed — there's no Dockerfile, `vercel.json`, or CI/CD
config in the repo. In practice this would run well on Vercel (it's a
standard Next.js App Router app) with a MongoDB Atlas connection string,
since nothing in the codebase assumes a specific host. The one real
constraint is the single-process design (see Architecture): the SLA job,
event bus, and rate limiter all live in process memory, so this should run
as a single instance, not behind a multi-instance autoscaler, without the
changes described in Future improvements.

## Key Learning Outcomes

Things that stood out while building this:

- Keeping business logic in a service layer (not route handlers) makes it
  possible to reuse the exact same code path from a route, a background
  job, and a test — and forces you to notice when a rule would otherwise
  have been duplicated.
- Running two parallel auth systems (staff and customer) without merging
  them is more code up front, but avoids a whole category of "is this a
  staff session or a customer session" bugs later.
- For cross-tenant-style isolation (one customer's data from another's),
  returning `null` for "not found" and "not yours" alike, and mapping both
  to a 404, is a small pattern that closes off a real class of enumeration
  bugs.
- Server-Sent Events look simple until you add a second audience: the
  staff stream can safely broadcast to everyone, but the customer stream
  needed its own connection-scoping and filtering to avoid leaking data
  across accounts.
- Deliberately building this as a single Node process (in-memory job
  runner, event bus, rate limiter) makes the system easier to reason
  about, but it also makes the actual scaling limits concrete instead of
  theoretical.
- Writing integration tests against a real, disposable MongoDB database
  instead of mocking it caught issues that mocks would have hidden,
  especially around ownership filtering and cleanup.

## Future improvements

- Move off in-process state for horizontal scaling. The job runner,
  realtime event bus, and rate limiter all live in one process's memory.
  Running more than one instance would need a shared store — Redis
  pub/sub for realtime, a shared counter store for rate limiting, a real
  job queue for the SLA sweep.
- Business-hours-aware SLA clocks. SLA windows are wall-clock only; a team
  with defined operating hours would want the countdown to pause outside
  them.
- Customer-facing notifications beyond the open ticket page. The portal
  has live updates for whichever ticket is open, but no cross-ticket
  notification bell — the `Notification` model is staff-only.
- HTML email templates. Transactional email is plain text right now.
