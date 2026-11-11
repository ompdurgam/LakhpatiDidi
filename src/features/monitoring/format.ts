// Number formatting for dashboards (Indian digit grouping).

export const num = (n: number) => Math.round(n).toLocaleString("en-IN")

/** Share of `part` in `whole` as a whole percent (0 when there is no whole). */
export const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0)

/** ₹ in crore / lakh for large sums, plain rupees otherwise. */
export function money(n: number) {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1)} Cr`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`
  return `₹${num(n)}`
}

/** Low / medium / high band for a percentage, for map and heatmap colouring. */
export const band = (value: number, [low, high]: [number, number]) =>
  value >= high ? "high" : value >= low ? "medium" : "low"

/** conic-gradient segments for a donut, in order. */
export function donutGradient(parts: { value: number; color: string }[]) {
  const total = parts.reduce((sum, p) => sum + p.value, 0)
  if (!total) return "#e8ece8"
  let start = 0
  const stops = parts.map((p) => {
    const end = start + (p.value / total) * 100
    const stop = `${p.color} ${start}% ${end}%`
    start = end
    return stop
  })
  return `conic-gradient(${stops.join(", ")})`
}
