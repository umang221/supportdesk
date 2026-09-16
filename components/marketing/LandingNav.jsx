"use client";

import { useState } from "react";
import Link from "next/link";
import { MenuIcon, CloseIcon } from "@/components/ui/icons";
import { AnchorLink } from "./AnchorLink";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#workflow", label: "Workflow" },
  { href: "#security", label: "Security" },
];

/**
 * Marketing header for the "/" landing page only — distinct from the
 * authenticated app's Sidebar (components/layout/Sidebar.jsx). Needs its
 * own small client component just for the mobile menu's open/closed state;
 * everything else here is static.
 */
export function LandingNav({ dashboardHref }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-border-subtle bg-surface-card/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-space-lg">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-white">
            S
          </span>
          <span className="text-label-md font-semibold text-text-primary">SupportDesk</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <AnchorLink
              key={link.href}
              href={link.href}
              className="text-body-sm text-text-secondary hover:text-text-primary"
            >
              {link.label}
            </AnchorLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {dashboardHref ? (
            <Link
              href={dashboardHref}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-space-md text-label-md font-medium text-white transition hover:bg-primary-hover active:scale-[0.98]"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex h-9 items-center justify-center rounded-lg px-space-md text-label-md font-medium text-text-secondary transition hover:bg-surface-hover hover:text-text-primary"
              >
                Staff Sign In
              </Link>
              <Link
                href="/portal/register"
                className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-space-md text-label-md font-medium text-white transition hover:bg-primary-hover active:scale-[0.98]"
              >
                Get Support
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover md:hidden"
        >
          {isOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>

      {isOpen ? (
        <nav aria-label="Primary" className="border-t border-border-subtle bg-surface-card px-space-lg py-space-md md:hidden">
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <AnchorLink
                  href={link.href}
                  onNavigate={() => setIsOpen(false)}
                  className="block rounded-md px-space-sm py-space-sm text-body-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                >
                  {link.label}
                </AnchorLink>
              </li>
            ))}
            <li className="mt-space-sm flex flex-col gap-2 border-t border-border-subtle pt-space-sm">
              {dashboardHref ? (
                <Link
                  href={dashboardHref}
                  className="block rounded-md bg-primary px-space-sm py-space-sm text-center text-label-md font-medium text-white hover:bg-primary-hover"
                >
                  Go to dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/portal/register"
                    className="block rounded-md bg-primary px-space-sm py-space-sm text-center text-label-md font-medium text-white hover:bg-primary-hover"
                  >
                    Get Support
                  </Link>
                  <Link
                    href="/login"
                    className="block rounded-md border border-border-subtle px-space-sm py-space-sm text-center text-label-md font-medium text-text-primary hover:bg-surface-hover"
                  >
                    Staff Sign In
                  </Link>
                </>
              )}
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
