import { ChipField, ChipGroup } from "@/components/ui/ChipGroup"
import { useDraftState } from "@/components/ui/draft"
import { FormGroup } from "@/components/ui/FormGroup"
import { TextControl } from "@/components/ui/TextControl"
import { IncomeMismatch, NeedsBlock } from "@/features/survey/sections/livelihood/shared"
import { useTr } from "@/i18n/tr"

import { AmountGrid } from "./AmountGrid"

export function NonFarmSection({ baseline }: { baseline: number }) {
  const tr = useTr()
  const [income, setIncome] = useDraftState("कुल उद्यम आय ₹", 0)
  return (
    <div className="section-form livelihood-form">
      <IncomeMismatch income={income} baseline={baseline} />
      <FormGroup title={tr("उद्यम विवरण")}>
        <ChipField label="प्रकार">
          <ChipGroup options={["सेवा", "विनिर्माण", "व्यापार"]} selected={[]} single />
        </ChipField>
        <TextControl label="गतिविधि विवरण" value="" />
        <AmountGrid
          name="गतिविधि-वार आय"
          className="income-chip-grid"
          items={[
            "ढोकरा/बेल मेटल",
            "लौह शिल्प",
            "टेराकोटा/काष्ठ",
            "बाँस शिल्प",
            "हथकरघा/कोसा",
            "झाड़ू",
            "रेशम कीटपालन",
            "पेवर ब्लॉक",
            "बायोचार",
            "सौर उद्यम",
          ]}
        />
        <label className="section-total">
          <span>{tr("कुल उद्यम आय ₹")}</span>
          <input
            type="number"
            value={income}
            onChange={(event) => setIncome(Number(event.target.value))}
          />
        </label>
        <TextControl label="FPO/PG बिक्री आय ₹" value="" type="number" />
      </FormGroup>
      <NeedsBlock
        received={["डिज़ाइन प्रशिक्षण", "प्रमाणन", "बाजार जुड़ाव", "कार्यशील पूँजी"]}
        movable={["औज़ार-मशीनरी", "कच्चा माल", "पैकेजिंग"]}
        fixed={["वर्कशेड/CFC/भट्ठी", "ई-कॉमर्स/GI सुविधा"]}
      />
    </div>
  )
}
