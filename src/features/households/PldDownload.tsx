import { useState } from "react"

import { Icon } from "@/components/ui/Icon"
import { currentLanguage } from "@/i18n"
import { useTr } from "@/i18n/tr"
import { useSession } from "@/stores/session"
import { useUi } from "@/stores/ui"

const ALLOWED = new Set(["block", "district", "state", "admin"])

/**
 * Downloads every Didi on record in the user's areas as an Excel file
 * (block, district and state / admin). The statewide file is large, so the
 * button shows progress while it streams.
 */
export function PldDownload() {
  const tr = useTr()
  const role = useSession((s) => s.role)
  const token = useSession((s) => s.token)
  const notify = useUi((s) => s.notify)
  const [busy, setBusy] = useState(false)
  const [received, setReceived] = useState(0)
  if (!ALLOWED.has(role)) return null

  const download = async () => {
    setBusy(true)
    setReceived(0)
    try {
      const res = await fetch("/api/households/export", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept-Language": currentLanguage(),
        },
      })
      if (!res.ok || !res.body) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error ?? tr("डाउनलोड नहीं हो सका"))
      }
      // Read the stream to show progress (MB received) on the button.
      const reader = res.body.getReader()
      const chunks: Uint8Array[] = []
      let size = 0
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
        size += value.length
        setReceived(size)
      }
      const name =
        (res.headers.get("Content-Disposition") ?? "").split("filename=")[1]?.replaceAll('"', "") ||
        "PLD-Didis.xlsx"
      const url = URL.createObjectURL(new Blob(chunks as BlobPart[]))
      Object.assign(document.createElement("a"), { href: url, download: name }).click()
      URL.revokeObjectURL(url)
    } catch (e) {
      notify((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const label = busy
    ? tr("डाउनलोड हो रहा है… {{mb}} MB", { mb: (received / 1e6).toFixed(1) })
    : tr("PLD सूची (Excel)")
  return (
    <button className="secondary" disabled={busy} onClick={download}>
      <Icon name="download" size={16} /> {label}
    </button>
  )
}
