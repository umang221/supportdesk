/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  // Enables next/navigation's forbidden() for server-side 403s (RBAC on
  // /admin) — see lib/auth/authorization.js.
  experimental: {
    authInterrupts: true,
  },
  // Baseline security headers applied to every response. Deliberately not
  // including a Content-Security-Policy here — a strict CSP needs careful
  // per-route tuning (Next's inline hydration scripts, Tailwind, etc.) that
  // risks breaking the app if guessed at rather than tested; flagged as a
  // follow-up rather than shipped half-verified.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
