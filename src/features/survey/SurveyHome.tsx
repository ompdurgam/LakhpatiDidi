import { useState } from "react"

import { Icon } from "@/components/ui/Icon"

export function SurveyHome({ setScreen }: { setScreen: (screen: string) => void }) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("सभी")
  const households = [
    {
      name: "सुनीता कश्यप",
      id: "HH-000123",
      status: "ड्राफ्ट",
      income: 78500,
      pld: true,
    },
    {
      name: "मंगली बघेल",
      id: "HH-000119",
      status: "पूर्ण",
      income: 104000,
      pld: true,
    },
    {
      name: "सीता नाग",
      id: "HH-000116",
      status: "सहमति बाकी",
      income: 62000,
      pld: true,
    },
    {
      name: "कमला कश्यप",
      id: "HH-000108",
      status: "DPR भेजा",
      income: 88000,
      pld: true,
    },
  ].filter(
    (item) =>
      (filter === "सभी" || item.status === filter) &&
      `${item.name} ${item.id}`.toLowerCase().includes(query.toLowerCase()),
  )
  return (
    <div className="phone-content survey-home">
      <div className="offline-banner">
        <Icon name="alert" size={15} />
        <span>ऑफलाइन मोड • डेटा फोन में सुरक्षित है</span>
      </div>
      <div className="mobile-greeting">
        <small>नमस्ते, गीता दीदी</small>
        <h3>आज का फील्ड कार्य</h3>
        <p>ग्राम बड़ांजी • 4 SHG निर्धारित</p>
      </div>
      <div className="mobile-stats">
        <div>
          <strong>24</strong>
          <span>निर्धारित</span>
        </div>
        <div>
          <strong>06</strong>
          <span>ड्राफ्ट</span>
        </div>
        <div>
          <strong>14</strong>
          <span>पूर्ण</span>
        </div>
        <div className="warn">
          <strong>04</strong>
          <span>सिंक बाकी</span>
        </div>
      </div>
      <button className="start-survey" onClick={() => setScreen("survey")}>
        <Icon name="plus" /> नया सर्वे शुरू करें
      </button>
      <button className="village-profile-card" onClick={() => setScreen("village")}>
        <span>
          <Icon name="building" size={19} />
        </span>
        <div>
          <strong>ग्राम प्रोफ़ाइल – बड़ांजी</strong>
          <small>अंतिम अपडेट: 12 नवंबर 2026</small>
          <i>
            <b />
          </i>
        </div>
        <em>70% पूर्ण</em>
        <Icon name="chevron" size={16} />
      </button>
      <button className="monthly-income-card">
        <span>
          <Icon name="trend" size={19} />
        </span>
        <div>
          <strong>मासिक आय दर्ज करें</strong>
          <small>12 PLD बाकी • नवंबर 2026</small>
        </div>
        <Icon name="chevron" size={16} />
      </button>
      <div className="mobile-section-title">
        <strong>हाल के परिवार</strong>
        <button>सभी देखें</button>
      </div>
      <label className="household-search">
        <Icon name="search" size={15} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="नाम या Household ID खोजें"
        />
      </label>
      <div className="household-filters">
        {["सभी", "ड्राफ्ट", "पूर्ण", "सहमति बाकी", "DPR भेजा"].map((item) => (
          <button
            key={item}
            className={filter === item ? "active" : ""}
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>
      {households.map((row, index) => (
        <button
          className="household-row"
          key={row.id}
          onClick={() => index === 0 && setScreen("survey")}
        >
          <span className="avatar">
            {row.name
              .split(" ")
              .map((x) => x[0])
              .join("")}
          </span>
          <div className="household-info">
            <strong>
              {row.name} {row.pld && <b>PLD</b>}
            </strong>
            <small>{row.id} • माँ दंतेश्वरी SHG</small>
            <div className="mini-lakhpati">
              <i>
                <b style={{ width: `${Math.min(row.income / 1000, 100)}%` }} />
              </i>
              <span>₹{row.income.toLocaleString("en-IN")}</span>
            </div>
          </div>
          <i
            className={
              row.status === "पूर्ण"
                ? "green"
                : row.status === "सहमति बाकी"
                  ? "amber"
                  : row.status === "DPR भेजा"
                    ? "blue"
                    : "grey"
            }
          >
            {row.status}
          </i>
          <Icon name="chevron" size={16} />
        </button>
      ))}
      {!households.length && <div className="home-empty">इस फ़िल्टर में कोई परिवार नहीं मिला</div>}
      <button className="sync-card">
        <Icon name="trend" />
        <div>
          <strong>अभी सिंक करें</strong>
          <span>अंतिम सिंक: आज, 08:34</span>
        </div>
        <b>4</b>
      </button>
    </div>
  )
}
