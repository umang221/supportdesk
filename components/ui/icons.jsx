import { cn } from "@/lib/utils/cn";

function IconBase({ className, children, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5", className)}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </IconBase>
  );
}

export function TicketIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M4 5h16v10l-2 5H6l-2-5Z" />
      <path d="M4 12h4l1.6 2.4h4.8L16 12h4" />
    </IconBase>
  );
}

export function CustomersIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c0-4.1 3.4-7 7.5-7s7.5 2.9 7.5 7" />
    </IconBase>
  );
}

export function KnowledgeIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M12 6.5c-1.6-1.3-4-2-7-2v12.5c3 0 5.4.7 7 2 1.6-1.3 4-2 7-2V4.5c-3 0-5.4.7-7 2Z" />
      <path d="M12 6.5v12.5" />
    </IconBase>
  );
}

export function AnalyticsIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M3 20h18" />
      <path d="M6.5 20v-7" />
      <path d="M12.5 20V8" />
      <path d="M18.5 20v-11" />
    </IconBase>
  );
}

export function TeamIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="9" r="3" />
      <circle cx="16.5" cy="10.5" r="2.25" />
      <path d="M3.5 20c0-3.6 2.8-6 6-6s6 2.4 6 6" />
      <path d="M14 14.4c2.4.5 4 2.5 4 5.6" />
    </IconBase>
  );
}

export function SettingsIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="3" />
      <line x1="19" y1="12" x2="21.5" y2="12" />
      <line x1="16.95" y1="16.95" x2="18.72" y2="18.72" />
      <line x1="12" y1="19" x2="12" y2="21.5" />
      <line x1="7.05" y1="16.95" x2="5.28" y2="18.72" />
      <line x1="5" y1="12" x2="2.5" y2="12" />
      <line x1="7.05" y1="7.05" x2="5.28" y2="5.28" />
      <line x1="12" y1="5" x2="12" y2="2.5" />
      <line x1="16.95" y1="7.05" x2="18.72" y2="5.28" />
    </IconBase>
  );
}

export function SearchIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <line x1="16.2" y1="16.2" x2="20.5" y2="20.5" />
    </IconBase>
  );
}

export function BellIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M6 8.5a6 6 0 0 1 12 0c0 4.2 1.4 5.7 2 6.5H4c.6-.8 2-2.3 2-6.5Z" />
      <path d="M10 18a2 2 0 0 0 4 0" />
    </IconBase>
  );
}

export function HelpIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="600" fontFamily="sans-serif" stroke="none" fill="currentColor">
        ?
      </text>
    </IconBase>
  );
}

export function MenuIcon(props) {
  return (
    <IconBase {...props}>
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </IconBase>
  );
}

export function CloseIcon(props) {
  return (
    <IconBase {...props}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </IconBase>
  );
}

export function ChevronLeftIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M15 5.5 8.5 12l6.5 6.5" />
    </IconBase>
  );
}

export function SendIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M4 12 20 4l-6.5 16-2.7-6.8L4 12Z" />
    </IconBase>
  );
}

export function FilterIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M4 5.5h16" />
      <path d="M7.5 12h9" />
      <path d="M10.5 18.5h3" />
    </IconBase>
  );
}
