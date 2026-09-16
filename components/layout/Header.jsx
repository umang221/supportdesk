"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Avatar } from "@/components/ui/Avatar";
import { MenuIcon } from "@/components/ui/icons";
import { NotificationBell } from "./NotificationBell";

/**
 * Top app bar: mobile nav toggle, notifications, and the signed-in user's
 * own avatar (links to /profile). `user` is the sanitized session user from
 * getCurrentUser(); omit it on unauthenticated pages.
 *
 * A global "search tickets, customers, docs" box and a Help button used to
 * live here — both were purely decorative (no onChange/onClick at all, and
 * no search API or help destination existed to back them), which is worse
 * than having no control at all: they invited a real interaction and
 * silently did nothing. Removed rather than stubbed as "coming soon" —
 * per-queue search already exists and works (see TicketQueue's own search
 * input), and there's nothing this would add today beyond a promise to
 * build it later.
 */
export function Header({ onMenuClick, user, className }) {
  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center gap-3 border-b border-border-subtle bg-surface-card px-space-lg",
        className
      )}
    >
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover hover:text-text-primary lg:hidden"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      <div className="ml-auto flex items-center gap-1">
        <NotificationBell />
        <Link href="/profile" aria-label="Your profile" className="ml-1 rounded-full">
          <Avatar name={user?.name} src={user?.avatarUrl} />
        </Link>
      </div>
    </header>
  );
}
