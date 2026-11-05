import { Icon } from "@/components/ui/Icon"

export function SurveyCompanion({
  step,
  setStep,
  setScreen,
  sections,
  selectedLivelihoods,
  english,
}: {
  step: number
  setStep: (step: number) => void
  setScreen: (screen: string) => void
  sections: string[]
  selectedLivelihoods: string[]
  english: boolean
}) {
  const codes = ["E", "F", "G", "H", "I", "J", "K"]
  const applicable = (index: number) =>
    index < 4 || index === 11 || selectedLivelihoods.includes(codes[index - 4])
  return (
    <>
      <div className="detail-hero">
        <span className="eyebrow">{english ? "Survey wizard" : "सर्वे विज़ार्ड"}</span>
        <h2>{english ? "Household survey progress" : "परिवार सर्वे की प्रगति"}</h2>
        <p>
          सशर्त सेक्शन चुनी गई आजीविका के आधार पर अपने-आप दिखाई देते हैं। हर सेक्शन ऑफलाइन सुरक्षित
          होता है।
        </p>
      </div>
      <div className="card section-directory">
        {sections.map((item, index) => (
          <button
            key={item}
            className={`${
              index === step ? "active" : index < step && applicable(index) ? "done" : ""
            } ${!applicable(index) ? "not-applicable" : ""}`}
            onClick={() => applicable(index) && setStep(index)}
          >
            <i>{index < step ? "✓" : index + 1}</i>
            <span>{item}</span>
            {index > 3 && index < 11 && (
              <small>
                {applicable(index)
                  ? english
                    ? "Selected"
                    : "चयनित"
                  : english
                    ? "N/A"
                    : "लागू नहीं"}
              </small>
            )}
            <Icon name="chevron" size={16} />
          </button>
        ))}
      </div>
      <div className="card gps-card">
        <Icon name="map" />
        <div>
          <strong>GPS कैप्चर हुआ</strong>
          <span>19.0748° N, 82.0080° E • ±8m</span>
        </div>
        <span className="status green">सत्यापित</span>
      </div>
      <button className="primary companion-cta" onClick={() => setScreen("recommend")}>
        सर्वे जमा कर योजना सुझाव देखें <Icon name="arrow" size={17} />
      </button>
    </>
  )
}
