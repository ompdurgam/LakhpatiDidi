import { useMeta } from "@/api/hooks"
import { ChipField, ChipGroup } from "@/components/ui/ChipGroup"
import { useDraftState } from "@/components/ui/draft"
import { FormGroup } from "@/components/ui/FormGroup"
import { Icon } from "@/components/ui/Icon"
import { NumberControl } from "@/components/ui/NumberStepper"
import { SelectControl } from "@/components/ui/Select"
import { TextControl } from "@/components/ui/TextControl"
import { useTr } from "@/i18n/tr"

import type { SurveyHousehold } from "../surveyHouseholds"
import { Acreage } from "./Acreage"
import { LocationFields } from "./LocationFields"

export function IdentificationForm({
  household,
  selectedLivelihoods,
  setSelectedLivelihoods,
  onNotify,
}: {
  /** A Didi on record: her place, SHG and LokOS code replace the sample values. */
  household?: SurveyHousehold
  selectedLivelihoods: string[]
  setSelectedLivelihoods: (items: string[]) => void
  onNotify: (message: string) => void
}) {
  const tr = useTr()
  // Every answer lives in the survey draft (keyed by its field label), so it is
  // submitted and still there when the CRP comes back to this section.
  const [organizations, setOrganizations] = useDraftState<string[]>("सदस्य किस संगठन की", [])
  const meta = useMeta().data
  const [shgMember, setShgMember] = useDraftState("क्या महिला SHG सदस्य है?", "")
  const [pld, setPld] = useDraftState("क्या संभावित लखपति दीदी (PLD) हैं?", "")
  const [disability, setDisability] = useDraftState("दिव्यांगता", "")
  const [landStatus, setLandStatus] = useDraftState("भूमि स्थिति", "")
  const [familyTypes, setFamilyTypes] = useDraftState<string[]>("परिवार प्रकार (एक से अधिक)", [])
  const [ciRoles, setCiRoles] = useDraftState<string[]>("CI भूमिका (एक से अधिक)", [])
  const [counts, setCounts] = useDraftState("परिवार सदस्य संख्या", {
    total: 0,
    male: 0,
    female: 0,
    earners: 0,
    youth: 0,
    children: 0,
    elderly: 0,
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
      <LocationFields household={household} onNotify={onNotify} />
      <FormGroup title={tr("संगठन")}>
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
            <SelectControl label="CLF नाम" value="" options={["", ...(meta?.clfs ?? [])]} />
          )}
          {organizations.includes("VO") && (
            <SelectControl label="VO नाम" value="" options={["", ...(meta?.vos ?? [])]} />
          )}
          {organizations.includes("SHG") &&
            (household?.shg ? (
              <SelectControl label="SHG नाम" value={household.shg} options={[household.shg]} />
            ) : (
              <TextControl label="SHG नाम" value="" />
            ))}
        </div>
        <TextControl label="सदस्य ID / LokOS ID" value="" />
        <ChipField label="क्या संभावित लखपति दीदी (PLD) हैं?">
          <ChipGroup options={["हाँ", "नहीं"]} selected={[pld]} onToggle={setPld} single />
        </ChipField>
      </FormGroup>
      <FormGroup title={tr("व्यक्तिगत")}>
        <div className="control-grid">
          <TextControl label="SHG सदस्य का नाम" value="" />
          <TextControl label="माता-पिता/पति का नाम" value="" />
          <TextControl label="आयु" value="" type="number" />
          <TextControl label="मोबाइल (10 अंक)" value="" type="tel" />
        </div>
        <ChipField label="वैवाहिक स्थिति">
          <ChipGroup
            options={["अविवाहित", "विवाहित", "विधवा", "तलाकशुदा-अलग"]}
            selected={[]}
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
            selected={[]}
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
        {disability === "हाँ" && <TextControl label="दिव्यांगता विवरण" value="" />}
        <ChipField label="सामाजिक वर्ग">
          <ChipGroup options={["सामान्य", "ST", "SC", "OBC", "अन्य"]} selected={[]} single />
        </ChipField>
        <ChipField label="विशेष समुदाय">
          <ChipGroup options={["FRA अधिकारधारी", "PVTG", "अल्पसंख्यक", "कोई नहीं"]} selected={[]} />
        </ChipField>
      </FormGroup>
      <FormGroup title={tr("नेतृत्व")}>
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
            selected={[]}
            single
          />
        </ChipField>
        <ChipField label="CI पद">
          <ChipGroup options={["CRP", "CLF स्टाफ", "अन्य"]} selected={[]} single />
        </ChipField>
      </FormGroup>
      <FormGroup title={tr("परिवार")}>
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
            <Icon name="alert" size={14} />{" "}
            {tr("पुरुष + महिला ({{sum}}) कुल सदस्यों ({{total}}) के बराबर होना चाहिए।", {
              sum: counts.male + counts.female,
              total: counts.total,
            })}
          </div>
        )}
      </FormGroup>
      <FormGroup title={tr("भूमि")}>
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
            <Acreage />
          </>
        )}
      </FormGroup>
      <FormGroup title={tr("आजीविका श्रेणियाँ")}>
        <div className="livelihood-tiles">
          {livelihoodOptions.map(([code, icon, label]) => (
            <button
              key={code}
              className={selectedLivelihoods.includes(code) ? "selected" : ""}
              onClick={() => toggle(selectedLivelihoods, code, setSelectedLivelihoods)}
            >
              <b>{icon}</b>
              <span>{tr(label)}</span>
              <small>{tr("खंड {{code}}", { code })}</small>
            </button>
          ))}
        </div>
        <div className="included-sections">
          {tr("आपके सर्वे में खंड:")} <strong>A B C D {selectedLivelihoods.join(" ")}</strong>
        </div>
      </FormGroup>
    </div>
  )
}
