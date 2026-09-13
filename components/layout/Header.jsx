"use client";

import { cn } from "@/lib/utils/cn";
import { Avatar } from "@/components/ui/Avatar";
import { SearchIcon, BellIcon, HelpIcon, MenuIcon } from "@/components/ui/icons";

/**
 * Top app bar: mobile nav toggle, global search, and account/notification
 * actions. `user` is the sanitized session user from getCurrentUser(); omit
 * it on unauthenticated pages.
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

      <label className="relative hidden max-w-md flex-1 items-center sm:flex">
        <span className="sr-only">Search tickets, customers, docs</span>
        <SearchIcon className="pointer-events-none absolute left-3 h-4 w-4 text-text-tertiary" />
        <input
          type="search"
          placeholder="Search tickets, customers, docs..."
          className="h-9 w-full rounded-lg border border-border-subtle bg-canvas-bg pl-9 pr-14 text-body-sm text-text-primary placeholder:text-text-tertiary focus:border-primary focus:bg-surface-card focus:outline-none focus:ring-2 focus:ring-accent-subtle"
        />
        <span
          aria-hidden="true"
          className="absolute right-2 rounded border border-border-subtle bg-surface-hover px-space-xs py-space-2xs text-[11px] font-medium text-text-tertiary"
        >
          ⌘K
        </span>
      </label>

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          aria-label="Notifications"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover hover:text-text-primary"
        >
          <BellIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Help"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover hover:text-text-primary"
        >
          <HelpIcon className="h-5 w-5" />
        </button>
        <Avatar name={user?.name} className="ml-1" />
      </div>
    </header>
  );
}
