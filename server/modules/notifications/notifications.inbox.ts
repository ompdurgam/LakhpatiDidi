// Read side: a user's inbox, rendered in the request's language.
import { requestLang } from "../../shared/i18n.ts"
import type { Row } from "../../shared/types.ts"
import {
  actionsFor,
  type NoticeAction,
  type NotificationType,
  type Payload,
  renderNotice,
} from "./notifications.model.ts"
import * as repo from "./notifications.repository.ts"

export type InboxItem = {
  id: number
  type: string
  category: string
  priority: string
  title: string
  body: string
  link: string | null
  entity: { type: string; ref: string } | null
  read: boolean
  /** Answer buttons (actionable notices only). */
  actions: NoticeAction[]
  /** The answer already given, if any. */
  response: string | null
  /** ISO 8601 with the IST offset the database stores. */
  createdAt: string
}

const parsePayload = (raw: unknown): Payload => {
  try {
    return typeof raw === "string" ? JSON.parse(raw) : ((raw as Payload) ?? {})
  } catch {
    return {}
  }
}

export function toInboxItem(row: Row): InboxItem {
  const lang = requestLang()
  const { title, body } = renderNotice(
    row as unknown as NotificationType,
    parsePayload(row.payload),
    lang,
  )
  return {
    id: Number(row.id),
    type: row.code,
    category: row.category,
    priority: row.priority,
    title,
    body,
    link: row.link ?? null,
    entity: row.entity_type ? { type: row.entity_type, ref: row.entity_ref } : null,
    read: row.read_at !== null,
    actions: actionsFor(row.actions, lang),
    response: row.response ?? null,
    createdAt: `${String(row.created_at).replace(" ", "T")}+05:30`,
  }
}

/** One page of the inbox plus the cursor for the next page and the badge count. */
export async function getInbox(
  userId: number,
  options: { before?: number; limit: number; unreadOnly: boolean },
) {
  // Fetch one extra row to know whether another page exists.
  const rows = await repo.listInbox(userId, { ...options, limit: options.limit + 1 })
  const items = rows.slice(0, options.limit).map(toInboxItem)
  return {
    items,
    nextCursor: rows.length > options.limit ? items[items.length - 1].id : null,
    unread: await repo.unreadCount(userId),
  }
}
