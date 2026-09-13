/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  // Enables next/navigation's forbidden() for server-side 403s (RBAC on
  // /admin) — see lib/auth/authorization.js.
  experimental: {
    authInterrupts: true,
  },
};

export default nextConfig;
