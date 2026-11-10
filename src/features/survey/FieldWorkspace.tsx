import { useState } from "react"

import { useTr } from "@/i18n/tr"
import { useIsMobile } from "@/lib/useMediaQuery"

import { FieldDesktop } from "./FieldDesktop"
import { FieldMobile } from "./FieldMobile"
import type { FieldState } from "./fieldState"
import { useFieldScreen } from "./useFieldScreen"

const sections = [
  "A पहचान",
  "B आय",
  "C ऋण",
  "D योजनाएँ",
  "E कृषि",
  "F पशुधन",
  "G मत्स्य",
  "H वन उपज",
  "I गैर-कृषि",
  "J पर्यटन",
  "K मजदूरी",
  "समीक्षा",
]

/**
 * Field (surveyor) workspace. Phones get the full-screen field app;
 * larger screens get the desktop layout — never a phone mockup.
 */
export function FieldWorkspace({ onNotify }: { onNotify: (message: string) => void }) {
  const tr = useTr()
  const isMobile = useIsMobile()
  const { screen, setScreen } = useFieldScreen()
  const [surveyStep, setSurveyStep] = useState(0)
  const [selectedLivelihoods, setSelectedLivelihoods] = useState(["E", "H", "K"])

  const state: FieldState = {
    onNotify,
    screen,
    setScreen,
    surveyStep,
    setSurveyStep,
    sections: sections.map((name) => tr(name)),
    selectedLivelihoods,
    setSelectedLivelihoods,
  }

  if (isMobile) return <FieldMobile {...state} />

  return (
    <div className="page field-workspace">
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">{tr("फील्ड कार्यक्षेत्र • ऑफलाइन सक्षम")}</span>
          <h2>{tr("सर्वेयर कार्यक्षेत्र")}</h2>
          <p>{tr("सर्वे से योजना आवेदन और आय ट्रैकिंग तक संपूर्ण प्रवाह")}</p>
        </div>
        <div className="sync-pill">
          <i /> {tr("ऑफलाइन डेटा सुरक्षित • 4 लंबित")}
        </div>
      </div>
      <FieldDesktop {...state} />
    </div>
  )
}
