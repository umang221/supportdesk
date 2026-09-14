/**
 * Runs before each test file's modules load (vitest `setupFiles`). Points
 * every test at a dedicated, disposable database — never the dev database
 * in .env.local — so nothing here can touch real seeded data. Requires a
 * local MongoDB reachable at 127.0.0.1:27017 (the same instance
 * `npm run dev`/`npm run seed` already assume).
 *
 * Cleanup is deliberately per-test-file (each integration test deletes
 * exactly the documents it created, in its own afterAll) rather than a
 * single global "drop the whole database" here — Vitest isolates test
 * files from each other, so a global drop could race a file that's still
 * running.
 */
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/supportdesk_test";
process.env.NODE_ENV = process.env.NODE_ENV ?? "test";
// Deliberately unset so tests exercise the safe, no-network default paths
// (log-transport email, "AI not configured") rather than depending on any
// developer's local .env.local secrets.
delete process.env.GEMINI_API_KEY;
delete process.env.EMAIL_HOST;
delete process.env.CLOUDINARY_CLOUD_NAME;
