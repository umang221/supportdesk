"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui";
import { loginCustomer } from "@/lib/api/portal";

export function CustomerLoginForm({ redirectTo = "/portal" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await loginCustomer({ email, password });
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err.message || "Unable to sign in.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="portal-login-email" className="text-label-sm font-medium text-text-secondary">
          Email
        </label>
        <input
          id="portal-login-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-9 rounded-lg border border-border-subtle bg-surface-card px-space-sm text-body-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="portal-login-password" className="text-label-sm font-medium text-text-secondary">
            Password
          </label>
          <Link href="/portal/forgot-password" className="text-label-sm text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <input
          id="portal-login-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-9 rounded-lg border border-border-subtle bg-surface-card px-space-sm text-body-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle"
        />
      </div>

      {error ? (
        <p role="alert" className="text-label-sm text-sla-critical-text">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={submitting || !email.trim() || !password} className="mt-2 w-full">
        {submitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
