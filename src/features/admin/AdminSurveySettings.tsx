import { api } from "@/api/client"
import { useResource } from "@/api/hooks"
import { Icon } from "@/components/ui/Icon"

export function AdminSurveySettings({ onNotify }: { onNotify: (message: string) => void }) {
  const { data: sections, setData: setSections } =
    useResource<{ code: string; name: string; enabled: boolean }[]>("/survey-sections")
  const enabled = (sections ?? []).filter((s) => s.enabled).map((s) => s.code)
  const toggle = async (code: string) => {
    if (!sections) return
    const next = !enabled.includes(code)
    // Optimistic toggle, rolled back if the server refuses.
    setSections(sections.map((s) => (s.code === code ? { ...s, enabled: next } : s)))
    try {
      const { message } = await api<{ message: string }>(`/survey-sections/${code}`, {
        method: "PATCH",
        body: { enabled: next },
      })
      onNotify(message)
    } catch (e) {
      setSections(sections)
      onNotify((e as Error).message)
    }
  }
  return (
    <div className="survey-settings-admin">
      <section className="card section-toggles">
        <div className="card-head">
          <div>
            <h3>सर्वे सेक्शन</h3>
            <p>A–K सेक्शन चालू / बंद करें</p>
          </div>
        </div>
        <div>
          {[
            "A पहचान",
            "B आय",
            "C ऋण",
            "D योजनाएँ",
            "E कृषि",
            "F पशुधन",
            "G मत्स्य",
            "H वन उपज",
            "I गैर-कृषि",
            "J पर्यटन",
            "K मजदूरी",
          ].map((item) => {
            const code = item[0]
            return (
              <label key={item}>
                <span>{item}</span>
                <button className={enabled.includes(code) ? "on" : ""} onClick={() => toggle(code)}>
                  <i />
                </button>
              </label>
            )
          })}
        </div>
      </section>
      <section className="card option-list-editor">
        <div className="card-head">
          <div>
            <h3>विकल्प सूची संपादक</h3>
            <p>फॉर्म चिप और ड्रॉपडाउन विकल्प</p>
          </div>
          <button className="primary">
            <Icon name="plus" size={14} /> सूची जोड़ें
          </button>
        </div>
        {[
          ["सामाजिक वर्ग", "सामान्य • ST • SC • OBC"],
          ["भूमि स्थिति", "भूमिहीन • स्वामित्व • पट्टा • बटाई • FRA"],
          ["जलवायु जोखिम", "सूखा • बाढ़ • गर्मी • कीट • असमय वर्षा"],
        ].map(([name, options]) => (
          <div key={name}>
            <strong>{name}</strong>
            <span>{options}</span>
            <button>
              <Icon name="settings" size={14} />
            </button>
          </div>
        ))}
      </section>
      <section className="card conditional-logic">
        <div className="card-head">
          <div>
            <h3>सशर्त लॉजिक</h3>
            <p>उत्तर के अनुसार सेक्शन और फ़ील्ड</p>
          </div>
        </div>
        {[
          ["livelihood includes Fisheries", "G मत्स्य सेक्शन दिखाएँ"],
          ["land_status = Landless", "भूमि एकड़ फ़ील्ड छिपाएँ"],
          ["tourism.engaged = Yes", "पर्यटन गतिविधि और आय दिखाएँ"],
          ["loan.moneylender_rate > 24", "उच्च-ब्याज जोखिम दिखाएँ"],
        ].map(([condition, action]) => (
          <div key={condition}>
            <code>{condition}</code>
            <Icon name="arrow" size={14} />
            <span>{action}</span>
            <button onClick={() => onNotify("सशर्त लॉजिक संपादक खोला गया")}>संपादित करें</button>
          </div>
        ))}
      </section>
    </div>
  )
}
