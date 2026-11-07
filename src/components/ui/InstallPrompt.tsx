import { useState } from "react"

import { useTr } from "@/i18n/tr"
import { usePwaInstall } from "@/lib/pwaInstall"

import { Icon } from "./Icon"

/**
 * Shown only in a normal browser tab: offers to install the app (or, when it is
 * already installed, points to the installed app). Skip hides it for a week.
 */
export function InstallPrompt() {
  const tr = useTr()
  const pwa = usePwaInstall()
  // No native prompt available (plain http, in-app browsers): Install reveals the manual steps.
  const [showSteps, setShowSteps] = useState(false)
  if (pwa.standalone || pwa.skipped) return null

  let title: string
  let body: string
  if (pwa.canInstall) {
    title = tr("ऐप इंस्टॉल करें")
    body = tr("तेज़ खुलने और ऑफलाइन उपयोग के लिए इसे अपने फ़ोन में जोड़ें।")
  } else if (pwa.installedElsewhere) {
    title = tr("ऐप पहले से इंस्टॉल है")
    body = tr("बेहतर अनुभव के लिए इसे होम स्क्रीन के आइकन से खोलें।")
  } else if (pwa.iosManual) {
    title = tr("ऐप इंस्टॉल करें")
    body = tr("Share दबाएँ, फिर “Add to Home Screen” चुनें।")
  } else if (pwa.manualHint) {
    title = tr("ऐप इंस्टॉल करें")
    body = showSteps
      ? tr("ब्राउज़र मेन्यू (⋮) खोलें और “Install app” या “Add to Home screen” चुनें।")
      : tr("तेज़ खुलने और ऑफलाइन उपयोग के लिए इसे अपने फ़ोन में जोड़ें।")
  } else {
    return null
  }

  return (
    <aside className="install-prompt" role="dialog" aria-label={title}>
      <span className="install-prompt-icon">
        <Icon name="download" size={20} />
      </span>
      <div className="install-prompt-text">
        <strong>{title}</strong>
        <span>{body}</span>
      </div>
      <div className="install-prompt-actions">
        {(pwa.canInstall || pwa.manualHint) && (
          <button
            type="button"
            className="install-yes"
            onClick={() => (pwa.canInstall ? void pwa.install() : setShowSteps(true))}
          >
            {tr("इंस्टॉल करें")}
          </button>
        )}
        <button type="button" className="install-skip" onClick={pwa.skip}>
          {pwa.installedElsewhere ? tr("ब्राउज़र में जारी रखें") : tr("अभी छोड़ें")}
        </button>
      </div>
    </aside>
  )
}
