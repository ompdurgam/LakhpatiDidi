import { Icon } from "@/components/ui/Icon"
import type { SurveyResult } from "@/features/survey/types"
import { useTr } from "@/i18n/tr"

export function SurveySuccess({
  result,
  onSeeRecommendations,
  onNextFamily,
}: {
  result: SurveyResult
  onSeeRecommendations: () => void
  onNextFamily: () => void
}) {
  const tr = useTr()
  const qrPattern = [
    1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0,
    1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0,
  ]
  return (
    <div className="phone-content survey-success">
      <div className="success-check">
        <Icon name="check" size={34} />
      </div>
      <span className="eyebrow">{tr("सर्वे सफलतापूर्वक जमा हुआ")}</span>
      <h2>{tr("परिवार रिकॉर्ड बन गया")}</h2>
      <p>{tr("डेटा सुरक्षित है और योजना मिलान के लिए तैयार है।")}</p>
      <div className="success-id">
        <span>Household ID</span>
        <strong>{result.hhCode}</strong>
        <small>
          {result.name} • {result.village}
          {" • "}
          {result.created ? tr("नया परिवार") : tr("रिकॉर्ड अपडेट")}
        </small>
      </div>
      <div className="qr-code">
        {qrPattern.map((cell, index) => (
          <i key={index} className={cell ? "filled" : ""} />
        ))}
      </div>
      <small className="qr-label">{tr("ट्रैकिंग पेज के लिए स्कैन करें")}</small>
      <div className="success-actions">
        <button className="primary" onClick={onSeeRecommendations}>
          {tr("योजना सुझाव देखें")} <Icon name="arrow" size={16} />
        </button>
        <button className="secondary" onClick={onNextFamily}>
          {tr("अगला परिवार")}
        </button>
      </div>
      <div className="sync-success">
        <Icon name="check" size={15} /> {tr("MySQL सर्वर से सिंक हुआ •")} {result.submittedAt}
      </div>
    </div>
  )
}
