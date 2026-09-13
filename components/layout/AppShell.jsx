"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { CloseIcon } from "@/components/ui/icons";

/**
 * Overall page frame: fixed sidebar + header on desktop, collapsing to an
 * off-canvas drawer below the `lg` breakpoint (DESIGN.md §Layout & Spacing).
 * `activeHref`/`user`/`sidebarFooter` are passed straight through to the
 * nav/header primitives; omit `user` until real auth data exists. `navVariant`
 * lets a section (e.g. the admin area) swap in a different nav list instead
 * of Sidebar's default — passed as a plain string (not the icon-bearing item
 * list itself) since that list contains component references, and those
 * can't cross the server/client boundary from a Server Component page into
 * this Client Component; Sidebar resolves the actual items client-side.
 */
export function AppShell({ activeHref, user, sidebarFooter, navVariant, children }) {
  const [isMobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!isMobileNavOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") setMobileNavOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileNavOpen]);

  return (
    <div className="flex h-dvh bg-canvas-bg">
      <div className="hidden border-r border-border-subtle lg:block">
        <Sidebar activeHref={activeHref} footer={sidebarFooter} variant={navVariant} />
      </div>

      {isMobileNavOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="relative z-10 h-full w-64 border-r border-border-subtle bg-surface-card shadow-xl"
          >
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation menu"
              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
            <Sidebar activeHref={activeHref} footer={sidebarFooter} variant={navVariant} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Header user={user} onMenuClick={() => setMobileNavOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
