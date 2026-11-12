import { useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"

import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"
import { useUi } from "@/stores/ui"

import { removeFromOutbox, useOutbox } from "./offlineSurvey"

/** Network state and surveys waiting on the phone; sends them when the network returns. */
export function SyncBanner() {
  const tr = useTr()
  const notify = useUi((s) => s.notify)
  const client = useQueryClient()
  const onSent = useCallback(
    (n: number) => {
      notify(tr("{{n}} सर्वे भेजे गए", { n }))
      void client.invalidateQueries()
    },
    [notify, tr, client],
  )
  const { items, online, sync } = useOutbox(onSent)
  const waiting = items.filter((i) => !i.error)
  const failed = items.filter((i) => i.error)
  if (online && !items.length) return null
  return (
    <div className={`offline-banner ${online ? "" : "offline"}`} role="status">
      <Icon name={online ? "clock" : "alert"} size={15} />
      <span>
        {online
          ? tr("{{n}} सर्वे भेजने बाकी", { n: waiting.length })
          : tr("ऑफ़लाइन • सर्वे फोन में सहेजे जाएँगे ({{n}} बाकी)", { n: waiting.length })}
      </span>
      {online && waiting.length > 0 && (
        <button className="text-button" onClick={() => void sync()}>
          {tr("अभी भेजें")}
        </button>
      )}
      {failed.map((item) => (
        <div key={item.id} className="outbox-failed">
          <strong>{item.name || tr("सर्वे")}</strong>: {item.error}
          <button className="text-button" onClick={() => removeFromOutbox(item.id)}>
            {tr("हटाएँ")}
          </button>
        </div>
      ))}
    </div>
  )
}
