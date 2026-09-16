/**
 * Cosmetic-only heuristic (length + character variety) — never enforced,
 * just feedback while typing. Shared by every password-entry form
 * (registration, self-service change-password) so the meter reads
 * identically everywhere rather than drifting between copies.
 */
export function getPasswordStrength(password) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { label: "Weak", className: "bg-sla-critical-text", width: "w-1/3" };
  if (score <= 3) return { label: "Fair", className: "bg-sla-warning-text", width: "w-2/3" };
  return { label: "Strong", className: "bg-sla-good-text", width: "w-full" };
}
