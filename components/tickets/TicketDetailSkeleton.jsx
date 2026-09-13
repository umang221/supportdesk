import { cn } from "@/lib/utils/cn";

function Bar({ className }) {
  return <div className={cn("animate-pulse rounded bg-surface-container", className)} aria-hidden="true" />;
}

/**
 * Shown briefly while switching tickets, standing in for the network
 * round-trip a real API-backed detail view would have. Structure mirrors
 * TicketDetailHeader + TicketCustomerPanel + a couple of message bubbles.
 */
export function TicketDetailSkeleton() {
  return (
    <div role="status" aria-label="Loading ticket details" className="flex h-full flex-col gap-6 p-space-lg">
      <div className="space-y-2">
        <Bar className="h-3 w-16" />
        <Bar className="h-5 w-2/3" />
        <div className="flex gap-2">
          <Bar className="h-6 w-24" />
          <Bar className="h-6 w-28" />
          <Bar className="h-6 w-16" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Bar className="h-8 w-8 shrink-0 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Bar className="h-3 w-32" />
          <Bar className="h-3 w-24" />
        </div>
      </div>

      <div className="space-y-3">
        <Bar className="h-16 w-full" />
        <Bar className="h-16 w-4/5" />
      </div>
    </div>
  );
}
