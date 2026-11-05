import type { ApplicationRow, User } from "@/api/types"
import { Legend } from "@/components/charts/Legend"
import { Icon } from "@/components/ui/Icon"
import { Kpi } from "@/components/ui/Kpi"
import { ApplicationTable } from "@/features/applications/ApplicationTable"

import { BlockOverviewLower } from "./BlockOverviewLower"
import { OverviewStat } from "./widgets/OverviewStat"

export type BlockSection = "households" | "applications" | "blcc" | "reports"

/** Block overview (ported 1:1 from the Figma prototype). */
export function BlockDashboard({
  english,
  user,
  rows,
  onSelect,
  onNotify: notify,
  go,
  openDepartments,
}: {
  english: boolean
  user: User
  rows: ApplicationRow[]
  onSelect: (item: ApplicationRow) => void
  onNotify: (message: string) => void
  go: (section: BlockSection) => void
  openDepartments: () => void
}) {
  const filtered = rows
  const setSelected = onSelect
  return (
    <div className="page">
      <section className="welcome">
        <div>
          <h2>
            {english ? "Namaste" : "नमस्ते"}, {user.name.split(" ")[0]} {english ? "ji" : "जी"}{" "}
            <span>—</span>
          </h2>
          <p>
            {english
              ? "Here is the progress of Jagdalpur Block as of today."
              : "आज तक जगदलपुर ब्लॉक की प्रगति यहाँ है।"}
          </p>
        </div>
        <div className="welcome-actions">
          <button className="secondary" onClick={() => notify("रिपोर्ट डाउनलोड के लिए तैयार है")}>
            <Icon name="download" size={17} /> रिपोर्ट डाउनलोड
          </button>
          <button className="primary" onClick={() => go("blcc")}>
            <Icon name="plus" size={17} /> BLCC बैठक मोड
          </button>
        </div>
      </section>
      <section className="kpi-grid">
        <Kpi
          icon="people"
          color="green"
          label="सर्वेक्षित परिवार"
          value="8,426"
          meta="12,000 लक्ष्य का 70.2%"
          progress={70}
        />
        <Kpi
          icon="trend"
          color="saffron"
          label="पहचानी गई PLD"
          value="3,218"
          meta="इस माह +284"
          trend
        />
        <Kpi
          icon="file"
          color="blue"
          label="DPR विभाग को भेजे"
          value="1,847"
          meta="57.4% PLD कवरेज"
        />
        <Kpi
          icon="check"
          color="emerald"
          label="लखपति दीदी"
          value="936"
          meta="1,400 लक्ष्य का 66.9%"
          progress={67}
        />
      </section>
      <section className="overview-secondary-kpis">
        <OverviewStat
          icon="alert"
          tone="red"
          label="हकदारी गैप"
          value="1,240 खुले"
          meta="2,860 बंद"
        />
        <OverviewStat
          icon="check"
          tone="green"
          label="वितरित"
          value="1,210"
          meta="87% स्वीकृत आवेदन"
        />
        <OverviewStat
          icon="trend"
          tone="blue"
          label="मासिक आय अपडेट"
          value="64%"
          meta="नवंबर 2026"
          progress={64}
        />
      </section>
      <section className="content-grid">
        <div className="card progress-card">
          <div className="card-head">
            <div>
              <h3>लखपति यात्रा</h3>
              <p>सर्वे से आय उपलब्धि तक परिवारों की स्थिति</p>
            </div>
            <button className="text-button">
              विस्तृत देखें <Icon name="arrow" size={16} />
            </button>
          </div>
          <div className="funnel">
            {[
              ["सर्वे पूरा", "8,426", 100, "green"],
              ["PLD चिन्हित", "3,218", 82, "sage"],
              ["योजना सहमति", "2,644", 68, "saffron"],
              ["DPR भेजा", "1,847", 53, "blue"],
              ["स्वीकृत", "1,392", 41, "emerald"],
              ["आय सक्रिय", "1,147", 33, "teal"],
              ["लखपति", "936", 26, "deep"],
            ].map(([label, value, width, color]) => (
              <div className="funnel-row" key={label}>
                <span>{label}</span>
                <div className="funnel-track">
                  <i className={String(color)} style={{ width: `${width}%` }}>
                    <b>{value}</b>
                  </i>
                </div>
              </div>
            ))}
          </div>
          <div className="funnel-note">
            <Icon name="trend" size={19} />
            <div>
              <strong>29.1% PLD परिवार लखपति बने</strong>
              <span>पिछले माह से 3.4% बेहतर</span>
            </div>
          </div>
        </div>
        <div className="card income-card">
          <div className="card-head">
            <div>
              <h3>आय स्थिति</h3>
              <p>PLD परिवारों का वार्षिक आय स्तर</p>
            </div>
            <button className="filter-button">
              सभी CLF <Icon name="chevron" size={14} />
            </button>
          </div>
          <div className="donut-wrap">
            <div className="donut">
              <div>
                <strong>3,218</strong>
                <span>कुल PLD</span>
              </div>
            </div>
            <div className="legend">
              <Legend color="#287349" value="936" label="लखपति (₹1 लाख+)" />
              <Legend color="#e6a51c" value="614" label="थ्रेशोल्ड (₹80K+)" />
              <Legend color="#7da6a0" value="1,668" label="प्रगति पर" />
            </div>
          </div>
          <div className="alert-strip">
            <Icon name="alert" size={19} />
            <div>
              <strong>428 सिंगल-स्ट्रीम PLD</strong>
              <span>आय का दूसरा स्रोत जोड़ना जरूरी है</span>
            </div>
            <button onClick={() => go("households")}>देखें</button>
          </div>
        </div>
      </section>
      <section className="card applications-card">
        <div className="card-head">
          <div>
            <h3>हाल के आवेदन</h3>
            <p>विभागीय कार्यवाही के लिए भेजे गए DPR</p>
          </div>
          <div className="table-actions">
            <button className="filter-button">
              <Icon name="filter" size={15} /> फ़िल्टर
            </button>
            <button className="text-button" onClick={() => go("applications")}>
              सभी आवेदन <Icon name="arrow" size={16} />
            </button>
          </div>
        </div>
        <ApplicationTable rows={filtered} onSelect={setSelected} />
      </section>
      <BlockOverviewLower onNotify={notify} go={go} openDepartments={openDepartments} />
    </div>
  )
}
