"use client";

import { useMemo, useState } from "react";
import { Button, Card } from "@/components/ui";
import { getPasswordStrength } from "@/lib/utils/password-strength";

/**
 * Self-service change-password form, shared by the staff and customer
 * profile pages — same fields/validation/strength-meter pattern as
 * CustomerRegisterForm's password field, plus a "current password" gate
 * neither registration nor the token-based reset flows need. `onSubmit`
 * does the actual API call and should throw (with `.fieldErrors` where
 * relevant) on failure — this component only owns form state and display.
 */
export function ChangePasswordForm({ onSubmit }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  function validateClientSide() {
    const errors = {};
    if (!currentPassword) errors.currentPassword = "Current password is required.";
    if (!newPassword) {
      errors.newPassword = "New password is required.";
    } else if (newPassword.length < 8) {
      errors.newPassword = "Must be at least 8 characters.";
    }
    if (!confirmPassword) {
      errors.confirmPassword = "Confirm your new password.";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setSuccess(false);

    const clientErrors = validateClientSide();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      await onSubmit({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(true);
    } catch (err) {
      if (err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      } else {
        setFormError(err.message || "Unable to change your password.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <h2 className="mb-3 text-label-sm font-medium text-text-secondary">Change password</h2>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="change-password-current" className="text-label-sm font-medium text-text-secondary">
            Current password
          </label>
          <input
            id="change-password-current"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(fieldErrors.currentPassword)}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="h-9 rounded-lg border border-border-subtle bg-canvas-bg px-space-sm text-body-sm text-text-primary focus:border-primary focus:bg-surface-card focus:outline-none focus:ring-2 focus:ring-accent-subtle"
          />
          {fieldErrors.currentPassword ? (
            <p role="alert" className="text-label-sm text-sla-critical-text">
              {fieldErrors.currentPassword}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="change-password-new" className="text-label-sm font-medium text-text-secondary">
            New password
          </label>
          <input
            id="change-password-new"
            type="password"
            autoComplete="new-password"
            minLength={8}
            aria-invalid={Boolean(fieldErrors.newPassword)}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="h-9 rounded-lg border border-border-subtle bg-canvas-bg px-space-sm text-body-sm text-text-primary focus:border-primary focus:bg-surface-card focus:outline-none focus:ring-2 focus:ring-accent-subtle"
          />
          {strength ? (
            <div className="flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-hover">
                <div className={`h-full rounded-full transition-all ${strength.width} ${strength.className}`} />
              </div>
              <span className="text-label-sm text-text-tertiary">{strength.label}</span>
            </div>
          ) : null}
          {fieldErrors.newPassword ? (
            <p role="alert" className="text-label-sm text-sla-critical-text">
              {fieldErrors.newPassword}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="change-password-confirm" className="text-label-sm font-medium text-text-secondary">
            Confirm new password
          </label>
          <input
            id="change-password-confirm"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(fieldErrors.confirmPassword) || passwordsMismatch}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="h-9 rounded-lg border border-border-subtle bg-canvas-bg px-space-sm text-body-sm text-text-primary focus:border-primary focus:bg-surface-card focus:outline-none focus:ring-2 focus:ring-accent-subtle"
          />
          {fieldErrors.confirmPassword ? (
            <p role="alert" className="text-label-sm text-sla-critical-text">
              {fieldErrors.confirmPassword}
            </p>
          ) : passwordsMismatch ? (
            <p role="alert" className="text-label-sm text-sla-critical-text">
              Passwords do not match.
            </p>
          ) : null}
        </div>

        {formError ? (
          <p role="alert" className="text-label-sm text-sla-critical-text">
            {formError}
          </p>
        ) : null}
        {success ? <p className="text-label-sm text-sla-good-text">Password updated.</p> : null}

        <Button
          type="submit"
          disabled={submitting || !currentPassword || !newPassword || !confirmPassword}
          className="self-start"
        >
          {submitting ? "Updating..." : "Update password"}
        </Button>
      </form>
    </Card>
  );
}
