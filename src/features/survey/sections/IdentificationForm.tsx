import { useState } from "react"

import { ChipField, ChipGroup } from "@/components/ui/ChipGroup"
import { FormGroup } from "@/components/ui/FormGroup"
import { Icon } from "@/components/ui/Icon"
import { NumberControl } from "@/components/ui/NumberStepper"
import { SelectControl } from "@/components/ui/Select"
import { TextControl } from "@/components/ui/TextControl"

export function IdentificationForm({
  selectedLivelihoods,
  setSelectedLivelihoods,
  onNotify,
}: {
  selectedLivelihoods: string[]
  setSelectedLivelihoods: (items: string[]) => void
  onNotify: (message: string) => void
}) {
  const [organizations, setOrganizations] = useState(["CLF", "VO", "SHG"])
  const [shgMember, setShgMember] = useState("हाँ")
  const [pld, setPld] = useState("हाँ")
  const [disability, setDisability] = useState("नहीं")
  const [landStatus, setLandStatus] = useState("स्वामित्व")
  const [familyTypes, setFamilyTypes] = useState(["महिला मुखिया"])
  const [ciRoles, setCiRoles] = useState(["अध्यक्ष"])
  const [counts, setCounts] = useState({
    total: 5,
    male: 2,
    female: 2,
    earners: 2,
    youth: 2,
    children: 1,
    elderly: 1,
    disabled: 0,
  })
  const toggle = (items: string[], item: string, setter: (next: string[]) => void) =>
    setter(items.includes(item) ? items.filter((value) => value !== item) : [...items, item])
  const updateCount = (key: keyof typeof counts, value: number) =>
    setCounts({ ...counts, [key]: Math.max(0, value) })
  const familyMismatch = counts.male + counts.female !== counts.total
  const livelihoodOptions = [
    ["E", "🌾", "कृषि एवं बागवानी"],
    ["F", "🐄", "पशुधन"],
    ["G", "🐟", "मत्स्य पालन"],
    ["H", "🌳", "वन उपज"],
    ["I", "🧺", "गैर-कृषि/MSME"],
    ["J", "🏞", "पर्यटन"],
    ["K", "👷", "मजदूरी/वेतन"],
  ]
  return (
    <div className="identification-form">
      <FormGroup title="स्थान">
        <div className="gps-control">
          <Icon name="map" size={18} />
          <div>
            <strong>GPS स्वतः कैप्चर हुआ</strong>
            <span>19.0748, 82.0080 • ±8m</span>
          </div>
          <button onClick={() => onNotify("GPS स्थान दोबारा लिया गया")}>पुनः लें</button>
        </div>
        <div className="control-grid">
          <SelectControl label="जिला" value="बस्तर" options={["बस्तर"]} />
          <SelectControl label="ब्लॉक" value="जगदलपुर" options={["जगदलपुर"]} />
          <SelectControl label="ग्राम पंचायत" value="बड़ांजी" options={["बड़ांजी", "नानगुर"]} />
          <SelectControl
            label="गाँव"
            value="बड़ांजी"
            options={["बड़ांजी", "नानगुर", "धुरगुड़ा", "आड़ावाल", "कुम्हरावंड"]}
          />
        </div>
      </FormGroup>
      <FormGroup title="संगठन">
        <ChipField label="क्या महिला SHG सदस्य है?">
          <ChipGroup
            options={["हाँ", "नहीं"]}
            selected={[shgMember]}
            onToggle={setShgMember}
            single
          />
        </ChipField>
        <ChipField label="सदस्य किस संगठन की">
          <ChipGroup
            options={["CLF", "VO", "SHG", "कोई नहीं"]}
            selected={organizations}
            onToggle={(item) => toggle(organizations, item, setOrganizations)}
          />
        </ChipField>
        <div className="control-grid">
          {organizations.includes("CLF") && (
            <SelectControl
              label="CLF नाम"
              value="माँ दंतेश्वरी CLF"
              options={["माँ दंतेश्वरी CLF", "इंद्रावती CLF"]}
            />
          )}
          {organizations.includes("VO") && (
            <SelectControl label="VO नाम" value="शक्ति VO" options={["शक्ति VO", "नई दिशा VO"]} />
          )}
          {organizations.includes("SHG") && (
            <SelectControl
              label="SHG नाम"
              value="स्वावलंबी SHG"
              options={["स्वावलंबी SHG", "माँ बमलेश्वरी SHG"]}
            />
          )}
        </div>
        <label className="verified-input">
          <span>सदस्य ID / LokOS ID</span>
          <div>
            <input defaultValue="LK-BST-440921" />
            <button onClick={() => onNotify("LokOS ID सत्यापित है")}>सत्यापित करें</button>
          </div>
        </label>
        <ChipField label="क्या संभावित लखपति दीदी (PLD) हैं?">
          <ChipGroup options={["हाँ", "नहीं"]} selected={[pld]} onToggle={setPld} single />
        </ChipField>
      </FormGroup>
      <FormGroup title="व्यक्तिगत">
        <div className="control-grid">
          <TextControl label="SHG सदस्य का नाम" value="सुनीता कश्यप" />
          <TextControl label="माता-पिता/पति का नाम" value="राम कश्यप" />
          <TextControl label="आयु" value="34" type="number" />
          <TextControl label="मोबाइल (10 अंक)" value="9826143412" type="tel" />
        </div>
        <ChipField label="वैवाहिक स्थिति">
          <ChipGroup
            options={["अविवाहित", "विवाहित", "विधवा", "तलाकशुदा-अलग"]}
            selected={["विवाहित"]}
            single
          />
        </ChipField>
        <ChipField label="शिक्षा">
          <ChipGroup
            options={[
              "कोई औपचारिक शिक्षा नहीं",
              "प्राथमिक",
              "माध्यमिक",
              "हाई स्कूल",
              "हायर सेकेंडरी",
              "स्नातक+",
            ]}
            selected={["माध्यमिक"]}
            single
          />
        </ChipField>
        <ChipField label="दिव्यांगता">
          <ChipGroup
            options={["नहीं", "हाँ"]}
            selected={[disability]}
            onToggle={setDisability}
            single
          />
        </ChipField>
        {disability === "हाँ" && <TextControl label="दिव्यांगता विवरण" value="चलने में कठिनाई" />}
        <ChipField label="सामाजिक वर्ग">
          <ChipGroup options={["सामान्य", "ST", "SC", "OBC"]} selected={["ST"]} single />
        </ChipField>
        <ChipField label="विशेष समुदाय">
          <ChipGroup
            options={["FRA अधिकारधारी", "PVTG", "अल्पसंख्यक", "कोई नहीं"]}
            selected={["FRA अधिकारधारी"]}
          />
        </ChipField>
      </FormGroup>
      <FormGroup title="नेतृत्व">
        <ChipField label="CI भूमिका (एक से अधिक)">
          <ChipGroup
            options={["अध्यक्ष", "सचिव", "कोषाध्यक्ष", "कोई नहीं"]}
            selected={ciRoles}
            onToggle={(item) => toggle(ciRoles, item, setCiRoles)}
          />
        </ChipField>
        <ChipField label="PRI भूमिका">
          <ChipGroup
            options={[
              "सरपंच",
              "पंच",
              "जनपद अध्यक्ष",
              "जनपद सदस्य",
              "जिला पंचायत अध्यक्ष",
              "जिला पंचायत सदस्य",
            ]}
            selected={["पंच"]}
            single
          />
        </ChipField>
        <ChipField label="CI पद">
          <ChipGroup options={["CRP", "CLF स्टाफ", "अन्य"]} selected={["CRP"]} single />
        </ChipField>
      </FormGroup>
      <FormGroup title="परिवार">
        <ChipField label="परिवार प्रकार (एक से अधिक)">
          <ChipGroup
            options={[
              "महिला मुखिया",
              "एकल महिला",
              "केवल बुजुर्ग",
              "दिव्यांग सदस्य",
              "मौसमी प्रवासन",
              "भूमिहीन",
              "अन्य",
            ]}
            selected={familyTypes}
            onToggle={(item) => toggle(familyTypes, item, setFamilyTypes)}
          />
        </ChipField>
        <div className="number-grid">
          {[
            ["total", "कुल सदस्य"],
            ["male", "पुरुष"],
            ["female", "महिला"],
            ["earners", "कमाने वाले"],
            ["youth", "युवा 18–35"],
            ["children", "बच्चे 0–17"],
            ["elderly", "बुजुर्ग 60+"],
            ["disabled", "दिव्यांग"],
          ].map(([key, label]) => (
            <NumberControl
              key={key}
              label={label}
              value={counts[key as keyof typeof counts]}
              onChange={(value) => updateCount(key as keyof typeof counts, value)}
            />
          ))}
        </div>
        {familyMismatch && (
          <div className="validation-error">
            <Icon name="alert" size={14} /> पुरुष + महिला ({counts.male + counts.female}) कुल
            सदस्यों ({counts.total}) के बराबर होना चाहिए।
          </div>
        )}
      </FormGroup>
      <FormGroup title="भूमि">
        <ChipField label="भूमि स्थिति">
          <ChipGroup
            options={["भूमिहीन", "स्वामित्व", "पट्टे पर", "बटाई", "FRA पट्टा"]}
            selected={[landStatus]}
            onToggle={setLandStatus}
            single
          />
        </ChipField>
        {landStatus !== "भूमिहीन" && (
          <>
            <div className="control-grid acreage">
              <TextControl label="स्वामित्व एकड़" value="1.5" type="number" />
              <TextControl label="पट्टा एकड़" value="0" type="number" />
              <TextControl label="बटाई एकड़" value="0.5" type="number" />
              <TextControl label="FRA एकड़" value="1" type="number" />
              <label className="auto-control">
                <span>कुल एकड़ (स्वतः)</span>
                <div>3.0</div>
              </label>
              <TextControl label="सिंचित एकड़" value="1" type="number" />
              <TextControl label="असिंचित एकड़" value="2" type="number" />
            </div>
          </>
        )}
      </FormGroup>
      <FormGroup title="आजीविका श्रेणियाँ">
        <div className="livelihood-tiles">
          {livelihoodOptions.map(([code, icon, label]) => (
            <button
              key={code}
              className={selectedLivelihoods.includes(code) ? "selected" : ""}
              onClick={() => toggle(selectedLivelihoods, code, setSelectedLivelihoods)}
            >
              <b>{icon}</b>
              <span>{label}</span>
              <small>खंड {code}</small>
            </button>
          ))}
        </div>
        <div className="included-sections">
          आपके सर्वे में खंड: <strong>A B C D {selectedLivelihoods.join(" ")}</strong>
        </div>
      </FormGroup>
    </div>
  )
}
