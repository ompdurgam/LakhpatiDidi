import { Icon, type IconName } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

export function OverviewStat({
  icon,
  tone,
  label,
  value,
  meta,
  progress,
}: {
  icon: IconName
  tone: string
  label: string
  value: string
  meta: string
  progress?: number
}) {
  const tr = useTr()
  return (
    <div className="card overview-stat">
      <div className={`kpi-icon ${tone}`}>
        <Icon name={icon} size={18} />
      </div>
      <div>
        <span>{tr(label)}</span>
        <strong>{tr(value)}</strong>
        <small>{tr(meta)}</small>
        {progress !== undefined && (
          <i>
            <b style={{ width: `${progress}%` }} />
          </i>
        )}
      </div>
    </div>
  )
}
