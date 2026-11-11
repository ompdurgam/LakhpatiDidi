import { ChipField, ChipGroup } from "@/components/ui/ChipGroup"
import { Icon } from "@/components/ui/Icon"
import { TextControl } from "@/components/ui/TextControl"
import { useTr } from "@/i18n/tr"

export function IncomeMismatch({ income, baseline }: { income: number; baseline: number }) {
  const tr = useTr()
  if (income === baseline) return null
  return (
    <div className="income-mismatch">
      <Icon name="alert" size={15} />
      <div>
        <strong>{tr("खंड B की आय से मिलान करें")}</strong>
        <span>
          {tr("यहाँ ₹{{here}} • खंड B में ₹{{baseline}}", {
            here: income.toLocaleString("en-IN"),
            baseline: baseline.toLocaleString("en-IN"),
          })}
        </span>
      </div>
    </div>
  )
}

export function NeedsBlock({
  received,
  movable,
  fixed,
}: {
  received: string[]
  movable: string[]
  fixed: string[]
}) {
  const tr = useTr()
  return (
    <section className="needs-block">
      <div className="needs-heading">
        <span>
          <Icon name="scheme" size={17} />
        </span>
        <div>
          <h4>{tr("आवश्यकता")}</h4>
          <p>{tr("बाजार, सहायता, संपत्ति, प्रशिक्षण और ऋण")}</p>
        </div>
      </div>
      <TextControl label="बाजार में बेचे उत्पाद/सेवाएँ" value="" />
      <ChipField label="कहाँ बेचते हैं">
        <ChipGroup
          options={["स्थानीय हाट", "मंडी", "बिचौलिया", "अन्य", "लागू नहीं"]}
          selected={["स्थानीय हाट"]}
        />
      </ChipField>
      <ChipField label="शासकीय सहायता प्राप्त हुई (एक से अधिक)">
        <ChipGroup options={received} selected={received.slice(0, 1)} />
      </ChipField>
      <ChipField label="चल संपत्ति हेतु सहायता चाहिए">
        <ChipGroup options={movable} selected={movable.slice(0, 2)} />
      </ChipField>
      <ChipField label="अचल संपत्ति हेतु सहायता चाहिए">
        <ChipGroup options={fixed} selected={fixed.slice(0, 1)} />
      </ChipField>
      <div className="needs-binary">
        <ChipField label="कौशल प्रशिक्षण चाहिए?">
          <ChipGroup options={["हाँ", "नहीं"]} selected={["हाँ"]} single />
        </ChipField>
        <ChipField label="ऋण चाहिए?">
          <ChipGroup options={["हाँ", "नहीं"]} selected={["हाँ"]} single />
        </ChipField>
      </div>
    </section>
  )
}
