"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { resetCustomerPassword } from "@/lib/api/portal";

export function ResetPasswordForm({ token }) {
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
      await resetCustomerPassword({ token, password });
      router.push("/portal");
      router.refresh();
    } catch (err) {
      setError(err.message || "Unable to reset your password.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reset-password-new" className="text-label-sm font-medium text-text-secondary">
          New password
        </label>
        <input
          id="reset-password-new"
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
        <label htmlFor="reset-password-confirm" className="text-label-sm font-medium text-text-secondary">
          Confirm password
        </label>
        <input
          id="reset-password-confirm"
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
        {submitting ? "Resetting..." : "Reset password"}
      </Button>
    </form>
  );
}
