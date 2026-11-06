import { useTr } from "@/i18n/tr"

export function Legend({ color, value, label }: { color: string; value: string; label: string }) {
  const tr = useTr()
  return (
    <div className="legend-row">
      <i style={{ background: color }} />
      <div>
        <strong>{tr(value)}</strong>
        <span>{tr(label)}</span>
      </div>
    </div>
  )
}
