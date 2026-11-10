import { useState } from "react"
import { useTranslation } from "react-i18next"

import { type BroadcastOptions, useAudienceCount, useSendBroadcast } from "@/api/broadcasts"
import { Icon } from "@/components/ui/Icon"
import { Modal } from "@/components/ui/Modal"
import { useTr } from "@/i18n/tr"
import type { Role } from "@/stores/session"
import { useUi } from "@/stores/ui"

import { SentBroadcasts } from "./SentBroadcasts"

const TITLE_MAX = 80
const BODY_MAX = 300

/**
 * Write a notice and send it to the people below you in the hierarchy
 * (inbox + phone alert). The roles and areas offered come from the API,
 * which enforces the same rules when sending.
 */
export function BroadcastComposer({
  options,
  onClose,
}: {
  options: BroadcastOptions
  onClose: () => void
}) {
  const { t } = useTranslation()
  const tr = useTr()
  const notify = useUi((s) => s.notify)
  const [tab, setTab] = useState<"new" | "sent">("new")
  const [roles, setRoles] = useState<Role[]>([])
  const [area, setArea] = useState<number | null>(null)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const audience = useAudienceCount(roles, area)
  const send = useSendBroadcast()

  const allPicked = roles.length === options.roles.length
  const toggle = (role: Role) =>
    setRoles((current) =>
      current.includes(role) ? current.filter((r) => r !== role) : [...current, role],
    )
  const people = audience.data?.people ?? 0
  const ready = roles.length > 0 && title.trim() && body.trim() && people > 0 && !send.isPending

  const submit = () =>
    send.mutate(
      { roles, area, title: title.trim(), body: body.trim() },
      {
        onSuccess: (result) => {
          notify(result.message)
          setTitle("")
          setBody("")
          setTab("sent")
        },
        onError: (error) => notify(error.message),
      },
    )

  return (
    <Modal
      eyebrow={tr("नीचे के स्तर को सूचना")}
      title={tr("सूचना भेजें")}
      onClose={onClose}
      className="scheme-consent-modal broadcast-modal"
      scrimClassName="scheme-consent-scrim"
    >
      <div className="broadcast-tabs" role="tablist">
        <button role="tab" aria-selected={tab === "new"} onClick={() => setTab("new")}>
          {tr("नई सूचना")}
        </button>
        <button role="tab" aria-selected={tab === "sent"} onClick={() => setTab("sent")}>
          {tr("भेजी गई")}
        </button>
      </div>

      {tab === "sent" ? (
        <SentBroadcasts />
      ) : (
        <form
          className="broadcast-form"
          onSubmit={(event) => {
            event.preventDefault()
            if (ready) submit()
          }}
        >
          <fieldset>
            <legend>{tr("किसे भेजें")}</legend>
            <div className="survey-chips">
              <button
                type="button"
                className={allPicked ? "selected" : ""}
                aria-pressed={allPicked}
                onClick={() => setRoles(allPicked ? [] : [...options.roles])}
              >
                {tr("सभी")}
              </button>
              {options.roles.map((role) => (
                <button
                  type="button"
                  key={role}
                  className={roles.includes(role) ? "selected" : ""}
                  aria-pressed={roles.includes(role)}
                  onClick={() => toggle(role)}
                >
                  {t(`roles.${role}`)}
                </button>
              ))}
            </div>
          </fieldset>

          {options.areaLevel && options.areas.length > 0 && (
            <label className="text-control">
              <span>{options.areaLevel === "district" ? tr("जिला") : tr("ब्लॉक")}</span>
              <select
                value={area ?? ""}
                onChange={(event) =>
                  setArea(event.target.value ? Number(event.target.value) : null)
                }
              >
                <option value="">
                  {options.areaLevel === "district" ? tr("पूरा राज्य") : tr("पूरा जिला")}
                </option>
                {options.areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="text-control">
            <span>{tr("शीर्षक")}</span>
            <input
              value={title}
              maxLength={TITLE_MAX}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={tr("जैसे: कल ब्लॉक में बैठक")}
              required
            />
          </label>
          <label className="text-control">
            <span>
              {tr("संदेश")}
              <small>
                {body.length}/{BODY_MAX}
              </small>
            </span>
            <textarea
              value={body}
              maxLength={BODY_MAX}
              rows={4}
              onChange={(event) => setBody(event.target.value)}
              required
            />
          </label>

          <p className="broadcast-reach" aria-live="polite">
            <Icon name="people" size={15} />
            {roles.length === 0
              ? tr("ऊपर से समूह चुनें")
              : tr("{{people}} लोगों तक पहुँचेगी • {{phones}} फ़ोन पर अलर्ट", {
                  people,
                  phones: audience.data?.phones ?? 0,
                })}
          </p>

          <button type="submit" className="primary" disabled={!ready}>
            <Icon name="bell" size={15} />
            {send.isPending ? tr("भेजा जा रहा है…") : tr("सूचना भेजें")}
          </button>
        </form>
      )}
    </Modal>
  )
}
