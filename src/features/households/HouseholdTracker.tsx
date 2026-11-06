import { useState } from "react"

import { Icon } from "@/components/ui/Icon"
import { SelectControl } from "@/components/ui/Select"
import { TextControl } from "@/components/ui/TextControl"
import type { HouseholdRecord } from "@/features/households/types"
import { useTr } from "@/i18n/tr"

export function HouseholdTracker({
  desktop = false,
  household,
}: {
  desktop?: boolean
  household?: HouseholdRecord
}) {
  const tr = useTr()
  const [addIncome, setAddIncome] = useState(false)
  const profile =
    household ||
    ({
      id: "HH-BST-JGD-000123",
      name: "सुनीता कश्यप",
      initials: "SK",
      village: "बड़ांजी",
      income: 78500,
      status: "थ्रेशोल्ड",
    } as HouseholdRecord)
  const milestones = [
    ["सर्वे", "2 नव."],
    ["सुझाव", "2 नव."],
    ["सहमति", "3 नव."],
    ["DPR भेजा", "5 नव."],
    ["BLCC", ""],
    ["स्वीकृत", ""],
    ["डिलीवरी", ""],
    ["आय सक्रिय", ""],
    ["लखपति", ""],
  ]
  const months = [
    { month: "जून", crop: 5200, ntfp: 1800, wage: 3200, fish: 0 },
    { month: "जुलाई", crop: 6100, ntfp: 1200, wage: 4100, fish: 0 },
    { month: "अग.", crop: 4800, ntfp: 900, wage: 3800, fish: 0 },
    { month: "सित.", crop: 7200, ntfp: 1400, wage: 4600, fish: 0 },
    { month: "अक्टू.", crop: 8500, ntfp: 2100, wage: 4200, fish: 0 },
    { month: "नव.", crop: 6400, ntfp: 1600, wage: 3800, fish: 2500 },
  ]
  return (
    <div className={desktop ? "tracker-desktop" : "phone-content tracker"}>
      <div className="tracker-profile">
        <div className="avatar large">{tr(profile.initials)}</div>
        <div>
          <h3>{tr(profile.name)}</h3>
          <p>
            {tr(profile.id)} • {tr(profile.village)}
          </p>
        </div>
        <span
          className={`status ${
            profile.income >= 100000 ? "green" : profile.income >= 80000 ? "amber" : "blue"
          }`}
        >
          {profile.income >= 100000
            ? tr("लखपति")
            : profile.income >= 80000
              ? tr("थ्रेशोल्ड")
              : tr(profile.status)}
        </span>
      </div>
      <div className="horizontal-timeline">
        {milestones.map(([label, date], index) => (
          <div key={label} className={index < 4 ? "done" : index === 4 ? "active" : ""}>
            <i>{index < 4 ? "✓" : index + 1}</i>
            <span>{tr(label)}</span>
            {date && <small>{tr(date)}</small>}
          </div>
        ))}
      </div>
      <div className="tracker-grid">
        <div className="card income-streams">
          <h3>{tr("आय स्रोत")}</h3>
          {[
            ["धान खेती", "₹32,000", 32],
            ["NTFP संग्रह", "₹18,500", 19],
            ["मजदूरी", "₹28,000", 28],
            ["मत्स्य (संभावित)", "+ ₹37,500", 38],
          ].map(([x, value, width], index) => (
            <div key={x}>
              <span>{tr(String(x))}</span>
              <i>
                <b className={index === 3 ? "potential" : ""} style={{ width: `${width}%` }} />
              </i>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <div className="card activity-log">
          <h3>{tr("हाल की गतिविधि")}</h3>
          <p>
            <i />
            {tr("DPR मत्स्य विभाग को भेजा")} <span>{tr("5 नव.")}</span>
          </p>
          <p>
            <i />
            {tr("दीदी की सहमति प्राप्त")} <span>{tr("3 नव.")}</span>
          </p>
          <p>
            <i />
            {tr("सर्वे सफलतापूर्वक सिंक")} <span>{tr("2 नव.")}</span>
          </p>
        </div>
      </div>
      <section className="card tracker-applications">
        <div className="tracker-section-head">
          <div>
            <h3>{tr("आवेदन")}</h3>
            <p>{tr("विभाग को भेजे गए DPR")}</p>
          </div>
          <span>{tr("2 आवेदन")}</span>
        </div>
        <div className="tracker-table-scroll">
          <table>
            <thead>
              <tr>
                <th>App ID</th>
                <th>{tr("योजना")}</th>
                <th>{tr("विभाग")}</th>
                <th>{tr("स्थिति")}</th>
                <th>{tr("लंबित")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <b>APP-260142</b>
                </td>
                <td>PMMSY</td>
                <td>{tr("मत्स्य")}</td>
                <td>
                  <span className="status blue">{tr("समीक्षाधीन")}</span>
                </td>
                <td>{tr("2 दिन")}</td>
              </tr>
              <tr>
                <td>
                  <b>APP-260150</b>
                </td>
                <td>{tr("बैकयार्ड पोल्ट्री")}</td>
                <td>{tr("पशुधन")}</td>
                <td>
                  <span className="status blue">{tr("जमा")}</span>
                </td>
                <td>—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section className="card tracker-entitlements">
        <div className="tracker-section-head">
          <div>
            <h3>{tr("हकदारी अंतर")}</h3>
            <p>{tr("लंबित और बंद मांगें")}</p>
          </div>
        </div>
        <div>
          <span className="gap-icon red">
            <Icon name="alert" size={14} />
          </span>
          <p>
            <strong>{tr("आयुष्मान कार्ड")}</strong>
            <small>{tr("स्वास्थ्य विभाग • CSC बड़ांजी")}</small>
          </p>
          <span className="status amber">{tr("मांग दर्ज")}</span>
        </div>
        <div>
          <span className="gap-icon green">
            <Icon name="check" size={14} />
          </span>
          <p>
            <strong>{tr("PMJJBY बीमा")}</strong>
            <small>{tr("संस्थागत वित्त • बैंक सखी")}</small>
          </p>
          <span className="status green">{tr("बंद ✔")}</span>
        </div>
      </section>
      <section className="card monthly-income-register">
        <div className="tracker-section-head">
          <div>
            <h3>{tr("मासिक आय रजिस्टर")}</h3>
            <p>{tr("जून–नवंबर 2026 • स्रोत अनुसार")}</p>
          </div>
          <div className="income-chart-legend">
            <span>
              <i className="crop" />
              {tr("खेती")}
            </span>
            <span>
              <i className="ntfp" />
              NTFP
            </span>
            <span>
              <i className="wage" />
              {tr("मजदूरी")}
            </span>
            <span>
              <i className="fish" />
              {tr("मत्स्य")}
            </span>
          </div>
        </div>
        <div className="stacked-income-chart">
          {months.map((month) => {
            const total = month.crop + month.ntfp + month.wage + month.fish
            return (
              <div key={month.month} className="income-month-bar">
                <div className="bar-value">₹{Math.round(total / 1000)}K</div>
                <div className="stacked-bar">
                  <i className="crop" style={{ height: `${month.crop / 120}%` }} />
                  <i className="ntfp" style={{ height: `${month.ntfp / 120}%` }} />
                  <i className="wage" style={{ height: `${month.wage / 120}%` }} />
                  <i className="fish" style={{ height: `${month.fish / 120}%` }} />
                </div>
                <span>{tr(month.month)}</span>
              </div>
            )
          })}
        </div>
        <div className="income-log-table">
          <div className="head">
            <span>{tr("माह")}</span>
            <span>{tr("स्रोत")}</span>
            <span>{tr("राशि ₹")}</span>
            <span>{tr("रसीद")}</span>
            <span>{tr("CM सत्यापन")}</span>
          </div>
          {[
            ["नवंबर", "धान बिक्री", "6,400"],
            ["नवंबर", "NTFP", "1,600"],
            ["नवंबर", "मजदूरी", "3,800"],
            ["नवंबर", "मत्स्य", "2,500"],
          ].map((row) => (
            <div key={row[1]}>
              <span>{tr(row[0])}</span>
              <span>{tr(row[1])}</span>
              <strong>{tr(row[2])}</strong>
              <button title={tr("रसीद फोटो")}>
                <Icon name="camera" size={14} />
              </button>
              <span className="verified-cm">
                <Icon name="check" size={12} /> {tr("सत्यापित")}
              </span>
            </div>
          ))}
        </div>
        {addIncome && (
          <div className="add-income-inline">
            <SelectControl
              label="स्रोत"
              value="धान खेती"
              options={["धान खेती", "NTFP", "मजदूरी", "मत्स्य"]}
            />
            <TextControl label="राशि ₹" value="0" type="number" />
            <button className="secondary">
              <Icon name="camera" size={14} /> {tr("रसीद")}
            </button>
            <button className="primary" onClick={() => setAddIncome(false)}>
              {tr("सहेजें")}
            </button>
          </div>
        )}
        <button className="add-monthly-income" onClick={() => setAddIncome(!addIncome)}>
          <Icon name={addIncome ? "close" : "plus"} size={15} />
          {addIncome ? tr("रद्द करें") : tr("इस माह की आय दर्ज करें")}
        </button>
      </section>
    </div>
  )
}
