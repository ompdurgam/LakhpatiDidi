import { Icon, type IconName } from "@/components/ui/Icon"

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
  return (
    <div className="task">
      <div className={`task-icon ${color}`}>
        <Icon name={icon} size={19} />
      </div>
      <div>
        <strong>{title}</strong>
        <span>{sub}</span>
      </div>
      <button onClick={onClick}>
        {action}
        <Icon name="chevron" size={15} />
      </button>
    </div>
  )
}
