import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

import { COMMUNITY_FACILITIES, completion, INSTITUTIONS, LIVELIHOOD_INFRA } from "./catalog"
import { useVillageDraft } from "./useVillageProfile"

/** Desktop side panel: completion and top needs of the profile being edited. */
export function VillageProfileSummary() {
  const tr = useTr()
  const { village, responses } = useVillageDraft()
  const done = completion(responses)
  return (
    <>
      <div className="detail-hero">
        <span className="eyebrow">{tr("एक बार प्रति गाँव")}</span>
        <h2>{village ? `${tr("ग्राम प्रोफ़ाइल")} – ${village.name}` : tr("ग्राम प्रोफ़ाइल")}</h2>
        <p>
          {tr(
            "सामुदायिक सुविधाएँ, आजीविका अवसंरचना, ग्राम संस्थाएँ और प्राकृतिक संसाधन क्लस्टर योजना के लिए दर्ज किए जाते हैं।",
          )}
        </p>
      </div>
      {village && (
        <>
          <div className="card village-summary-card">
            <div className="village-summary-score">
              <strong>{done.pct}%</strong>
              <span>{tr("पूर्ण")}</span>
            </div>
            <div>
              <h3>{tr("अभी {{n}} उत्तर बाकी", { n: done.total - done.done })}</h3>
              <p>
                {tr("D3 सुविधाएँ")} {done.d3}/{COMMUNITY_FACILITIES.length} • {tr("D4 अवसंरचना")}{" "}
                {done.d4}/{LIVELIHOOD_INFRA.length} • {tr("D5 संस्थाएँ")} {done.d5}/
                {INSTITUTIONS.length}
              </p>
              <i>
                <b style={{ width: `${done.pct}%` }} />
              </i>
            </div>
          </div>
          <div className="card village-priorities">
            <h3>{tr("शीर्ष अवसंरचना जरूरतें")}</h3>
            {responses.needs.length ? (
              responses.needs.map((item, index) => (
                <p key={item}>
                  <Icon name="check" size={14} />
                  {index + 1}. {tr(item)}
                </p>
              ))
            ) : (
              <p className="empty-note">{tr("अभी चुनी नहीं गईं")}</p>
            )}
          </div>
        </>
      )}
    </>
  )
}
