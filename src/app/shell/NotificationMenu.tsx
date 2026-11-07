import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"

import {
  type Notice,
  notificationKeys,
  useInbox,
  useMarkRead,
  useRespond,
  useUnreadCount,
} from "@/api/notifications"
import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"
import { enablePush, pushState } from "@/lib/push"

import { NotificationItem } from "./NotificationItem"

/** Bell button + dropdown inbox (server notifications) with the phone-alerts switch. */
export function NotificationMenu() {
  const { t, i18n } = useTranslation()
  const tr = useTr()
  const navigate = useNavigate()
  const client = useQueryClient()
  const [open, setOpen] = useState(false)
  const [push, setPush] = useState(pushState)
  const box = useRef<HTMLDivElement>(null)
  const { data: unread = 0 } = useUnreadCount()
  const inbox = useInbox(open)
  const markRead = useMarkRead()
  const respond = useRespond()
  const notices = inbox.data?.pages.flatMap((page) => page.items) ?? []

  // A push arriving while the app is open refreshes the badge and list at once.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "notification")
        void client.invalidateQueries({ queryKey: notificationKeys.all })
    }
    navigator.serviceWorker.addEventListener("message", onMessage)
    return () => navigator.serviceWorker.removeEventListener("message", onMessage)
  }, [client])

  // Close on Escape or a tap outside.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    const onDown = (e: PointerEvent) =>
      box.current && !box.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onDown)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onDown)
    }
  }, [open])

  const openNotice = (notice: Notice) => {
    if (!notice.read) markRead.mutate([notice.id])
    setOpen(false)
    if (notice.link) navigate(notice.link)
  }

  const turnOnAlerts = async () => setPush(await enablePush().catch(() => pushState()))

  return (
    <div className="notification-menu" ref={box}>
      <button
        className="icon-button notification"
        onClick={() => setOpen(!open)}
        aria-label={t("header.notifications")}
        aria-expanded={open}
      >
        <Icon name="bell" />
        {unread > 0 && <i>{unread > 9 ? "9+" : unread}</i>}
      </button>
      {open && (
        <div className="notification-dropdown" role="dialog" aria-label={t("header.notifications")}>
          <div>
            <strong>{t("header.notifications")}</strong>
            {unread > 0 ? (
              <button onClick={() => markRead.mutate("all")}>{tr("सभी पढ़ा हुआ करें")}</button>
            ) : (
              <button onClick={() => setOpen(false)}>{t("notifications.close")}</button>
            )}
          </div>
          {push === "default" && (
            <button className="push-optin" onClick={() => void turnOnAlerts()}>
              <span className="alert green">
                <Icon name="bell" size={14} />
              </span>
              <p>
                <strong>{tr("फ़ोन पर अलर्ट चालू करें")}</strong>
                <small>{tr("ऐप बंद होने पर भी नए काम की सूचना मिलेगी")}</small>
              </p>
            </button>
          )}
          {push === "denied" && (
            <p className="notification-hint">
              {tr("अलर्ट ब्लॉक हैं — ब्राउज़र सेटिंग में अनुमति दें")}
            </p>
          )}
          <div className="notification-list">
            {notices.map((notice) => (
              <NotificationItem
                key={notice.id}
                notice={notice}
                lang={i18n.language}
                onOpen={openNotice}
                onAnswer={(n, answer) => respond.mutate({ id: n.id, answer })}
                answering={respond.isPending}
              />
            ))}
            {inbox.isLoading && <p className="notification-hint">{tr("लोड हो रहा है…")}</p>}
            {inbox.isSuccess && !notices.length && (
              <p className="notification-hint">{tr("कोई नई सूचना नहीं")}</p>
            )}
            {inbox.hasNextPage && (
              <button
                className="notification-more"
                disabled={inbox.isFetchingNextPage}
                onClick={() => void inbox.fetchNextPage()}
              >
                {tr("और देखें")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
