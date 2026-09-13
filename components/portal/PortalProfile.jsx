import { Avatar, Card } from "@/components/ui";

/**
 * Read-only account/contact info. There's no auth or account-editing backend
 * yet, so this intentionally doesn't pretend to be an editable form.
 */
export function PortalProfile({ customer }) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-headline-md text-text-primary">Profile</h1>

      <Card className="flex items-center gap-3">
        <Avatar name={customer?.name} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-body-md font-medium text-text-primary">{customer?.name}</p>
          <p className="truncate text-body-sm text-text-tertiary">
            {customer?.company} · {customer?.plan} plan
          </p>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-label-sm font-medium text-text-secondary">Contact details</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-body-sm">
          <dt className="text-text-tertiary">Email</dt>
          <dd className="text-text-primary">{customer?.email}</dd>
          <dt className="text-text-tertiary">Phone</dt>
          <dd className="text-text-primary">{customer?.phone ?? "—"}</dd>
          <dt className="text-text-tertiary">Company</dt>
          <dd className="text-text-primary">{customer?.company}</dd>
          <dt className="text-text-tertiary">Plan</dt>
          <dd className="text-text-primary">{customer?.plan}</dd>
        </dl>
        <p className="mt-4 text-label-sm text-text-tertiary">
          To update your contact details or plan, please open a ticket with our support team.
        </p>
      </Card>
    </div>
  );
}
