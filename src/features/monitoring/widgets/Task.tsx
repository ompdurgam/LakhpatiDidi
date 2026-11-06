import { Icon, type IconName } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

export function Task({
  color,
  icon,
  title,
  sub,
  action,
  onClick,
}: {
  color: string
  icon: IconName
  title: string
  sub: string
  action: string
  onClick: () => void
}) {
  const tr = useTr()
  return (
    <div className="task">
      <div className={`task-icon ${color}`}>
        <Icon name={icon} size={19} />
      </div>
      <div>
        <strong>{tr(title)}</strong>
        <span>{tr(sub)}</span>
      </div>
      <button onClick={onClick}>
        {tr(action)}
        <Icon name="chevron" size={15} />
      </button>
    </div>
  )
}
