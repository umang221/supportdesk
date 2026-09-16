import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/portal/current-customer";
import { ResetPasswordForm } from "@/components/portal/ResetPasswordForm";

export const metadata = { title: "Reset password · Customer Portal" };

export default async function PortalResetPasswordPage({ searchParams }) {
  const customer = await getCurrentCustomer();
  if (customer) redirect("/portal");

  const { token } = await searchParams;

  return (
    <main id="main-content" className="flex min-h-dvh flex-1 items-center justify-center bg-canvas-bg px-space-lg">
      <div className="w-full max-w-105 rounded-lg border border-border-subtle bg-surface-card p-space-2xl shadow-sm">
        <div className="mb-space-lg flex flex-col items-center gap-1 text-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-base font-semibold text-white">
            S
          </span>
          <h1 className="mt-2 text-headline-md text-text-primary">Choose a new password</h1>
        </div>

        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-body-sm text-text-secondary">
              This link is missing its reset token. Request a new one from the forgot-password page.
            </p>
            <Link href="/portal/forgot-password" className="text-body-sm text-primary hover:underline">
              Request a new link
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
