import { Icon, type IconName } from "@/components/ui/Icon"

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
  return (
    <div className="card kpi">
      <div className={`kpi-icon ${color}`}>
        <Icon name={icon} />
      </div>
      <div className="kpi-label">
        {label}
        <Icon name="chevron" size={15} />
      </div>
      <strong>{value}</strong>
      {progress ? (
        <>
          <div className="mini-progress">
            <i style={{ width: `${progress}%` }} />
          </div>
          <span>{meta}</span>
        </>
      ) : (
        <span className={trend ? "positive" : ""}>
          {trend && "↑ "}
          {meta}
        </span>
      )}
    </div>
  )
}
