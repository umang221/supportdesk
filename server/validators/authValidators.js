const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Basic shape/format validation for login input. Does not check the input
 * against the database — that's authService's job (verifyCredentials).
 */
export function validateLoginInput(data) {
  const email = typeof data?.email === "string" ? data.email.trim() : "";
  const password = typeof data?.password === "string" ? data.password : "";

  const errors = {};
  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  }

  return { valid: Object.keys(errors).length === 0, errors, email, password };
}
