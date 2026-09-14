import { Card } from "@/components/ui";

/** A single headline metric tile (ticket volume, SLA compliance, etc). `hint` is optional supporting text under the value. */
export function MetricCard({ label, value, hint }) {
  return (
    <Card className="flex flex-col gap-1">
      <p className="text-label-sm text-text-tertiary">{label}</p>
      <p className="text-headline-metric text-text-primary">{value}</p>
      {hint ? <p className="text-label-sm text-text-tertiary">{hint}</p> : null}
    </Card>
  );
}
