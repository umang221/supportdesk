import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// Mirrors jsconfig.json's "@/*" -> "./*" path alias so tests can import
// server/lib modules exactly the way app code does, without a second set of
// relative-path imports to maintain.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
    setupFiles: ["./tests/setup.js"],
    // Integration tests share one real MongoDB (see tests/setup.js) rather
    // than mocking Mongoose — run them serially so they don't race each
    // other's writes/cleanup against the same test database.
    fileParallelism: false,
    hookTimeout: 20_000,
    testTimeout: 20_000,
  },
  resolve: {
    alias: {
      "@": rootDir,
    },
  },
});
