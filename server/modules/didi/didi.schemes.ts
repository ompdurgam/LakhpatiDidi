import { one } from "../../db/pool.ts"
import { notFound } from "../../shared/errors.ts"
import { msg } from "../../shared/i18n.ts"
import type { Row } from "../../shared/types.ts"
import { answerFromProfile, type InterestAnswer } from "../recommendations/interest.ts"
import { recommendationsForDidi } from "../recommendations/recommendations.service.ts"

/** The household code behind the signed-in Didi's verified mobile. */
async function householdCode(mobile: string) {
  const h = await one<Row>("SELECT hh_code FROM tbl_households WHERE mobile = ? LIMIT 1", [mobile])
  if (!h) throw notFound(msg("इस मोबाइल नंबर से कोई दीदी प्रोफ़ाइल नहीं जुड़ी है"))
  return String(h.hh_code)
}

/** Schemes that suit her (same engine the CRP sees), what they could add, and open entitlements. */
export async function getDidiSchemes(mobile: string) {
  const data = await recommendationsForDidi(await householdCode(mobile))
  return {
    income: data.household.income,
    leverage: data.leverage,
    // Staff-only workflow state (DPR drafts) is not hers to see.
    recommendations: data.recommendations.map(({ dpr: _dpr, ...fit }) => fit),
    entitlements: data.entitlements,
  }
}

export async function answerScheme(
  mobile: string,
  userId: number,
  schemeCode: string,
  answer: InterestAnswer,
) {
  await answerFromProfile(await householdCode(mobile), userId, schemeCode, answer)
  return answer === "yes"
    ? msg("आपकी रुचि CRP को भेजी गई — वे आवेदन में मदद करेंगी")
    : msg("ठीक है, आप बाद में भी आवेदन कर सकती हैं")
}
