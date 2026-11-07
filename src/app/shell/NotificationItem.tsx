import type { Notice } from "@/api/notifications"
import { Icon, type IconName } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"
import { timeAgo } from "@/lib/timeAgo"

/** Icon and colour by what kind of notice it is. */
function look(notice: Notice): { icon: IconName; tone: string } {
  if (notice.actions.length) return { icon: "scheme", tone: "green" }
  if (notice.category === "alert") return { icon: "alert", tone: "red" }
  if (notice.category === "reminder") return { icon: "clock", tone: "amber" }
  if (notice.type.endsWith(".sanctioned") || notice.type.endsWith(".delivered"))
    return { icon: "check", tone: "green" }
  return { icon: "file", tone: "blue" }
}

/** One row of the bell menu. Unread rows are tinted with a dot; questions show answer buttons. */
export function NotificationItem({
  notice,
  lang,
  onOpen,
  onAnswer,
  answering,
}: {
  notice: Notice
  lang: string
  onOpen: (notice: Notice) => void
  onAnswer: (notice: Notice, answer: string) => void
  answering: boolean
}) {
  const tr = useTr()
  const { icon, tone } = look(notice)
  const answered = notice.actions.find((a) => a.id === notice.response)
  return (
    <div className={notice.read ? "notice" : "notice unread"}>
      <button type="button" className="notice-open" onClick={() => onOpen(notice)}>
        <span className={`alert ${tone}`}>
          <Icon name={icon} size={14} />
        </span>
        <p>
          <strong>{notice.title}</strong>
          <small>{notice.body}</small>
          <time dateTime={notice.createdAt}>{timeAgo(notice.createdAt, lang)}</time>
        </p>
        {!notice.read && <i className="unread-dot" aria-hidden="true" />}
      </button>
      {notice.actions.length > 0 && !answered && (
        <div className="notice-actions">
          {notice.actions.map((action, index) => (
            <button
              key={action.id}
              type="button"
              className={index === 0 ? "primary-answer" : ""}
              disabled={answering}
              onClick={() => onAnswer(notice, action.id)}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
      {answered && (
        <p className="notice-answer">
          <Icon name="check" size={12} /> {tr("आपका उत्तर:")} {answered.label}
        </p>
      )}
    </div>
  )
}
