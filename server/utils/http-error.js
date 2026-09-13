/**
 * Typed error a service layer can throw to tell a thin route handler exactly
 * which HTTP status/body to send, without the handler needing to know why
 * (bad input vs. not found vs. an invalid state transition).
 */
export class HttpError extends Error {
  constructor(status, message, { code, fieldErrors } = {}) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export function toErrorResponse(error) {
  if (error instanceof HttpError) {
    return {
      status: error.status,
      body: {
        error: error.message,
        ...(error.code ? { code: error.code } : {}),
        ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
      },
    };
  }
  console.error(error);
  return { status: 500, body: { error: "Internal server error." } };
}
