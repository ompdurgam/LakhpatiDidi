import { useTr } from "@/i18n/tr"

export function MiniStat({
  value,
  label,
  alert,
}: {
  value: string
  label: string
  alert?: boolean
}) {
  const tr = useTr()
  return (
    <div className="card mini-stat">
      <strong className={alert ? "red-text" : ""}>{tr(value)}</strong>
      <span>{tr(label)}</span>
    </div>
  )
}
