import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-space-sm bg-canvas-bg px-space-lg text-center">
      <h1 className="text-headline-md text-text-primary">404 — Page not found</h1>
      <p className="max-w-sm text-body-sm text-text-tertiary">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Link href="/" className="text-body-sm text-primary hover:underline">
        Back to SupportDesk
      </Link>
    </div>
  );
}
