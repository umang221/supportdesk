"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Avatar } from "@/components/ui/Avatar";
import { HomeIcon, TicketIcon, PlusIcon, UserIcon, MenuIcon, CloseIcon, LogoutIcon } from "@/components/ui/icons";
import { logoutCustomer } from "@/lib/api/portal";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/portal", icon: HomeIcon },
  { label: "My Tickets", href: "/portal/tickets", icon: TicketIcon },
  { label: "New Ticket", href: "/portal/tickets/new", icon: PlusIcon },
  { label: "Profile", href: "/portal/profile", icon: UserIcon },
];

/**
 * Frame for the customer-facing portal: a top nav bar (not the agent
 * Sidebar+workspace shell) and a centered, max-width content column — a
 * deliberately different shape from the Agent Workspace so the two areas
 * read as distinct products sharing one design system.
 */
export function PortalShell({ activeHref, customer, children }) {
  const router = useRouter();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logoutCustomer();
    } finally {
      router.push("/portal/login");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-canvas-bg">
      <header className="border-b border-border-subtle bg-surface-card">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-space-lg">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-white">
            S
          </span>
          <span className="text-label-md font-semibold text-text-primary">SupportDesk</span>
          <span className="hidden text-label-sm text-text-tertiary sm:inline">Customer Portal</span>

          <nav aria-label="Portal" className="ml-auto hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
              const isActive = href === activeHref;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-space-sm py-space-xs text-label-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent-subtle text-primary"
                      : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 md:ml-3">
            <Avatar name={customer?.name} size="sm" />
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              aria-label="Sign out"
              title="Sign out"
              className="hidden h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover disabled:opacity-50 md:inline-flex"
            >
              <LogoutIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover md:hidden"
            >
              {isMenuOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {isMenuOpen ? (
          <nav aria-label="Portal" className="border-t border-border-subtle px-space-lg py-space-sm md:hidden">
            <ul className="space-y-1">
              {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
                const isActive = href === activeHref;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-space-sm py-space-sm text-body-sm font-medium",
                        isActive
                          ? "bg-accent-subtle text-primary"
                          : "text-text-secondary hover:bg-surface-hover"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  </li>
                );
              })}
              <li className="border-t border-border-subtle pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex w-full items-center gap-2 rounded-md px-space-sm py-space-sm text-body-sm font-medium text-text-secondary hover:bg-surface-hover disabled:opacity-50"
                >
                  <LogoutIcon className="h-4 w-4" />
                  Sign out
                </button>
              </li>
            </ul>
          </nav>
        ) : null}
      </header>

      <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-space-lg py-space-lg">{children}</main>
    </div>
  );
}
