import { USER_ROLES } from "@/server/models/User";
import { PRIORITIES } from "@/lib/constants/priorities";
import { isValidObjectId } from "@/server/validators/ticketValidators";
import { HttpError } from "@/server/utils/http-error";

export const MIN_PASSWORD_LENGTH = 8;

// No `password` field: agents never get a password set on their behalf —
// createUser() generates an invite link instead (architecture decision:
// agents are admin-created but set their own password via invite).
export function validateCreateUserInput(data) {
  const errors = {};

  const name = typeof data?.name === "string" ? data.name.trim() : "";
  if (!name) errors.name = "Name is required.";

  const email = typeof data?.email === "string" ? data.email.trim() : "";
  if (!email || !email.includes("@")) errors.email = "A valid email is required.";

  let role = data?.role ?? "agent";
  if (!USER_ROLES.includes(role)) errors.role = "Invalid role.";

  let team = data?.team ?? null;
  if (team && !isValidObjectId(team)) errors.team = "Must be a valid team id.";

  const title = typeof data?.title === "string" ? data.title.trim() : undefined;

  if (Object.keys(errors).length > 0) {
    throw new HttpError(400, "Invalid user input.", { code: "validation_error", fieldErrors: errors });
  }

  return { name, email, role, team: team || null, title };
}

/** Shared shape/strength check for a new password — used by both the agent set-password and customer register/reset flows. */
export function validatePasswordInput(password) {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    throw new HttpError(400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`, {
      code: "validation_error",
      fieldErrors: { password: `Must be at least ${MIN_PASSWORD_LENGTH} characters.` },
    });
  }
  return password;
}

export function validateUpdateUserInput(data) {
  const patch = {};
  if (data?.role !== undefined) {
    if (!USER_ROLES.includes(data.role)) {
      throw new HttpError(400, "Invalid role.", { code: "validation_error", fieldErrors: { role: "Invalid role." } });
    }
    patch.role = data.role;
  }
  if (data?.team !== undefined) {
    if (data.team !== null && !isValidObjectId(data.team)) {
      throw new HttpError(400, "Invalid team.", { code: "validation_error", fieldErrors: { team: "Must be a valid team id." } });
    }
    patch.team = data.team;
  }
  if (data?.title !== undefined) {
    patch.title = typeof data.title === "string" ? data.title.trim() : "";
  }
  if (data?.isActive !== undefined) {
    patch.isActive = Boolean(data.isActive);
  }
  if (Object.keys(patch).length === 0) {
    throw new HttpError(400, "No updatable fields provided.", { code: "validation_error" });
  }
  return patch;
}

const OWN_PROFILE_UPDATABLE_FIELDS = ["name", "title"];

/**
 * Validates PATCH /api/users/me input — deliberately rejects (rather than
 * silently drops) any field outside OWN_PROFILE_UPDATABLE_FIELDS, the same
 * pattern ticketValidators.validateUpdateTicketInput uses, so a client
 * attempting to send role/team/isActive here gets a clear error instead of
 * silent no-op — and so those fields staying unreachable from this path
 * doesn't depend on this function quietly doing the right thing.
 */
export function validateUpdateOwnProfileInput(data) {
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
  if (data.title !== undefined) {
    patch.title = typeof data.title === "string" ? data.title.trim() : "";
  }

  if (Object.keys(patch).length === 0) {
    throw new HttpError(400, "No updatable fields provided.", { code: "validation_error" });
  }

  return patch;
}

/**
 * Validates a self-service change-password request — shared shape for both
 * the staff and customer "me" password routes. `newPassword` reuses
 * validatePasswordInput for the same length-only policy already applied at
 * registration/invite/reset.
 */
export function validateChangePasswordInput(data) {
  const currentPassword = typeof data?.currentPassword === "string" ? data.currentPassword : "";
  if (!currentPassword) {
    throw new HttpError(400, "Current password is required.", {
      code: "validation_error",
      fieldErrors: { currentPassword: "Required." },
    });
  }
  const newPassword = validatePasswordInput(data?.newPassword);
  return { currentPassword, newPassword };
}

export function validateTeamInput(data) {
  const errors = {};
  const name = typeof data?.name === "string" ? data.name.trim() : "";
  if (!name) errors.name = "Name is required.";
  const description = typeof data?.description === "string" ? data.description.trim() : "";

  if (Object.keys(errors).length > 0) {
    throw new HttpError(400, "Invalid team input.", { code: "validation_error", fieldErrors: errors });
  }
  return { name, description };
}

export function validateTeamPatchInput(data) {
  const patch = {};
  if (data?.name !== undefined) {
    const name = typeof data.name === "string" ? data.name.trim() : "";
    if (!name) {
      throw new HttpError(400, "Name cannot be empty.", { code: "validation_error", fieldErrors: { name: "Required." } });
    }
    patch.name = name;
  }
  if (data?.description !== undefined) {
    patch.description = typeof data.description === "string" ? data.description.trim() : "";
  }
  if (Object.keys(patch).length === 0) {
    throw new HttpError(400, "No updatable fields provided.", { code: "validation_error" });
  }
  return patch;
}

export function validateSlaPolicyInput(data) {
  const errors = {};
  const priority = data?.priority;
  if (!Object.values(PRIORITIES).includes(priority)) errors.priority = "Invalid priority.";

  const firstResponseMinutes = Number(data?.firstResponseMinutes);
  if (!Number.isFinite(firstResponseMinutes) || firstResponseMinutes <= 0) {
    errors.firstResponseMinutes = "Must be a positive number.";
  }

  const resolutionMinutes = Number(data?.resolutionMinutes);
  if (!Number.isFinite(resolutionMinutes) || resolutionMinutes <= 0) {
    errors.resolutionMinutes = "Must be a positive number.";
  }

  if (Object.keys(errors).length > 0) {
    throw new HttpError(400, "Invalid SLA policy input.", { code: "validation_error", fieldErrors: errors });
  }

  return { priority, firstResponseMinutes, resolutionMinutes };
}
