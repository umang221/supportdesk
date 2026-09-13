import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import {
  HomeIcon,
  TicketIcon,
  CustomersIcon,
  KnowledgeIcon,
  AnalyticsIcon,
  TeamIcon,
  SettingsIcon,
} from "@/components/ui/icons";

export const DEFAULT_NAV_ITEMS = [
  { label: "Home", href: "/", icon: HomeIcon },
  { label: "Tickets", href: "/tickets", icon: TicketIcon },
  { label: "Customers", href: "/customers", icon: CustomersIcon },
  { label: "Knowledge Base", href: "/knowledge", icon: KnowledgeIcon },
  { label: "Analytics", href: "/analytics", icon: AnalyticsIcon },
  { label: "Team", href: "/team", icon: TeamIcon },
  { label: "Settings", href: "/settings", icon: SettingsIcon },
];

/**
 * Primary application navigation rail (240px per DESIGN.md).
 * `footer` is an optional slot for a signed-in user menu — left empty until
 * auth exists rather than rendering a placeholder identity.
 */
export function Sidebar({ items = DEFAULT_NAV_ITEMS, activeHref, footer, className }) {
  return (
    <nav aria-label="Primary" className={cn("flex h-full w-60 flex-col bg-surface-card", className)}>
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border-subtle px-lg">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-sm font-semibold text-white">
          S
        </span>
        <span className="text-label-md font-semibold text-text-primary">SupportDesk</span>
      </div>

      <ul className="flex-1 space-y-1 overflow-y-auto p-sm">
        {items.map(({ label, href, icon: Icon }) => {
          const isActive = href === activeHref;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-sm py-sm text-label-md transition-colors",
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

      {footer ? <div className="shrink-0 border-t border-border-subtle p-sm">{footer}</div> : null}
    </nav>
  );
}
