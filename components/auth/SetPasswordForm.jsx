"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

/** Completes an agent invite or admin-triggered reset (see app/api/auth/set-password/route.js) and signs the agent straight in. */
export function SetPasswordForm({ token }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data?.error || "Unable to set your password.");
        setSubmitting(false);
        return;
      }

      router.push("/tickets");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="set-password-new" className="text-label-sm font-medium text-text-secondary">
          New password
        </label>
        <input
          id="set-password-new"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-9 rounded-lg border border-border-subtle bg-surface-card px-space-sm text-body-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="set-password-confirm" className="text-label-sm font-medium text-text-secondary">
          Confirm password
        </label>
        <input
          id="set-password-confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="h-9 rounded-lg border border-border-subtle bg-surface-card px-space-sm text-body-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle"
        />
      </div>

      {error ? (
        <p role="alert" className="text-label-sm text-sla-critical-text">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={submitting || !password || !confirmPassword} className="mt-2 w-full">
        {submitting ? "Setting password..." : "Set password and sign in"}
      </Button>
    </form>
  );
}
