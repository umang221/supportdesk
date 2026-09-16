export function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-card p-space-lg">
      <span className="mb-space-md inline-flex h-9 w-9 items-center justify-center rounded-md bg-accent-subtle text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="text-body-lg font-semibold text-text-primary">{title}</h3>
      <p className="mt-space-xs text-body-sm text-text-secondary">{description}</p>
    </div>
  );
}
