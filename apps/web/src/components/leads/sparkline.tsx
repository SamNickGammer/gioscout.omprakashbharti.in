/**
 * Tiny dependency-free SVG sparkline for review-count growth. Kept minimal so
 * the dashboard stays light (no charting library).
 */
export function Sparkline({
  values,
  width = 220,
  height = 56,
  className,
}: {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
}) {
  if (values.length === 0) {
    return (
      <div className="flex h-14 items-center justify-center text-xs text-muted-foreground">
        No history yet
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = values.length > 1 ? width / (values.length - 1) : 0;
  const pad = 4;

  const points = values.map((v, i) => {
    const x = values.length > 1 ? i * stepX : width / 2;
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });

  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${path} L ${points[points.length - 1][0].toFixed(1)} ${height} L ${points[0][0].toFixed(1)} ${height} Z`;

  return (
    <svg width={width} height={height} className={className} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(43 74% 60%)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="hsl(43 74% 60%)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)" />
      <path d={path} fill="none" stroke="hsl(43 74% 62%)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.length > 0 && (
        <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="3" fill="hsl(43 74% 68%)" />
      )}
    </svg>
  );
}
