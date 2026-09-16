import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/portal/current-customer";
import { CustomerLoginForm } from "@/components/portal/CustomerLoginForm";

export const metadata = { title: "Sign in · Customer Portal" };

export default async function PortalLoginPage() {
  const customer = await getCurrentCustomer();
  if (customer) redirect("/portal");

  return (
    <main id="main-content" className="flex min-h-dvh flex-1 items-center justify-center bg-canvas-bg px-space-lg">
      <div className="w-full max-w-105 rounded-lg border border-border-subtle bg-surface-card p-space-2xl shadow-sm">
        <div className="mb-space-lg flex flex-col items-center gap-1 text-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-base font-semibold text-white">
            S
          </span>
          <h1 className="mt-2 text-headline-md text-text-primary">Sign in to your account</h1>
          <p className="text-body-sm text-text-tertiary">View your tickets and get help from our team.</p>
        </div>
        <CustomerLoginForm />
        <p className="mt-space-lg text-center text-body-sm text-text-tertiary">
          Don&rsquo;t have an account?{" "}
          <Link href="/portal/register" className="text-primary hover:underline">
            Create one
          </Link>
        </p>
        <p className="mt-space-sm text-center text-body-sm text-text-tertiary">
          Staff member?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </main>
  );
}
