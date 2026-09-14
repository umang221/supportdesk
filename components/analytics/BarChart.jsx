import { Card } from "@/components/ui";

const CHART_HEIGHT = 120;

/**
 * Minimal SVG bar chart — no charting library dependency, since a handful of
 * plain rects covers every chart this screen needs and keeps the bundle
 * small. `data` is [{label, value}]; `barClassName` sets the fill color via
 * a Tailwind class (e.g. "fill-primary") so charts can reuse the existing
 * design tokens instead of hardcoded hex values.
 */
export function BarChart({ title, data, barClassName = "fill-primary", valueFormatter = (v) => v }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const barWidth = data.length > 0 ? 100 / data.length : 100;

  return (
    <Card className="flex flex-col gap-3">
      <p className="text-label-sm font-medium text-text-secondary">{title}</p>
      {data.length === 0 ? (
        <p className="text-body-sm text-text-tertiary">No data yet.</p>
      ) : (
        <>
          <svg
            viewBox={`0 0 100 ${CHART_HEIGHT}`}
            preserveAspectRatio="none"
            className="h-32 w-full"
            role="img"
            aria-label={title}
          >
            {data.map((d, index) => {
              const height = (d.value / max) * (CHART_HEIGHT - 4);
              return (
                <rect
                  key={d.label}
                  x={index * barWidth + barWidth * 0.15}
                  y={CHART_HEIGHT - height}
                  width={barWidth * 0.7}
                  height={height}
                  className={barClassName}
                  rx="1"
                >
                  <title>{`${d.label}: ${valueFormatter(d.value)}`}</title>
                </rect>
              );
            })}
          </svg>
          <div className="flex justify-between text-label-sm text-text-tertiary">
            {data.length <= 10 ? (
              data.map((d) => (
                <span key={d.label} className="truncate">
                  {d.label}
                </span>
              ))
            ) : (
              <>
                <span>{data[0].label}</span>
                <span>{data[data.length - 1].label}</span>
              </>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
