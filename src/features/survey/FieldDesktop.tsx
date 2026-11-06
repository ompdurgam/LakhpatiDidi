import { DprBuilder } from "@/features/dpr/DprBuilder"
import { HouseholdTracker } from "@/features/households/HouseholdTracker"
import { SchemeRecommendations } from "@/features/recommendations/SchemeRecommendations"
import { SurveyCompanion } from "@/features/survey/SurveyCompanion"
import { VillageProfileSummary } from "@/features/survey/village/VillageProfileSummary"

import { FieldScreen } from "./FieldScreen"
import type { FieldState } from "./fieldState"

/**
 * Desktop field layout. Screens with a desktop variant fill the page;
 * the survey gets a slim section rail beside the form, the village
 * profile its summary panel. Navigation comes from the app sidebar.
 */
export function FieldDesktop(s: FieldState) {
  if (s.screen === "recommend")
    return (
      <div className="field-detail">
        <SchemeRecommendations
          selected={s.selectedSchemes}
          setSelected={s.setSelectedSchemes}
          setScreen={s.setScreen}
          desktop
        />
      </div>
    )
  if (s.screen === "dpr")
    return (
      <div className="field-detail">
        <DprBuilder onNotify={s.onNotify} onTrack={() => s.setScreen("tracker")} />
      </div>
    )
  if (s.screen === "tracker")
    return (
      <div className="field-detail">
        <HouseholdTracker desktop />
      </div>
    )

  if (s.screen === "survey")
    return (
      <div className="field-layout with-rail">
        <aside className="field-detail field-rail">
          <SurveyCompanion
            step={s.surveyStep}
            setStep={s.setSurveyStep}
            setScreen={s.setScreen}
            sections={s.sections}
            selectedLivelihoods={s.selectedLivelihoods}
          />
        </aside>
        <div className="field-main">
          <FieldScreen {...s} />
        </div>
      </div>
    )
  if (s.screen === "village")
    return (
      <div className="field-layout">
        <div className="field-main">
          <FieldScreen {...s} />
        </div>
        <div className="field-detail">
          <VillageProfileSummary />
        </div>
      </div>
    )

  return (
    <div className="field-main">
      <FieldScreen {...s} />
    </div>
  )
}
