import { DprWorkspace } from "@/features/dpr/DprWorkspace"
import { HouseholdTracker } from "@/features/households/HouseholdTracker"
import { SchemeRecommendations } from "@/features/recommendations/SchemeRecommendations"
import { SurveyForm } from "@/features/survey/SurveyForm"
import { SurveyHome } from "@/features/survey/SurveyHome"
import { VillageProfile } from "@/features/survey/village/VillageProfile"
import { useTr } from "@/i18n/tr"

import type { FieldState } from "./fieldState"

/** The field-app screen for the current route (compact / app-style variant). */
export function FieldScreen(s: FieldState) {
  const tr = useTr()
  switch (s.screen) {
    case "village":
      return <VillageProfile setScreen={s.setScreen} />
    case "survey":
      return (
        <SurveyForm
          step={s.surveyStep}
          setStep={s.setSurveyStep}
          sections={s.sections}
          selectedLivelihoods={s.selectedLivelihoods}
          setSelectedLivelihoods={s.setSelectedLivelihoods}
          onNotify={s.onNotify}
          onSeeRecommendations={() => s.setScreen("recommend")}
          onNextFamily={() => {
            s.setSurveyStep(0)
            s.setScreen("home")
            s.onNotify(tr("अगले परिवार के लिए नया सर्वे तैयार है"))
          }}
        />
      )
    case "recommend":
      return <SchemeRecommendations compact />
    case "dpr":
      return <DprWorkspace compact />
    case "tracker":
      return <HouseholdTracker />
    default:
      return <SurveyHome setScreen={s.setScreen} />
  }
}
