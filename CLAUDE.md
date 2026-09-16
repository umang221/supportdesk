@AGENTS.md

# SupportDesk Working Rules

Full spec: `SUPPORTDESK_PROJECT_CONTEXT.txt` (read it before large-scale
implementation; this file is a durable summary, not a replacement).

## Language

- JavaScript/JSX only. Never `.ts`/`.tsx`. Never convert the project to
  TypeScript. Prefer readable code over clever/advanced patterns.

## Architecture (approved decisions)

- Use Next.js App Router route handlers (`app/api/*/route.js`) — no
  separate Express server.
- Route handlers stay thin; business logic lives in server-side
  services/models/validators (`server/`).
- Auth: secure HTTP-only session cookies, verified server-side. Do not
  introduce JWT unless a concrete requirement later makes it necessary.
- Attachment/avatar storage: Cloudinary (decided and implemented — see
  `server/attachments/`). Ticket attachments use `type: "authenticated"`
  delivery with short-lived signed URLs regenerated on every read
  (`attachmentService.js`); avatars use standard public delivery with a
  deterministic per-owner `public_id` (`avatarService.js`) since a profile
  picture isn't sensitive content and needs a stable, directly-usable URL.
  Both share config/env-var validation via `cloudinaryConfig.js`.

## UI / Design

- Direction: "quietly premium enterprise software" (see context doc §5) —
  not a generic AI-dashboard look.
- The Agent Workspace is the core screen, not an analytics dashboard.
- Approved design artifacts/screenshots are the visual source of truth for
  the screen they cover. Screens without an approved design inherit the
  established design system (typography, spacing, colors, components)
  rather than inventing new patterns.

## Security

- Never trust client-supplied identity, role, ownership, or IDs — derive
  the user from the server-side session.
- Enforce object-level authorization on every sensitive operation.
- Hash passwords with bcrypt/Argon2. Validate ticket state transitions
  server-side, not just in the UI.
- Never expose secrets to the client; never put secrets under
  `NEXT_PUBLIC_*`. Never log passwords, tokens, or other secrets.

## Testing

- Unit/integration/e2e tests are written alongside each feature, not
  deferred to a final "testing phase."

## Git safety

- Commit at meaningful milestones with clear messages. Never commit
  secrets. Checkpoint before risky changes. No destructive repo-wide
  changes without explicit confirmation.

## Learning / explanation requirement

- After a significant feature, briefly explain: what was built, key files,
  data flow, why the approach was chosen, security considerations, and
  tests performed. Keep it concise, not a tutorial.

## Working process

- Inspect existing code before changing it. Plan non-trivial work before
  implementing. Work in small logical milestones. Don't add dependencies or
  rewrite working code without a concrete reason. Don't create a duplicate
  component when a reusable one already exists.
