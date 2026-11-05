export function MiniStat({
  value,
  label,
  alert,
}: {
  value: string
  label: string
  alert?: boolean
}) {
  return (
    <div className="card mini-stat">
      <strong className={alert ? "red-text" : ""}>{value}</strong>
      <span>{label}</span>
    </div>
  )
}
