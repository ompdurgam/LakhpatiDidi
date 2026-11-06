import { useState } from "react"

import { Icon } from "@/components/ui/Icon"
import { EntitlementGaps } from "@/features/recommendations/EntitlementGaps"
import { RecommendationCard } from "@/features/recommendations/RecommendationCard"
import { RecommendationSheet } from "@/features/recommendations/RecommendationSheet"
import { SchemeConsentModal } from "@/features/recommendations/SchemeConsentModal"
import { useTr } from "@/i18n/tr"

export function SchemeRecommendations({
  selected,
  setSelected,
  setScreen,
  desktop = false,
}: {
  selected: string[]
  setSelected: (items: string[]) => void
  setScreen: (screen: string) => void
  desktop?: boolean
}) {
  const tr = useTr()
  const [tab, setTab] = useState<"schemes" | "gaps">("schemes")
  const [sheet, setSheet] = useState<{
    type: "reason" | "later"
    key: string
  } | null>(null)
  const [consentOpen, setConsentOpen] = useState(false)
  const [raised, setRaised] = useState<string[]>([])
  const schemes = [
    {
      key: "PMMSY",
      name: "PMMSY तालाब",
      dept: "मत्स्य विभाग",
      benefit: "₹1,20,000",
      score: "94%",
      why: "तालाब 0.5 एकड़ और मत्स्य गतिविधि में रुचि",
      eligibility: [
        [true, "तालाब 0.5 एकड़"],
        [true, "बैंक खाता"],
        [true, "ST श्रेणी"],
        [false, "तालाब पट्टा अद्यतन नहीं"],
      ] as [boolean, string][],
      docs: ["आधार", "पासबुक", "फोटो", "तालाब पट्टा"],
      apply: "सहायक संचालक मत्स्य, जगदलपुर",
    },
    {
      key: "Poultry",
      name: "बैकयार्ड कुक्कुट पालन",
      dept: "पशुधन विभाग",
      benefit: "₹48,000",
      score: "87%",
      why: "दूसरा नियमित आय स्रोत जोड़ने की संभावना",
      eligibility: [
        [true, "SHG सदस्य"],
        [true, "घर के पास स्थान"],
        [true, "पशु सखी उपलब्ध"],
        [false, "पूर्व प्रशिक्षण नहीं"],
      ] as [boolean, string][],
      docs: ["आधार", "पासबुक", "फोटो", "SHG प्रस्ताव"],
      apply: "पशु चिकित्सा अधिकारी, जगदलपुर",
    },
    {
      key: "Goat",
      name: "राज्य बकरी उद्यमिता",
      dept: "पशुधन विभाग",
      benefit: "₹90,000",
      score: "79%",
      why: "परिवार के पास चराई और पशुपालन अनुभव",
      eligibility: [
        [true, "ST श्रेणी"],
        [true, "चराई सुविधा"],
        [true, "SHG सदस्य"],
        [false, "पशु शेड नहीं"],
      ] as [boolean, string][],
      docs: ["आधार", "पासबुक", "फोटो", "भूमि सहमति"],
      apply: "पशुधन विकास विभाग, जगदलपुर",
    },
    {
      key: "NHM",
      name: "NHM सूक्ष्म सिंचाई",
      dept: "उद्यानिकी विभाग",
      benefit: "55% अनुदान",
      score: "76%",
      why: "1.5 एकड़ खेती और सिंचाई सहायता की जरूरत",
      eligibility: [
        [true, "कृषि भूमि 1.5 एकड़"],
        [true, "जल स्रोत उपलब्ध"],
        [true, "आधार-बैंक लिंक"],
        [false, "B1-P2 अद्यतन नहीं"],
      ] as [boolean, string][],
      docs: ["आधार", "पासबुक", "फोटो", "B1-P2"],
      apply: "उद्यानिकी विकास अधिकारी, जगदलपुर",
    },
    {
      key: "VanDhan",
      name: "लाख विकास / वन धन",
      dept: "वन विभाग",
      benefit: "₹35,000",
      score: "72%",
      why: "FRA अधिकार और मौसमी वन उपज संग्रह",
      eligibility: [
        [true, "FRA अधिकारधारी"],
        [true, "NTFP संग्रह"],
        [true, "VDVK क्षेत्र"],
        [false, "PG सदस्यता लंबित"],
      ] as [boolean, string][],
      docs: ["आधार", "पासबुक", "फोटो", "FRA पट्टा"],
      apply: "वन धन केंद्र, बड़ांजी",
    },
    {
      key: "PMFBY",
      name: "PM फसल बीमा",
      dept: "कृषि विभाग",
      benefit: "प्रीमियम सहायता",
      score: "81%",
      why: "धान खेती और असमय वर्षा का जोखिम",
      eligibility: [
        [true, "अधिसूचित धान फसल"],
        [true, "बैंक खाता"],
        [true, "भूमि रिकॉर्ड"],
        [false, "KCC नहीं"],
      ] as [boolean, string][],
      docs: ["आधार", "पासबुक", "फोटो", "बोनी प्रमाण"],
      apply: "वरिष्ठ कृषि विकास अधिकारी, जगदलपुर",
    },
  ]
  const toggle = (key: string) =>
    setSelected(selected.includes(key) ? selected.filter((x) => x !== key) : [...selected, key])
  return (
    <div className={desktop ? "recommend-desktop" : "phone-content recommendation"}>
      <div className="recommend-profile">
        <div className="avatar large">SK</div>
        <div>
          <strong>{tr("सुनीता कश्यप")}</strong>
          <span>HH-BST-JGD-000123</span>
        </div>
        <b>
          ₹78,500 <small>{tr("वर्तमान आय")}</small>
        </b>
      </div>
      <div className="stacking-path">
        <span>{tr("पूर्ण स्टैकिंग मार्ग (वन + तालाब गाँव)")}</span>
        <strong>{tr("धान ₹35–45K + NTFP ₹20–30K + मत्स्य (PMMSY) ₹20–35K")}</strong>
        <div>
          <i style={{ width: "34%" }} />
          <i style={{ width: "23%" }} />
          <i style={{ width: "43%" }} />
        </div>
        <small>{tr("अनुमानित आय ₹1,16,000 • 3 सक्रिय स्रोत")}</small>
      </div>
      <div className="recommend-tabs">
        <button className={tab === "schemes" ? "active" : ""} onClick={() => setTab("schemes")}>
          {tr("आजीविका योजनाएँ")} <b>6</b>
        </button>
        <button className={tab === "gaps" ? "active" : ""} onClick={() => setTab("gaps")}>
          {tr("हकदारी अंतर")} <b>4</b>
        </button>
      </div>
      {tab === "schemes" ? (
        <div className="grouped-schemes">
          {["मत्स्य विभाग", "पशुधन विभाग", "उद्यानिकी विभाग", "वन विभाग", "कृषि विभाग"].map(
            (department) => (
              <section className="recommend-department" key={department}>
                <div className="recommend-department-head">
                  <span>
                    <Icon name="building" size={15} />
                  </span>
                  <strong>{tr(department)}</strong>
                  <small>
                    {schemes.filter((scheme) => scheme.dept === department).length} {tr("सुझाव")}
                  </small>
                </div>
                <div className="scheme-list">
                  {schemes
                    .filter((scheme) => scheme.dept === department)
                    .map((scheme) => (
                      <RecommendationCard
                        key={scheme.key}
                        scheme={scheme}
                        interested={selected.includes(scheme.key)}
                        onToggle={() => toggle(scheme.key)}
                        onLater={() => setSheet({ type: "later", key: scheme.key })}
                        onDecline={() => setSheet({ type: "reason", key: scheme.key })}
                      />
                    ))}
                </div>
              </section>
            ),
          )}
        </div>
      ) : (
        <EntitlementGaps raised={raised} setRaised={setRaised} />
      )}
      {tab === "schemes" && (
        <button
          className="sticky-dpr"
          disabled={!selected.length}
          onClick={() => setConsentOpen(true)}
        >
          {tr("चयनित के लिए DPR बनाएँ (")}
          {selected.length}) <Icon name="arrow" size={17} />
        </button>
      )}
      {sheet && (
        <RecommendationSheet
          type={sheet.type}
          schemeName={schemes.find((scheme) => scheme.key === sheet.key)?.name || ""}
          onClose={() => setSheet(null)}
          onConfirm={() => {
            if (sheet.type === "reason") {
              setSelected(selected.filter((key) => key !== sheet.key))
            }
            setSheet(null)
          }}
        />
      )}
      {consentOpen && (
        <SchemeConsentModal
          schemes={schemes.filter((scheme) => selected.includes(scheme.key))}
          onClose={() => setConsentOpen(false)}
          onConfirm={() => setScreen("dpr")}
        />
      )}
    </div>
  )
}
