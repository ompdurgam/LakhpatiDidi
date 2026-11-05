import { useState } from "react"

import { FormGroup } from "@/components/ui/FormGroup"
import { SelectControl } from "@/components/ui/Select"
import { TextControl } from "@/components/ui/TextControl"
import { IncomeMismatch, NeedsBlock } from "@/features/survey/sections/livelihood/shared"

export function FisheriesSection({ baseline }: { baseline: number }) {
  const [income, setIncome] = useState(15000)
  return (
    <div className="section-form livelihood-form">
      <IncomeMismatch income={income} baseline={baseline} />
      <FormGroup title="मत्स्य गतिविधि">
        <div className="control-grid">
          <TextControl label="तालाब क्षेत्रफल (एकड़)" value="0.5" type="number" />
          <SelectControl
            label="स्वामित्व"
            value="स्वयं"
            options={["स्वयं", "पंचायत पट्टा", "लीज्ड", "अन्य"]}
          />
          <label className="text-control">
            <span>वार्षिक आय ₹</span>
            <input
              type="number"
              value={income}
              onChange={(event) => setIncome(Number(event.target.value))}
            />
          </label>
        </div>
      </FormGroup>
      <NeedsBlock
        received={["फिंगरलिंग", "मछली आहार", "जल परीक्षण किट", "तकनीकी मार्गदर्शन"]}
        movable={["जाल", "नाव", "फिंगरलिंग", "मछली आहार", "आइस बॉक्स", "एरेटर", "जल परीक्षण किट"]}
        fixed={["सुखाने का यार्ड", "कोल्ड स्टोरेज", "तालाब खुदाई"]}
      />
    </div>
  )
}
