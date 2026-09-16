"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { registerCustomer } from "@/lib/api/portal";
import { getPasswordStrength } from "@/lib/utils/password-strength";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CustomerRegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  function validateClientSide() {
    const errors = {};
    if (!name.trim()) errors.name = "Full name is required.";
    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      errors.email = "Enter a valid email address.";
    }
    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 8) {
      errors.password = "Must be at least 8 characters.";
    }
    if (!confirmPassword) {
      errors.confirmPassword = "Confirm your password.";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    const clientErrors = validateClientSide();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      await registerCustomer({ name, email, password, company });
      router.push("/portal");
      router.refresh();
    } catch (err) {
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      } else {
        setFormError(err.message || "Unable to create your account.");
      }
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="portal-register-name" className="text-label-sm font-medium text-text-secondary">
          Full name
        </label>
        <input
          id="portal-register-name"
          autoComplete="name"
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "portal-register-name-error" : undefined}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="h-9 rounded-lg border border-border-subtle bg-surface-card px-space-sm text-body-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle"
        />
        {fieldErrors.name ? (
          <p id="portal-register-name-error" role="alert" className="text-label-sm text-sla-critical-text">
            {fieldErrors.name}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="portal-register-email" className="text-label-sm font-medium text-text-secondary">
          Email
        </label>
        <input
          id="portal-register-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "portal-register-email-error" : undefined}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-9 rounded-lg border border-border-subtle bg-surface-card px-space-sm text-body-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle"
        />
        {fieldErrors.email ? (
          <p id="portal-register-email-error" role="alert" className="text-label-sm text-sla-critical-text">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="portal-register-company" className="text-label-sm font-medium text-text-secondary">
          Company <span className="text-text-tertiary">(optional)</span>
        </label>
        <input
          id="portal-register-company"
          autoComplete="organization"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          className="h-9 rounded-lg border border-border-subtle bg-surface-card px-space-sm text-body-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="portal-register-password" className="text-label-sm font-medium text-text-secondary">
          Password
        </label>
        <input
          id="portal-register-password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={fieldErrors.password ? "portal-register-password-error" : undefined}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-9 rounded-lg border border-border-subtle bg-surface-card px-space-sm text-body-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle"
        />
        {strength ? (
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-hover">
              <div className={`h-full rounded-full transition-all ${strength.width} ${strength.className}`} />
            </div>
            <span className="text-label-sm text-text-tertiary">{strength.label}</span>
          </div>
        ) : null}
        <p className="text-label-sm text-text-tertiary">At least 8 characters.</p>
        {fieldErrors.password ? (
          <p id="portal-register-password-error" role="alert" className="text-label-sm text-sla-critical-text">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="portal-register-confirm-password" className="text-label-sm font-medium text-text-secondary">
          Confirm password
        </label>
        <input
          id="portal-register-confirm-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(fieldErrors.confirmPassword) || passwordsMismatch}
          aria-describedby="portal-register-confirm-password-error"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="h-9 rounded-lg border border-border-subtle bg-surface-card px-space-sm text-body-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle"
        />
        {fieldErrors.confirmPassword ? (
          <p id="portal-register-confirm-password-error" role="alert" className="text-label-sm text-sla-critical-text">
            {fieldErrors.confirmPassword}
          </p>
        ) : passwordsMismatch ? (
          <p id="portal-register-confirm-password-error" role="alert" className="text-label-sm text-sla-critical-text">
            Passwords do not match.
          </p>
        ) : null}
      </div>

      {formError ? (
        <p role="alert" className="text-label-sm text-sla-critical-text">
          {formError}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={submitting || !name.trim() || !email.trim() || !password || !confirmPassword}
        className="mt-2 w-full"
      >
        {submitting ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
