/**
 * Sentiment arc sparkline — one series, so no legend: the label above it says
 * what is plotted. 2px line, ringed end marker, hairline zero rule.
 */
export function SentimentArc({
  points,
  width = 260,
  height = 44,
}: {
  points: { atSecond: number; value: number }[]
  width?: number
  height?: number
}) {
  if (points.length < 2) {
    return (
      <div
        className="flex items-center justify-center rounded-md bg-slate-50 text-[11px] text-slate-400"
        style={{ height }}
      >
        Listening…
      </div>
    )
  }

  const maxSecond = points[points.length - 1].atSecond || 1
  const pad = 4
  const x = (s: number) => pad + (s / maxSecond) * (width - pad * 2)
  // value −1…1 maps to bottom…top
  const y = (v: number) => pad + ((1 - v) / 2) * (height - pad * 2)

  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.atSecond).toFixed(1)} ${y(p.value).toFixed(1)}`)
    .join(' ')

  const last = points[points.length - 1]
  const stroke = last.value > 0.18 ? '#00A3A1' : last.value < -0.18 ? '#DC2626' : '#94A3B8'

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Sentiment arc, currently ${last.value.toFixed(2)} on a scale of -1 to 1`}
    >
      {/* Neutral baseline */}
      <line
        x1={pad}
        x2={width - pad}
        y1={y(0)}
        y2={y(0)}
        stroke="#E2E8F0"
        strokeWidth={1}
      />
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={x(last.atSecond)}
        cy={y(last.value)}
        r={4}
        fill={stroke}
        stroke="#FFFFFF"
        strokeWidth={2}
      />
    </svg>
  )
}
