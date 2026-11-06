import { useParams } from "react-router"

import { RecommendationDetail } from "./RecommendationDetail"
import { RecommendationList } from "./RecommendationList"

/** Recommendations tab: the surveyed-Didi list, or one Didi's schemes when her code is in the URL. */
export function SchemeRecommendations({ compact = false }: { compact?: boolean }) {
  const { householdId } = useParams()
  return householdId ? (
    <RecommendationDetail code={householdId} compact={compact} />
  ) : (
    <RecommendationList compact={compact} />
  )
}
