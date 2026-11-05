import { Icon } from "@/components/ui/Icon"

export function EntitlementGaps({
  raised,
  setRaised,
}: {
  raised: string[]
  setRaised: (items: string[]) => void
}) {
  const gaps = [
    [
      "आयुष्मान कार्ड",
      "स्वास्थ्य विभाग",
      "e-KYC और परिवार सत्यापन बाकी",
      "CSC बड़ांजी",
      "आधार, राशन कार्ड",
      "red",
    ],
    [
      "PMJJBY बीमा",
      "संस्थागत वित्त",
      "बीमा नामांकन नहीं",
      "बैंक सखी / बैंक शाखा",
      "पासबुक, आधार",
      "red",
    ],
    [
      "अटल पेंशन योजना",
      "संस्थागत वित्त",
      "APY खाता सक्रिय नहीं",
      "बैंक सखी / बैंक शाखा",
      "पासबुक, मोबाइल",
      "red",
    ],
    [
      "PMAY-G",
      "पंचायत एवं ग्रामीण विकास",
      "आवेदन ब्लॉक स्तर पर लंबित",
      "ग्राम पंचायत बड़ांजी",
      "आवास सूची ID, आधार",
      "amber",
    ],
  ]
  return (
    <div className="entitlement-gaps">
      <p className="section-help">सर्वे में पात्र लेकिन लाभ न मिलने वाली योजनाएँ</p>
      {gaps.map(([name, dept, missing, apply, docs, color]) => {
        const isRaised = raised.includes(name)
        return (
          <article className="gap-card" key={name}>
            <div className="gap-card-head">
              <div>
                <strong>{name}</strong>
                <span>{dept}</span>
              </div>
              <span className={`status ${color}`}>
                {isRaised ? "मांग दर्ज" : color === "amber" ? "लंबित" : "गैप"}
              </span>
            </div>
            <dl>
              <div>
                <dt>क्या कमी है</dt>
                <dd>{missing}</dd>
              </div>
              <div>
                <dt>कहाँ आवेदन करें</dt>
                <dd>{apply}</dd>
              </div>
              <div>
                <dt>दस्तावेज़</dt>
                <dd>{docs}</dd>
              </div>
            </dl>
            <button disabled={isRaised} onClick={() => setRaised([...raised, name])}>
              {isRaised ? "मांग दर्ज हो गई" : "मांग दर्ज करें"}{" "}
              <Icon name={isRaised ? "check" : "arrow"} size={14} />
            </button>
          </article>
        )
      })}
    </div>
  )
}
