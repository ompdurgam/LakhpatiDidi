import { useState } from "react"

import type { ApplicationDetail } from "@/api/types"
import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

/** CRP ↔ officer comment thread with a reply box. */
export function ApplicationComments({
  comments,
  busy,
  onSend,
}: {
  comments: ApplicationDetail["comments"]
  busy: boolean
  /** Resolves true when the comment was saved. */
  onSend: (body: string) => Promise<boolean>
}) {
  const tr = useTr()
  const [draft, setDraft] = useState("")
  const send = async () => {
    if (!draft.trim()) return
    if (await onSend(draft)) setDraft("")
  }
  return (
    <div className="drawer-section comment-thread">
      <h4>{tr("CRP के साथ टिप्पणियाँ")}</h4>
      {comments.length === 0 && <p className="empty-note">{tr("अभी कोई टिप्पणी नहीं")}</p>}
      {comments.map((c) => (
        <div key={c.id} className={`comment ${c.fromOfficer ? "officer" : "crp"}`}>
          <span>{tr(c.initials)}</span>
          <p>
            <strong>
              {tr(c.author)} • {tr(c.roleLabel)}
            </strong>
            {tr(c.body)}
            <small>{tr(c.at)}</small>
          </p>
        </div>
      ))}
      <label className="comment-box">
        <input
          placeholder={tr("टिप्पणी लिखें...")}
          value={draft}
          maxLength={1000}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && send()}
        />
        <button onClick={send} disabled={busy || !draft.trim()} aria-label={tr("टिप्पणी भेजें")}>
          <Icon name="arrow" size={14} />
        </button>
      </label>
    </div>
  )
}
