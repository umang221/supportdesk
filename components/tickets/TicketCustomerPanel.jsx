import { Avatar } from "@/components/ui/Avatar";

/** Customer identity + contact details. */
export function TicketCustomerPanel({ customer }) {
  if (!customer) {
    return (
      <div className="border-b border-border-subtle p-space-lg">
        <h3 className="mb-2 text-label-sm font-medium text-text-secondary">Customer</h3>
        <p className="text-body-sm text-text-tertiary">Customer information unavailable.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 border-b border-border-subtle p-space-lg">
      <h3 className="text-label-sm font-medium text-text-secondary">Customer</h3>

      <div className="flex items-center gap-2">
        <Avatar name={customer.name} src={customer.avatarUrl} />
        <div className="min-w-0">
          <p className="truncate text-body-sm font-medium text-text-primary">{customer.name}</p>
          <p className="truncate text-label-sm text-text-tertiary">
            {customer.company} · {customer.plan} plan
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-label-sm">
        <dt className="text-text-tertiary">Email</dt>
        <dd className="truncate text-text-primary">{customer.email}</dd>
        <dt className="text-text-tertiary">Phone</dt>
        <dd className="truncate text-text-primary">{customer.phone ?? "—"}</dd>
      </dl>
    </div>
  );
}
