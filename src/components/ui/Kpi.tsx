import { Icon, type IconName } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

export function Kpi({
  icon,
  color,
  label,
  value,
  meta,
  progress,
  trend,
}: {
  icon: IconName
  color: string
  label: string
  value: string
  meta: string
  progress?: number
  trend?: boolean
}) {
  const tr = useTr()
  return (
    <div className="card kpi">
      <div className={`kpi-icon ${color}`}>
        <Icon name={icon} />
      </div>
      <div className="kpi-label">
        {tr(label)}
        <Icon name="chevron" size={15} />
      </div>
      <strong>{tr(value)}</strong>
      {progress ? (
        <>
          <div className="mini-progress">
            <i style={{ width: `${progress}%` }} />
          </div>
          <span>{tr(meta)}</span>
        </>
      ) : (
        <span className={trend ? "positive" : ""}>
          {trend && "↑ "}
          {tr(meta)}
        </span>
      )}
    </div>
  )
}
