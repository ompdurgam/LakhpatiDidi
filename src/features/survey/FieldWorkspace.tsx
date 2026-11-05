import { useState } from "react"

import { Icon } from "@/components/ui/Icon"
import { DprBuilder } from "@/features/dpr/DprBuilder"
import { HouseholdTracker } from "@/features/households/HouseholdTracker"
import { SchemeRecommendations } from "@/features/recommendations/SchemeRecommendations"
import { SurveyCompanion } from "@/features/survey/SurveyCompanion"
import { SurveyForm } from "@/features/survey/SurveyForm"
import { SurveyHome } from "@/features/survey/SurveyHome"
import { VillageProfile } from "@/features/survey/village/VillageProfile"
import { VillageProfileSummary } from "@/features/survey/village/VillageProfileSummary"

import { useFieldScreen } from "./useFieldScreen"

export function FieldWorkspace({
  english,
  onNotify,
}: {
  english: boolean
  onNotify: (message: string) => void
}) {
  const { screen, setScreen } = useFieldScreen()
  const [surveyStep, setSurveyStep] = useState(0)
  const [selectedLivelihoods, setSelectedLivelihoods] = useState(["E", "H", "K"])
  const [selectedSchemes, setSelectedSchemes] = useState<string[]>(["PMMSY"])
  const surveySections = english
    ? [
        "A Identity",
        "B Income",
        "C Loans",
        "D Schemes",
        "E Agriculture",
        "F Livestock",
        "G Fisheries",
        "H Forest produce",
        "I Non-farm",
        "J Tourism",
        "K Wage",
        "Review",
      ]
    : [
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
  const screens = [
    ["home", "होम"],
    ["survey", "सर्वे"],
    ["recommend", "सुझाव"],
    ["dpr", "DPR"],
    ["tracker", "ट्रैकर"],
  ]
  return (
    <div className="page field-workspace">
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">मोबाइल फील्ड ऐप • ऑफलाइन सक्षम</span>
          <h2>सर्वेयर कार्यक्षेत्र</h2>
          <p>सर्वे से योजना आवेदन और आय ट्रैकिंग तक संपूर्ण प्रवाह</p>
        </div>
        <div className="sync-pill">
          <i /> ऑफलाइन डेटा सुरक्षित • 4 लंबित
        </div>
      </div>
      <div className="journey-strip">
        {[
          "सर्वे",
          "सिंक",
          "योजना सुझाव",
          "सहमति",
          "DPR",
          "विभाग",
          "स्वीकृति",
          "डिलीवरी",
          "आय",
          "लखपति",
        ].map((item, index) => (
          <div key={item} className={index < 4 ? "complete" : index === 4 ? "current" : ""}>
            <i>{index < 4 ? "✓" : index + 1}</i>
            <span>{item}</span>
          </div>
        ))}
      </div>
      <div className="field-layout">
        <div className="phone-frame">
          <div className="phone-top">
            <span>9:41</span>
            <b>स्वावलंबी दीदी</b>
            <Icon name="bell" size={17} />
          </div>
          {screen === "home" && <SurveyHome setScreen={setScreen} />}
          {screen === "village" && <VillageProfile setScreen={setScreen} />}
          {screen === "survey" && (
            <SurveyForm
              step={surveyStep}
              setStep={setSurveyStep}
              sections={surveySections}
              selectedLivelihoods={selectedLivelihoods}
              setSelectedLivelihoods={setSelectedLivelihoods}
              english={english}
              onNotify={onNotify}
              onSeeRecommendations={() => setScreen("recommend")}
              onNextFamily={() => {
                setSurveyStep(0)
                setScreen("home")
                onNotify("अगले परिवार के लिए नया सर्वे तैयार है")
              }}
            />
          )}
          {screen === "recommend" && (
            <SchemeRecommendations
              selected={selectedSchemes}
              setSelected={setSelectedSchemes}
              setScreen={setScreen}
            />
          )}
          {screen === "dpr" && (
            <DprBuilder compact onNotify={onNotify} onTrack={() => setScreen("tracker")} />
          )}
          {screen === "tracker" && <HouseholdTracker />}
          <div className="phone-nav">
            {screens.map(([key, label]) => (
              <button
                key={key}
                className={screen === key ? "active" : ""}
                onClick={() => setScreen(key)}
              >
                <Icon
                  name={
                    key === "home"
                      ? "home"
                      : key === "survey"
                        ? "file"
                        : key === "recommend"
                          ? "scheme"
                          : key === "dpr"
                            ? "building"
                            : "trend"
                  }
                  size={17}
                />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="field-detail">
          {screen === "recommend" ? (
            <SchemeRecommendations
              selected={selectedSchemes}
              setSelected={setSelectedSchemes}
              setScreen={setScreen}
              desktop
            />
          ) : screen === "dpr" ? (
            <DprBuilder onNotify={onNotify} onTrack={() => setScreen("tracker")} />
          ) : screen === "tracker" ? (
            <HouseholdTracker desktop />
          ) : screen === "village" ? (
            <VillageProfileSummary />
          ) : (
            <SurveyCompanion
              step={surveyStep}
              setStep={setSurveyStep}
              setScreen={setScreen}
              sections={surveySections}
              selectedLivelihoods={selectedLivelihoods}
              english={english}
            />
          )}
        </div>
      </div>
    </div>
  )
}
