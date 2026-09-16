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
