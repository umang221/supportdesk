import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { SetPasswordForm } from "@/components/auth/SetPasswordForm";

export const metadata = { title: "Set your password · SupportDesk" };

export default async function SetPasswordPage({ searchParams }) {
  const user = await getCurrentUser();
  if (user) redirect("/tickets");

  const { token } = await searchParams;

  return (
    <main id="main-content" className="flex min-h-dvh flex-1 items-center justify-center bg-canvas-bg px-space-lg">
      <div className="w-full max-w-105 rounded-lg border border-border-subtle bg-surface-card p-space-2xl shadow-sm">
        <div className="mb-space-lg flex flex-col items-center gap-1 text-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-base font-semibold text-white">
            S
          </span>
          <h1 className="mt-2 text-headline-md text-text-primary">Set your password</h1>
          <p className="text-body-sm text-text-tertiary">Choose a password to finish setting up your account.</p>
        </div>

        {token ? (
          <SetPasswordForm token={token} />
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-body-sm text-text-secondary">
              This link is missing its setup token, so there&rsquo;s nothing to complete here. Use the link
              from your invite or password-reset email, or ask an admin to resend it.
            </p>
            <Link href="/login" className="text-body-sm text-primary hover:underline">
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
