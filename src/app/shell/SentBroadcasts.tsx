import { useTranslation } from "react-i18next"

import { useSentBroadcasts } from "@/api/broadcasts"
import { useTr } from "@/i18n/tr"

/** The notices this person sent, with how many recipients have read each one. */
export function SentBroadcasts() {
  const { t } = useTranslation()
  const tr = useTr()
  const sent = useSentBroadcasts()

  if (sent.isLoading) return <p className="notification-hint">{tr("लोड हो रहा है…")}</p>
  if (!sent.data?.length)
    return <p className="notification-hint">{tr("अभी तक कोई सूचना नहीं भेजी गई")}</p>

  return (
    <ul className="broadcast-sent">
      {sent.data.map((item) => (
        <li key={item.id}>
          <strong>{item.title}</strong>
          <p>{item.body}</p>
          <small>
            {item.roles.map((role) => t(`roles.${role}`)).join(", ")} • {tr(item.sentAt)}
          </small>
          <span className="broadcast-seen">
            {tr("{{seen}}/{{people}} ने पढ़ा", { seen: item.seen, people: item.people })}
          </span>
        </li>
      ))}
    </ul>
  )
}
