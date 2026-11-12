import { ChipField, ChipGroup } from "@/components/ui/ChipGroup"
import { useDraftState } from "@/components/ui/draft"
import { FormGroup } from "@/components/ui/FormGroup"
import { Icon } from "@/components/ui/Icon"
import { NumberControl } from "@/components/ui/NumberStepper"
import { IncomeMismatch, NeedsBlock } from "@/features/survey/sections/livelihood/shared"
import type { CropRow } from "@/features/survey/types"
import { useTr } from "@/i18n/tr"

import { AmountGrid } from "./AmountGrid"

export function AgricultureSection({ baseline }: { baseline: number }) {
  const tr = useTr()
  const [irrigationMonths, setIrrigationMonths] = useDraftState("सिंचाई महीने (0–12)", 0)
  const [crops, setCrops] = useDraftState<CropRow[]>("फसल विवरण", [
    { crop: "", season: "खरीफ", acres: 0, production: 0, sold: 0, consumed: 0 },
  ])
  const [income, setIncome] = useDraftState("वार्षिक आय", {
    kharif: 0,
    rabi: 0,
    horticulture: 0,
  })
  const total = income.kharif + income.rabi + income.horticulture
  const cropTypes = [
    "धान",
    "मक्का",
    "मोटे अनाज",
    "दलहन",
    "तिलहन",
    "सब्जियाँ",
    "मिर्च/मसाले",
    "हल्दी",
    "कॉफ़ी",
    "मुनगा",
    "काजू",
    "पपीता",
    "केला",
    "नींबू",
    "सीताफल",
    "ऑयल पाम",
    "मशरूम",
    "औषधीय पौधे",
    "नर्सरी",
  ]
  const updateCrop = (index: number, patch: Partial<CropRow>) =>
    setCrops(crops.map((crop, cropIndex) => (cropIndex === index ? { ...crop, ...patch } : crop)))
  return (
    <div className="section-form livelihood-form">
      <IncomeMismatch income={total} baseline={baseline} />
      <FormGroup title={tr("सिंचाई, मिट्टी और जोखिम")}>
        <ChipField label="सिंचाई स्रोत">
          <ChipGroup options={["कुआँ", "तालाब", "नहर", "वर्षा", "अन्य"]} selected={[]} />
        </ChipField>
        <NumberControl
          label="सिंचाई महीने (0–12)"
          value={irrigationMonths}
          onChange={(value) => setIrrigationMonths(Math.min(12, value))}
        />
        <ChipField label="मृदा परीक्षण">
          <ChipGroup
            options={["पिछले 2 वर्षों में", "नहीं", "रिपोर्ट नहीं मिली"]}
            selected={[]}
            single
          />
        </ChipField>
        <ChipField label="जलवायु जोखिम">
          <ChipGroup
            options={["सूखा", "बाढ़", "अत्यधिक गर्मी", "कीट", "असमय वर्षा", "पता नहीं"]}
            selected={[]}
          />
        </ChipField>
      </FormGroup>
      <FormGroup title={tr("फसल विवरण")}>
        <div className="crop-rows">
          {crops.map((crop, index) => (
            <div className="crop-row" key={`${crop.crop}-${index}`}>
              <div className="crop-row-head">
                <strong>
                  {tr("फसल")} {index + 1}
                </strong>
                {crops.length > 1 && (
                  <button
                    onClick={() => setCrops(crops.filter((_, cropIndex) => cropIndex !== index))}
                  >
                    {tr("हटाएँ")}
                  </button>
                )}
              </div>
              <div className="control-grid">
                <label className="text-control">
                  <span>{tr("फसल")}</span>
                  <input
                    value={crop.crop}
                    onChange={(event) => updateCrop(index, { crop: event.target.value })}
                  />
                </label>
                <label className="text-control">
                  <span>{tr("मौसम")}</span>
                  <select
                    value={crop.season}
                    onChange={(event) => updateCrop(index, { season: event.target.value })}
                  >
                    <option value="खरीफ">{tr("खरीफ")}</option>
                    <option value="रबी">{tr("रबी")}</option>
                    <option value="जायद">{tr("जायद")}</option>
                  </select>
                </label>
                {[
                  ["एकड़", "acres"],
                  ["उत्पादन क्विंटल", "production"],
                  ["बेचा", "sold"],
                  ["स्व-उपभोग", "consumed"],
                ].map(([label, key]) => (
                  <label className="text-control" key={key}>
                    <span>{tr(label)}</span>
                    <input
                      type="number"
                      value={crop[key as keyof CropRow] as number}
                      onChange={(event) => updateCrop(index, { [key]: Number(event.target.value) })}
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          className="add-row-button"
          onClick={() =>
            setCrops([
              ...crops,
              {
                crop: "",
                season: "खरीफ",
                acres: 0,
                production: 0,
                sold: 0,
                consumed: 0,
              },
            ])
          }
        >
          <Icon name="plus" size={14} /> {tr("फसल जोड़ें")}
        </button>
      </FormGroup>
      <FormGroup title={tr("फसल-वार क्षेत्र (एकड़)")}>
        <AmountGrid
          name="फसल-वार क्षेत्र (एकड़)"
          items={cropTypes}
          className="crop-acre-grid"
          step="0.1"
        />
      </FormGroup>
      <FormGroup title={tr("वार्षिक आय")}>
        <div className="income-entry-grid">
          {(
            [
              ["खरीफ", "kharif"],
              ["रबी", "rabi"],
              ["बागवानी", "horticulture"],
            ] as const
          ).map(([label, key]) => (
            <label key={key}>
              <span>{tr(label)} ₹</span>
              <input
                type="number"
                value={income[key]}
                onChange={(event) => setIncome({ ...income, [key]: Number(event.target.value) })}
              />
            </label>
          ))}
          <label className="auto-income">
            <span>{tr("कुल (स्वतः)")}</span>
            <strong>₹{total.toLocaleString("en-IN")}</strong>
          </label>
        </div>
      </FormGroup>
      <NeedsBlock
        received={[
          "बीज",
          "जैविक खाद",
          "उर्वरक",
          "कीटनाशक",
          "IPM किट",
          "कृषि ऋण",
          "फसल बीमा",
          "बाजार जुड़ाव",
        ]}
        movable={[
          "बीज किट",
          "कृषि उपकरण",
          "पंप सेट (डीज़ल/विद्युत/सौर)",
          "मल्चिंग शीट",
          "फल पौध",
          "ट्री गार्ड",
        ]}
        fixed={["ड्रिप/स्प्रिंकलर", "वर्मी-कम्पोस्ट", "NADEP", "शेड नेट/पॉलीहाउस", "कोल्ड स्टोरेज"]}
      />
    </div>
  )
}
