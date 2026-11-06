import { useState } from "react"

import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

export function BlockReports({ onNotify }: { onNotify: (message: string) => void }) {
  const tr = useTr()
  const [status, setStatus] = useState<"ड्राफ्ट" | "जमा">("ड्राफ्ट")
  return (
    <div className="block-reports">
      <section className="card monthly-report-builder">
        <div className="report-builder-head">
          <div>
            <span className="eyebrow">{tr("नवंबर 2026")}</span>
            <h3>{tr("DMMU मासिक रिपोर्ट")}</h3>
            <p>{tr("जमा करने की अंतिम तिथि: 10 दिसंबर 2026")}</p>
          </div>
          <span className={`status ${status === "जमा" ? "green" : "amber"}`}>{tr(status)}</span>
        </div>
        <div className="auto-report-sections">
          {[
            ["कवरेज", "8,426 परिवार • 70.2%"],
            ["फनल", "1,847 DPR • 1,392 स्वीकृत"],
            ["आय बैंड", "936 लखपति • 614 थ्रेशोल्ड"],
            ["BLCC स्थिति", "18 खुली • 7 निर्णय लंबित"],
            ["एस्केलेशन", "6 अतिदेय • 2 कलेक्टर स्तर"],
          ].map(([title, summary]) => (
            <div key={title}>
              <span>
                <Icon name="check" size={14} />
              </span>
              <div>
                <strong>{tr(title)}</strong>
                <small>{tr(summary)}</small>
              </div>
              <em>{tr("स्वतः भरा")}</em>
              <button>
                <Icon name="chevron" size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="report-submit-row">
          <label>
            <input type="checkbox" defaultChecked /> {tr("डेटा और संलग्नक सत्यापित हैं")}
          </label>
          <button
            className="primary"
            disabled={status === "जमा"}
            onClick={() => {
              setStatus("जमा")
              onNotify(tr("नवंबर DMMU मासिक रिपोर्ट जमा हुई"))
            }}
          >
            <Icon name="check" size={15} />
            {status === "जमा" ? tr("जमा हो चुकी") : tr("जमा करें")}
          </button>
        </div>
      </section>
      <section className="report-downloads">
        <h3>{tr("डाउनलोड और कार्यपत्रक")}</h3>
        <div>
          {[
            ["VPRP मांग तालिका", "XLSX", "क्लस्टर और परिवार मांग"],
            ["BLCC कार्यवाही रजिस्टर", "PDF", "निर्णय और लक्ष्य तिथियाँ"],
            ["PLD आय ट्रैकिंग शीट", "XLSX", "मासिक आय स्रोत"],
            ["हकदारी गैप सूची", "XLSX", "खुले और बंद गैप"],
          ].map(([title, type, meta]) => (
            <article className="card" key={title}>
              <span>
                <Icon name="file" size={20} />
              </span>
              <div>
                <strong>{tr(title)}</strong>
                <small>
                  {tr(meta)} {tr("• नवंबर 2026")}
                </small>
              </div>
              <em>{tr(type)}</em>
              <button
                onClick={() => onNotify(tr("{{title}} डाउनलोड तैयार है", { title: tr(title) }))}
              >
                <Icon name="download" size={15} />
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
