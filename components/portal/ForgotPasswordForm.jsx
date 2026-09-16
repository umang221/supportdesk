"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { requestCustomerPasswordReset } from "@/lib/api/portal";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await requestCustomerPasswordReset({ email });
      setMessage(result.message);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (message) {
    return <p className="text-body-sm text-text-secondary">{message}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="forgot-password-email" className="text-label-sm font-medium text-text-secondary">
          Email
        </label>
        <input
          id="forgot-password-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-9 rounded-lg border border-border-subtle bg-surface-card px-space-sm text-body-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle"
        />
      </div>

      {error ? (
        <p role="alert" className="text-label-sm text-sla-critical-text">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={submitting || !email.trim()} className="mt-2 w-full">
        {submitting ? "Sending..." : "Send reset link"}
      </Button>
    </form>
  );
}
