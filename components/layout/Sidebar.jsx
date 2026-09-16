import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { TicketIcon, AnalyticsIcon, TeamIcon, ChevronLeftIcon } from "@/components/ui/icons";
import { ADMIN_NAV_ITEMS } from "@/lib/admin/nav-items";

// "/" is the public marketing landing page (app/page.js), not part of this
// nav — a signed-in agent's "home" is the ticket workspace itself, which
// Tickets below already covers, so there's no separate Home entry.
export const DEFAULT_NAV_ITEMS = [
  { label: "Tickets", href: "/tickets", icon: TicketIcon },
  { label: "Analytics", href: "/analytics", icon: AnalyticsIcon },
  // UI-level convenience only — /admin/* is still enforced server-side by
  // requireRole in app/admin/layout.js regardless of whether this is shown.
  { label: "Admin", href: "/admin", icon: TeamIcon, roles: ["admin"] },
];

const NAV_VARIANTS = {
  default: DEFAULT_NAV_ITEMS,
  admin: ADMIN_NAV_ITEMS,
};

/**
 * Primary application navigation rail (240px per DESIGN.md).
 * `footer` is an optional slot for a signed-in user menu (see UserMenu) —
 * omit it on unauthenticated pages rather than rendering a placeholder
 * identity. `variant` picks
 * which nav item list to render (see NAV_VARIANTS) — a plain string so
 * Server Component pages can request the admin nav without passing the
 * icon-bearing item list itself across the server/client boundary; `items`
 * still wins if explicitly provided. `role` filters out items with a
 * `roles` allowlist the current user doesn't have — purely cosmetic (the
 * actual access control lives server-side, see requireRole).
 */
export function Sidebar({ items, variant = "default", activeHref, footer, role, className }) {
  const navItems = (items ?? NAV_VARIANTS[variant] ?? DEFAULT_NAV_ITEMS).filter(
    (item) => !item.roles || item.roles.includes(role)
  );
  const isAdminVariant = variant === "admin";

  return (
    <nav aria-label="Primary" className={cn("flex h-full w-60 flex-col bg-surface-card", className)}>
      <Link
        href="/tickets"
        className="flex h-14 shrink-0 items-center gap-2 border-b border-border-subtle px-space-lg transition-colors hover:bg-surface-hover"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-semibold text-white">
          S
        </span>
        <span className="text-label-md font-semibold text-text-primary">SupportDesk</span>
      </Link>

      {isAdminVariant ? (
        <div className="shrink-0 border-b border-border-subtle p-space-sm">
          <Link
            href="/tickets"
            className="flex items-center gap-2 rounded-md px-space-sm py-space-sm text-label-md text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Back to Workspace
          </Link>
        </div>
      ) : null}

      <ul className="flex-1 space-y-1 overflow-y-auto p-space-sm">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = href === activeHref;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-space-sm py-space-sm text-label-md transition-colors",
                  isActive
                    ? "bg-accent-subtle text-primary"
                    : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-text-tertiary")} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>

      {footer ? <div className="shrink-0 border-t border-border-subtle p-space-sm">{footer}</div> : null}
    </nav>
  );
}
