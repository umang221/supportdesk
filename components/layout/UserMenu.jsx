"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { LogoutIcon } from "@/components/ui/icons";

/**
 * Signed-in identity + logout, rendered into Sidebar's footer slot.
 */
export function UserMenu({ user }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) return null;

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Avatar name={user.name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-label-sm font-medium text-text-primary">{user.name}</p>
        <p className="truncate text-[11px] text-text-tertiary">{user.title || user.email}</p>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        aria-label="Log out"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-surface-hover hover:text-text-primary disabled:opacity-50"
      >
        <LogoutIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
