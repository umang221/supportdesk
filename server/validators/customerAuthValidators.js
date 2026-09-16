import { validatePasswordInput } from "@/server/validators/adminValidators";
import { HttpError } from "@/server/utils/http-error";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requireEmail(data) {
  const email = typeof data?.email === "string" ? data.email.trim() : "";
  if (!email || !EMAIL_PATTERN.test(email)) {
    throw new HttpError(400, "Enter a valid email address.", {
      code: "validation_error",
      fieldErrors: { email: "Enter a valid email address." },
    });
  }
  return email;
}

export function validateCustomerRegisterInput(data) {
  const errors = {};

  const name = typeof data?.name === "string" ? data.name.trim() : "";
  if (!name) errors.name = "Name is required.";

  let email;
  try {
    email = requireEmail(data);
  } catch (error) {
    errors.email = error.fieldErrors.email;
  }

  if (Object.keys(errors).length > 0) {
    throw new HttpError(400, "Invalid registration input.", { code: "validation_error", fieldErrors: errors });
  }

  const password = validatePasswordInput(data?.password);
  const company = typeof data?.company === "string" ? data.company.trim() : undefined;
  const phone = typeof data?.phone === "string" ? data.phone.trim() : undefined;

  return { name, email, password, company, phone };
}

export function validateCustomerLoginInput(data) {
  const email = requireEmail(data);
  const password = typeof data?.password === "string" ? data.password : "";
  if (!password) {
    throw new HttpError(400, "Password is required.", {
      code: "validation_error",
      fieldErrors: { password: "Password is required." },
    });
  }
  return { email, password };
}

export function validateForgotPasswordInput(data) {
  return { email: requireEmail(data) };
}

export function validateResetPasswordInput(data) {
  const token = typeof data?.token === "string" ? data.token : "";
  if (!token) {
    throw new HttpError(400, "Missing token.", { code: "validation_error" });
  }
  const password = validatePasswordInput(data?.password);
  return { token, password };
}

const OWN_PROFILE_UPDATABLE_FIELDS = ["name", "phone", "company"];

/**
 * Validates PATCH /api/portal/customers/me input — deliberately rejects any
 * field outside OWN_PROFILE_UPDATABLE_FIELDS (same pattern as
 * adminValidators.validateUpdateOwnProfileInput), so `plan` (billing-
 * controlled) and `email` (its own, more sensitive flow) can never be
 * changed through this path even by mistake.
 */
export function validateCustomerUpdateProfileInput(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new HttpError(400, "Request body must be a JSON object.", { code: "validation_error" });
  }

  const disallowedFields = Object.keys(data).filter((key) => !OWN_PROFILE_UPDATABLE_FIELDS.includes(key));
  if (disallowedFields.length > 0) {
    throw new HttpError(400, `These fields cannot be changed here: ${disallowedFields.join(", ")}.`, {
      code: "protected_field",
      fieldErrors: Object.fromEntries(disallowedFields.map((key) => [key, "This field cannot be updated here."])),
    });
  }

  const patch = {};
  if (data.name !== undefined) {
    const name = typeof data.name === "string" ? data.name.trim() : "";
    if (!name) {
      throw new HttpError(400, "Name cannot be empty.", { code: "validation_error", fieldErrors: { name: "Required." } });
    }
    patch.name = name;
  }
  if (data.phone !== undefined) {
    patch.phone = typeof data.phone === "string" ? data.phone.trim() : "";
  }
  if (data.company !== undefined) {
    patch.company = typeof data.company === "string" ? data.company.trim() : "";
  }

  if (Object.keys(patch).length === 0) {
    throw new HttpError(400, "No updatable fields provided.", { code: "validation_error" });
  }

  return patch;
}
