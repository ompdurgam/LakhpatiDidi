import { Icon } from "@/components/ui/Icon"
import { AdminAuditLog } from "@/features/admin/AdminAuditLog"
import { AdminGeography } from "@/features/admin/AdminGeography"
import { AdminMapping } from "@/features/admin/AdminMapping"
import { AdminSurveySettings } from "@/features/admin/AdminSurveySettings"
import { AdminUsers } from "@/features/admin/AdminUsers"
import { useTr } from "@/i18n/tr"

export function AdminModule({
  active,
  onNotify,
}: {
  active: string
  onNotify: (message: string) => void
}) {
  const tr = useTr()
  if (active === "mapping") return <AdminMapping onNotify={onNotify} />
  if (active === "users") return <AdminUsers onNotify={onNotify} />
  if (active === "geography") return <AdminGeography onNotify={onNotify} />
  if (active === "forms") return <AdminSurveySettings onNotify={onNotify} />
  if (active === "audit") return <AdminAuditLog />
  const content: Record<string, [string, string, string[]]> = {
    mapping: [
      "विभाग एवं अधिकारी मैपिंग",
      "ब्लॉक के अनुसार आवेदन प्राप्तकर्ता अधिकारी",
      [
        "जगदलपुर • सहायक संचालक मत्स्य",
        "बकावंड • वरिष्ठ कृषि विस्तार अधिकारी",
        "तोकापाल • पशु चिकित्सा अधिकारी",
      ],
    ],
    users: [
      "यूज़र और भूमिकाएँ",
      "OTP लॉगिन, भूमिका और कार्यक्षेत्र",
      [
        "अनिल कश्यप • Block Manager",
        "गीता नेताम • CRP / Surveyor",
        "आर. सिन्हा • Fisheries Officer",
      ],
    ],
    geography: [
      "भूगोल मास्टर",
      "राज्य → जिला → ब्लॉक → GP → गाँव",
      ["बस्तर • 7 ब्लॉक", "जगदलपुर • 68 ग्राम पंचायत", "बड़ांजी • 12 SHG / 2 VO"],
    ],
    forms: [
      "सर्वे फॉर्म सेटिंग",
      "सेक्शन सक्षम करें और विकल्प सूची बदलें",
      ["A. पहचान और परिवार", "D. योजना संतृप्ति • 41 योजनाएँ", "E–K. सशर्त आजीविका सेक्शन"],
    ],
    village: [
      "ग्राम प्रोफाइल",
      "D3 सुविधाएँ और D4 आजीविका संरचना",
      ["29 सामुदायिक सुविधाएँ", "35 आजीविका अवसंरचना मद", "तालाब, वन क्षेत्र और CFR संसाधन"],
    ],
  }
  const [title, subtitle, items] = content[active]
  return (
    <section className="card admin-module">
      <div className="card-head">
        <div>
          <h3>{tr(title)}</h3>
          <p>{tr(subtitle)}</p>
        </div>
        <button className="primary" onClick={() => onNotify(tr("नया रिकॉर्ड जोड़ा गया"))}>
          <Icon name="plus" size={15} /> {tr("नया जोड़ें")}
        </button>
      </div>
      {items.map((item, index) => (
        <div className="admin-module-row" key={item}>
          <span className="generic-icon">
            <Icon
              name={active === "users" ? "people" : active === "geography" ? "map" : "settings"}
              size={18}
            />
          </span>
          <div>
            <strong>{tr(item)}</strong>
            <small>{tr("सक्रिय • आज अपडेट")}</small>
          </div>
          {active === "village" && (
            <div className="availability">
              <span>{tr("उपलब्ध")}</span>
              <b>{18 + index * 5}</b>
              <span>{tr("कार्यशील")}</span>
              <b>{14 + index * 4}</b>
            </div>
          )}
          <span className="status green">{tr("सक्रिय")}</span>
          <Icon name="chevron" size={16} />
        </div>
      ))}
    </section>
  )
}
