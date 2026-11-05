export function Legend({ color, value, label }: { color: string; value: string; label: string }) {
  return (
    <div className="legend-row">
      <i style={{ background: color }} />
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  )
}
