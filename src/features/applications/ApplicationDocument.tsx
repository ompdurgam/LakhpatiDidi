import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"

import type { ApplicationDetail } from "@/api/types"
import { useTr } from "@/i18n/tr"

const rupees = (value: number) => `₹${value.toLocaleString("en-IN")}`

/**
 * The formal application document: what is printed or saved as PDF, and what the
 * preview shows. Plain HTML so Hindi text is shaped by the browser.
 */
export function ApplicationDocument({ item }: { item: ApplicationDetail }) {
  const tr = useTr()
  const { i18n } = useTranslation()
  const issued = new Date().toLocaleDateString(i18n.language === "en" ? "en-IN" : "hi-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

  const rows = (pairs: [string, string | null | undefined][]) =>
    pairs
      .filter(([, value]) => value)
      .map(([label, value]) => (
        <tr key={label}>
          <th>{tr(label)}</th>
          <td>{tr(String(value))}</td>
        </tr>
      ))

  return (
    <article className="application-document">
      <header>
        <span>{tr("महिला लखपति कार्यक्रम – CGSRLM")}</span>
        <h1>{tr("योजना आवेदन पत्र")}</h1>
        <p>
          <b>{item.id}</b> • {tr(item.status)}
        </p>
      </header>

      <section>
        <h2>{tr("लाभार्थी विवरण")}</h2>
        <table>
          <tbody>
            {rows([
              ["नाम", item.name],
              ["परिवार कोड", item.hhCode],
              ["ग्राम", item.village],
              ["ब्लॉक", item.block],
            ])}
          </tbody>
        </table>
      </section>

      <section>
        <h2>{tr("योजना विवरण")}</h2>
        <table>
          <tbody>
            {rows([
              ["योजना", item.scheme],
              ["विभाग", item.dept],
              ["परियोजना लागत", item.amount],
              ["अनुदान", item.subsidy],
              ["प्राप्ति तिथि", item.received],
              ["निर्णय की अंतिम तिथि", item.slaDue],
              ["नियुक्त अधिकारी", item.officer],
              ["GPDP संदर्भ", item.gpdpRef],
              ["VPRP संदर्भ", item.vprpRef],
            ])}
          </tbody>
        </table>
      </section>

      <section>
        <h2>{tr("आय पर प्रभाव")}</h2>
        <table>
          <tbody>
            {rows([
              ["वर्तमान वार्षिक आय", rupees(item.currentIncome)],
              ["योजना के बाद अनुमानित आय", rupees(item.projectedIncome)],
              ["अनुमानित अतिरिक्त आय (प्रति वर्ष)", rupees(item.expectedGain)],
            ])}
          </tbody>
        </table>
      </section>

      {(item.sanction || item.delivery || item.rejectionReason) && (
        <section>
          <h2>{tr("निर्णय")}</h2>
          <table>
            <tbody>
              {rows([
                ["स्वीकृति आदेश संख्या", item.sanction?.orderNo],
                ["स्वीकृति तिथि", item.sanction?.date],
                ["स्वीकृत राशि", item.sanction?.amount],
                ["डिलीवरी तिथि", item.delivery?.date],
                ["प्राप्त संपत्ति", item.delivery?.asset],
                ["अस्वीकृति का कारण", item.rejectionReason],
              ])}
            </tbody>
          </table>
        </section>
      )}

      <section>
        <h2>{tr("प्रगति")}</h2>
        <table className="document-steps">
          <tbody>
            {item.timeline.map((step) => (
              <tr key={step.label} className={step.state || "pending"}>
                <th>
                  {step.state === "done" ? "✓" : step.state === "active" ? "●" : "○"}{" "}
                  {tr(step.label)}
                </th>
                <td>{step.date ? tr(step.date) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {item.documents.length > 0 && (
        <section>
          <h2>{tr("संलग्न दस्तावेज़")}</h2>
          <ul className="document-files">
            {item.documents.map((d) => (
              <li key={d.name}>
                {d.verified ? "✓" : "✗"} {tr(d.name)}{" "}
                <small>({d.verified ? tr("सत्यापित") : tr("दस्तावेज़ अनुपलब्ध")})</small>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer>
        <div className="document-signs">
          {["लाभार्थी", "CRP", "CLF", "BMMU"].map((who) => (
            <span key={who}>{tr(who)}</span>
          ))}
        </div>
        <p>
          {tr("जारी तिथि: {{date}} • यह कंप्यूटर द्वारा बनाया गया दस्तावेज़ है", { date: issued })}
        </p>
      </footer>
    </article>
  )
}

/**
 * Mounts the document straight under <body>, hidden on screen. Print CSS hides
 * everything else, so the print dialog (and "Save as PDF") shows only this.
 */
export function PrintableApplication({ item }: { item: ApplicationDetail }) {
  return createPortal(
    <div className="print-root">
      <ApplicationDocument item={item} />
    </div>,
    document.body,
  )
}
