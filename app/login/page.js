import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Log in · SupportDesk" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/tickets");

  return (
    <main id="main-content" className="flex min-h-dvh flex-1 items-center justify-center bg-canvas-bg px-space-lg">
      <div className="w-full max-w-105 rounded-lg border border-border-subtle bg-surface-card p-space-2xl shadow-sm">
        <div className="mb-space-lg flex flex-col items-center gap-1 text-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-base font-semibold text-white">
            S
          </span>
          <h1 className="mt-2 text-headline-md text-text-primary">Sign in to SupportDesk</h1>
          <p className="text-body-sm text-text-tertiary">Use your agent account to continue.</p>
        </div>
        <LoginForm />
        <p className="mt-space-lg text-center text-body-sm text-text-tertiary">
          Looking for support?{" "}
          <Link href="/portal/login" className="text-primary hover:underline">
            Sign in to the customer portal
          </Link>
        </p>
      </div>
    </main>
  );
}
