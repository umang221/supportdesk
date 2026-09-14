import { HomeIcon, TeamIcon, UserIcon, CustomersIcon, TicketIcon, SettingsIcon, FilterIcon } from "@/components/ui/icons";

/** Sidebar nav for the admin/management area — distinct from the agent workspace's default nav. */
export const ADMIN_NAV_ITEMS = [
  { label: "Overview", href: "/admin", icon: HomeIcon },
  { label: "Teams", href: "/admin/teams", icon: TeamIcon },
  { label: "Agents", href: "/admin/agents", icon: UserIcon },
  { label: "Customers", href: "/admin/customers", icon: CustomersIcon },
  { label: "Tickets & SLA", href: "/admin/tickets", icon: TicketIcon },
  { label: "SLA Policy", href: "/admin/sla-policy", icon: SettingsIcon },
  { label: "Audit Log", href: "/admin/audit", icon: FilterIcon },
];
