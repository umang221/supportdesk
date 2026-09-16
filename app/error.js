"use client";

import { useEffect } from "react";

/**
 * Root error boundary — catches an unhandled render/render-time error
 * anywhere under this layout instead of showing Next.js's default (blank in
 * production) error screen. Route handlers already have their own
 * consistent error shape (server/utils/http-error.js); this is the
 * equivalent safety net for the page-rendering side.
 */
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-space-sm bg-canvas-bg px-space-lg text-center">
      <h1 className="text-headline-md text-text-primary">Something went wrong</h1>
      <p className="max-w-sm text-body-sm text-text-tertiary">
        An unexpected error occurred. You can try again, or head back to the workspace.
      </p>
      <div className="mt-space-sm flex items-center gap-space-md">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-space-md text-label-md font-medium text-white hover:bg-primary-hover"
        >
          Try again
        </button>
        <a href="/tickets" className="text-body-sm text-primary hover:underline">
          Go to Tickets
        </a>
      </div>
    </div>
  );
}
