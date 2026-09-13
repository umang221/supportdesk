import Link from "next/link";

export default function Forbidden() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-space-sm bg-canvas-bg px-space-lg text-center">
      <h1 className="text-headline-md text-text-primary">403 — Access denied</h1>
      <p className="max-w-sm text-body-sm text-text-tertiary">
        You don&apos;t have permission to view this page.
      </p>
      <Link href="/tickets" className="text-body-sm text-primary hover:underline">
        Go to Tickets
      </Link>
    </div>
  );
}
