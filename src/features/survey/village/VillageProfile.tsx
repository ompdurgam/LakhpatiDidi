import { ChipField, ChipGroup } from "@/components/ui/ChipGroup"
import { NumberControl } from "@/components/ui/NumberStepper"
import { TextControl } from "@/components/ui/TextControl"
import { FacilityGroup } from "@/features/survey/village/FacilityGroup"
import { InstitutionRow } from "@/features/survey/village/InstitutionRow"
import { useTr } from "@/i18n/tr"

export function VillageProfile({ setScreen }: { setScreen: (screen: string) => void }) {
  const tr = useTr()
  const community = [
    "आंगनवाड़ी भवन",
    "स्वास्थ्य केंद्र 3 किमी में",
    "पशु चिकित्सा केंद्र",
    "राशन दुकान",
    "प्राथमिक विद्यालय",
    "खेल मैदान",
    "बारहमासी सड़क",
    "पुलिया",
    "ग्रिड बिजली",
    "इंटरनेट/नेटवर्क",
    "डाकघर 3 किमी",
    "बैंक शाखा 3 किमी",
    "पंचायत भवन",
    "CSC",
    "सामुदायिक भवन",
  ]
  const livelihood = [
    "प्रशिक्षण केंद्र",
    "SHG कार्यशेड",
    "CLF भवन",
    "शी मार्ट",
    "मशरूम शेड",
    "कारीगर शेड",
    "रेशम शेड",
    "ग्रामीण हाट",
    "खाद्यान्न भंडारण",
    "कोल्ड स्टोरेज",
    "धान सुखाने का प्लेटफॉर्म",
    "वर्मी/NADEP",
    "दुग्ध संकलन केंद्र",
  ]
  const institutions = [
    "SHG",
    "VO",
    "CLF",
    "उत्पादक समूह",
    "FPO",
    "वन धन केंद्र (VDVK)",
    "PACS/LAMPS",
    "दुग्ध समिति",
    "मत्स्य समिति",
    "JFMC/FRC",
    "तेंदूपत्ता समिति",
    "कस्टम हायरिंग सेंटर",
    "बैंक सखी",
    "कृषि/पशु/मत्स्य सखी",
    "VLE",
  ]
  return (
    <div className="phone-content village-profile">
      <div className="village-header">
        <button onClick={() => setScreen("home")}>‹</button>
        <div>
          <small>{tr("ग्राम प्रोफ़ाइल")}</small>
          <strong>{tr("बड़ांजी")}</strong>
          <span>{tr("बड़ांजी GP • जगदलपुर")}</span>
        </div>
        <b>70%</b>
      </div>
      <div className="village-progress">
        <i>
          <b />
        </i>
        <span>{tr("70% पूर्ण • अंतिम अपडेट 12 नवंबर 2026")}</span>
      </div>
      <FacilityGroup title={tr("D3 सामुदायिक सुविधाएँ")} items={community} more={14} />
      <FacilityGroup title={tr("D4 आजीविका अवसंरचना")} items={livelihood} more={22} />
      <section className="ranked-needs">
        <h3>{tr("सबसे आवश्यक 3 आजीविका अवसंरचनाएँ")}</h3>
        {[
          ["1", "कोल्ड स्टोरेज"],
          ["2", "SHG कार्यशेड"],
          ["3", "धान सुखाने का प्लेटफॉर्म"],
        ].map(([rank, value]) => (
          <label key={rank}>
            <b>{rank}</b>
            <select defaultValue={value}>
              {livelihood.map((item) => (
                <option key={item} value={item}>
                  {tr(item)}
                </option>
              ))}
            </select>
          </label>
        ))}
      </section>
      <section className="village-section">
        <div className="village-section-title">
          <div>
            <span>D5</span>
            <h3>{tr("ग्राम संस्थाएँ")}</h3>
          </div>
          <small>{tr("15 मद")}</small>
        </div>
        <div className="institution-list">
          {institutions.map((item, index) => (
            <InstitutionRow key={item} name={item} index={index} />
          ))}
        </div>
      </section>
      <section className="village-section village-resources">
        <div className="village-section-title">
          <div>
            <span>{tr("संसाधन")}</span>
            <h3>{tr("ग्राम संसाधन")}</h3>
          </div>
        </div>
        <div className="resource-pond">
          <NumberControl label="तालाब संख्या" value={4} onChange={() => undefined} />
          <TextControl label="कुल क्षेत्रफल (एकड़)" value="7.5" type="number" />
        </div>
        {["वन क्षेत्र", "CFR पट्टा", "नदी/नहर", "पर्यटन स्थल"].map((item, index) => (
          <ChipField key={item} label={tr("{{item}} उपलब्ध?", { item: tr(item) })}>
            <ChipGroup options={["हाँ", "नहीं"]} selected={[index === 2 ? "नहीं" : "हाँ"]} single />
          </ChipField>
        ))}
      </section>
      <div className="village-save">
        <button className="secondary">{tr("ड्राफ्ट")}</button>
        <button className="primary">{tr("ग्राम प्रोफ़ाइल सहेजें")}</button>
      </div>
    </div>
  )
}
