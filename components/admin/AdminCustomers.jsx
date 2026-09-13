"use client";

import { useMemo, useState } from "react";
import { Avatar, Badge, Select, TableHeaderCell, TableRow, TableCell } from "@/components/ui";
import { SearchIcon } from "@/components/ui/icons";

const OPEN_STATUSES = new Set(["open", "pending", "on_hold"]);

function matchesSearch(customer, query) {
  if (!query) return true;
  return `${customer.name} ${customer.company} ${customer.email}`.toLowerCase().includes(query.toLowerCase());
}

/** Customer roster with per-customer ticket volume, searchable and filterable by plan. */
export function AdminCustomers({ customers, tickets }) {
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("all");

  const plans = useMemo(() => [...new Set(customers.map((customer) => customer.plan))], [customers]);

  const filtered = useMemo(() => {
    return customers
      .filter((customer) => (plan === "all" ? true : customer.plan === plan))
      .filter((customer) => matchesSearch(customer, search));
  }, [customers, search, plan]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-headline-md text-text-primary">Customers</h1>
        <p className="text-body-sm text-text-tertiary">Every customer account and their ticket history.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="relative flex min-w-[200px] flex-1 items-center">
          <span className="sr-only">Search customers</span>
          <SearchIcon className="pointer-events-none absolute left-3 h-4 w-4 text-text-tertiary" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, company, or email..."
            className="h-9 w-full rounded-lg border border-border-subtle bg-surface-card pl-9 pr-3 text-body-sm text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent-subtle"
          />
        </label>

        <label className="sr-only" htmlFor="admin-customer-plan-filter">
          Filter by plan
        </label>
        <Select id="admin-customer-plan-filter" value={plan} onChange={(event) => setPlan(event.target.value)}>
          <option value="all">All plans</option>
          {plans.map((planName) => (
            <option key={planName} value={planName}>
              {planName}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-subtle p-space-xl text-center">
          <p className="text-body-md font-medium text-text-primary">No customers match these filters</p>
          <p className="text-body-sm text-text-tertiary">Try a different search term or plan.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border-subtle">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr>
                <TableHeaderCell>Customer</TableHeaderCell>
                <TableHeaderCell>Company</TableHeaderCell>
                <TableHeaderCell className="w-28">Plan</TableHeaderCell>
                <TableHeaderCell className="w-24">Open</TableHeaderCell>
                <TableHeaderCell className="w-24">Total</TableHeaderCell>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => {
                const customerTickets = tickets.filter((ticket) => ticket.customerId === customer.id);
                const open = customerTickets.filter((ticket) => OPEN_STATUSES.has(ticket.status)).length;

                return (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar name={customer.name} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-body-sm font-medium text-text-primary">{customer.name}</p>
                          <p className="truncate text-label-sm text-text-tertiary">{customer.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-text-secondary">{customer.company}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="neutral">{customer.plan}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{open}</TableCell>
                    <TableCell className="whitespace-nowrap">{customerTickets.length}</TableCell>
                  </TableRow>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
