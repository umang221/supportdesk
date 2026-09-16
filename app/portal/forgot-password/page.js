import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/portal/current-customer";
import { ForgotPasswordForm } from "@/components/portal/ForgotPasswordForm";

export const metadata = { title: "Forgot password · Customer Portal" };

export default async function PortalForgotPasswordPage() {
  const customer = await getCurrentCustomer();
  if (customer) redirect("/portal");

  return (
    <main id="main-content" className="flex min-h-dvh flex-1 items-center justify-center bg-canvas-bg px-space-lg">
      <div className="w-full max-w-105 rounded-lg border border-border-subtle bg-surface-card p-space-2xl shadow-sm">
        <div className="mb-space-lg flex flex-col items-center gap-1 text-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-base font-semibold text-white">
            S
          </span>
          <h1 className="mt-2 text-headline-md text-text-primary">Reset your password</h1>
          <p className="text-body-sm text-text-tertiary">
            Enter your email and we&rsquo;ll send you a link to reset your password.
          </p>
        </div>
        <ForgotPasswordForm />
        <p className="mt-space-lg text-center text-body-sm text-text-tertiary">
          <Link href="/portal/login" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
