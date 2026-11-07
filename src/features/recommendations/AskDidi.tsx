import { useState } from "react"

import { api } from "@/api/client"
import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"
import { useUi } from "@/stores/ui"

import type { SchemeFit } from "./types"

/**
 * The Didi's answer to "would you like to apply?" for this scheme, or a button to ask
 * her on her phone (she gets a notification with Yes / Not now).
 */
export function AskDidi({
  didi,
  fit,
  onAsked,
}: {
  didi: string
  fit: SchemeFit
  onAsked: () => void
}) {
  const tr = useTr()
  const notify = useUi((s) => s.notify)
  const [busy, setBusy] = useState(false)

  if (fit.interest === "interested")
    return (
      <p className="rec-interest yes">
        <Icon name="check" size={13} /> {tr("दीदी आवेदन करना चाहती हैं")}
      </p>
    )
  if (fit.interest === "not_interested")
    return <p className="rec-interest no">{tr("दीदी ने अभी मना किया")}</p>
  if (fit.interest === "asked")
    return (
      <p className="rec-interest wait">
        <Icon name="clock" size={13} /> {tr("दीदी के उत्तर की प्रतीक्षा")}
      </p>
    )

  const ask = async () => {
    setBusy(true)
    try {
      const result = await api<{ message: string }>(
        `/recommendations/${encodeURIComponent(didi)}/ask`,
        { body: { scheme: fit.code } },
      )
      notify(result.message)
      onAsked()
    } catch (error) {
      notify((error as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button type="button" className="rec-ask" disabled={busy} onClick={() => void ask()}>
      <Icon name="bell" size={14} /> {tr("दीदी के फ़ोन पर पूछें")}
    </button>
  )
}
