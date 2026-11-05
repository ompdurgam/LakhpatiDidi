import type { ApplicationRow } from "@/api/types"
import { Icon } from "@/components/ui/Icon"
import { MiniStat } from "@/components/ui/MiniStat"
import { ApplicationTable } from "@/features/applications/ApplicationTable"
import { Blcc } from "@/features/blcc/BlccRegister"
import { SchemeConvergence } from "@/features/block/SchemeConvergence"
import { HouseholdRegister } from "@/features/households/HouseholdRegister"
import { BlockReports } from "@/features/reports/BlockReports"

export function ModulePage({
  active,
  rows,
  onSelect,
  onNotify,
}: {
  active: string
  rows: ApplicationRow[]
  onSelect: (item: ApplicationRow) => void
  onNotify: (s: string) => void
}) {
  const titleMap: Record<string, string> = {
    परिवार: "परिवार और दीदी रजिस्टर",
    आवेदन: "आवेदन एवं DPR ट्रैकर",
    "BLCC कार्यवाही": "BLCC कार्यवाही रजिस्टर",
    योजनाएँ: "योजना अभिसरण",
    रिपोर्ट: "रिपोर्ट और विश्लेषण",
    सेटिंग्स: "पोर्टल सेटिंग्स",
  }
  return (
    <div className="page module-page">
      <section className="welcome">
        <div>
          <h2>{titleMap[active] || active}</h2>
          <p>जगदलपुर ब्लॉक • अंतिम अपडेट आज, 10:42 AM</p>
        </div>
        <div className="welcome-actions">
          <button className="secondary">
            <Icon name="download" size={17} /> एक्सपोर्ट
          </button>
          <button className="primary" onClick={() => onNotify("नया रिकॉर्ड फॉर्म खोला गया")}>
            <Icon name="plus" size={17} /> नया जोड़ें
          </button>
        </div>
      </section>
      {active === "परिवार" ? (
        <HouseholdRegister onNotify={onNotify} />
      ) : active === "आवेदन" ? (
        <section className="card applications-card">
          <div className="card-head">
            <div>
              <h3>सभी आवेदन</h3>
              <p>कुल 1,847 आवेदन • 24 पर कार्यवाही बाकी</p>
            </div>
            <button className="filter-button">
              <Icon name="filter" size={15} /> स्थिति फ़िल्टर
            </button>
          </div>
          <ApplicationTable rows={rows} onSelect={onSelect} />
        </section>
      ) : active === "BLCC कार्यवाही" ? (
        <Blcc onNotify={onNotify} />
      ) : active === "योजनाएँ" ? (
        <SchemeConvergence />
      ) : active === "रिपोर्ट" ? (
        <BlockReports onNotify={onNotify} />
      ) : (
        <>
          <section className="module-kpis">
            <MiniStat value={active === "परिवार" ? "8,426" : "42"} label="कुल रिकॉर्ड" />
            <MiniStat value="1,392" label="इस माह सक्रिय" />
            <MiniStat value="86%" label="पूर्णता दर" />
            <MiniStat value="24" label="कार्यवाही बाकी" alert />
          </section>
          <section className="card generic-list">
            <div className="card-head">
              <div>
                <h3>{titleMap[active]}</h3>
                <p>प्राथमिकता और हाल के अपडेट</p>
              </div>
              <button className="filter-button">
                <Icon name="filter" size={15} /> फ़िल्टर
              </button>
            </div>
            {[
              "माँ दंतेश्वरी CLF • बड़ांजी",
              "इंद्रावती CLF • नानगुर",
              "शक्ति महिला CLF • आड़ावाल",
              "माँ बमलेश्वरी CLF • धुरगुड़ा",
            ].map((x, i) => (
              <div className="generic-row" key={x}>
                <div className="generic-icon">
                  <Icon
                    name={active === "परिवार" ? "people" : active === "योजनाएँ" ? "scheme" : "file"}
                  />
                </div>
                <div>
                  <strong>{x}</strong>
                  <span>रिकॉर्ड #{260140 - i} • आज अपडेट किया</span>
                </div>
                <span className={`status ${i === 2 ? "amber" : "green"}`}>
                  {i === 2 ? "ध्यान दें" : "सक्रिय"}
                </span>
                <Icon name="chevron" size={17} />
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  )
}
