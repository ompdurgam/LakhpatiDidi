import { Link } from "react-router"

import { Card } from "@/components/ui/Card"
import { EmptyState } from "@/components/ui/EmptyState"
import { Icon } from "@/components/ui/Icon"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { useTr } from "@/i18n/tr"

import { LakhpatiMeter } from "./LakhpatiMeter"
import { TasksCard } from "./TasksCard"
import { useDidi } from "./useDidi"

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`

/** A Didi's own profile: who she is, her income meter, income sources and open scheme gaps. */
export function DidiProfile() {
  const tr = useTr()
  const { data, isLoading, error } = useDidi()
  if (error) return <EmptyState>{(error as Error).message}</EmptyState>
  if (isLoading || !data) return <EmptyState>{tr("लोड हो रहा है…")}</EmptyState>
  const { profile: p, meter, incomeSources, gaps, applications, tasks } = data
  const facts: [string, string | null][] = [
    ["पिता / पति", p.guardian],
    ["आयु", p.age === null ? null : String(p.age)],
    ["मोबाइल", p.mobile],
    ["सामाजिक वर्ग", p.category],
    ["विशेष समुदाय", p.special],
    ["SHG", p.shg],
    ["VO", p.vo],
    ["CLF", p.clf],
  ]
  return (
    <div className="page didi-page">
      <div className="didi-hero">
        <span className="didi-avatar" aria-hidden="true">
          {p.initials}
        </span>
        <div>
          <span className="eyebrow">{tr("मेरी प्रोफ़ाइल")}</span>
          <h2>{p.name}</h2>
          <p>
            {p.code} • {[p.village, p.panchayat, p.block, p.district].join(" › ")}
          </p>
        </div>
        {p.pld && <span className="status green">{tr("संभावित लखपति दीदी (PLD)")}</span>}
      </div>

      <TasksCard tasks={tasks} />

      <div className="didi-grid">
        <LakhpatiMeter meter={meter} />

        <Card title={tr("मेरी जानकारी")}>
          <dl className="didi-facts">
            {facts
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label}>
                  <dt>{tr(label)}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
          </dl>
        </Card>

        <Card
          title={tr("आय के स्रोत")}
          subtitle={tr("{{n}} सक्रिय स्रोत", { n: meter.activeSources })}
        >
          {incomeSources.length ? (
            <ul className="didi-sources">
              {incomeSources.map((s) => (
                <li key={s.name}>
                  <div>
                    <strong>{tr(s.name)}</strong>
                    <small>{tr("{{n}} महीने", { n: s.months.length })}</small>
                  </div>
                  <b>{rupees(s.net)}</b>
                </li>
              ))}
            </ul>
          ) : (
            <p className="didi-empty">{tr("अभी कोई आय स्रोत दर्ज नहीं है।")}</p>
          )}
        </Card>

        <Card title={tr("योजनाएँ जिनका लाभ मिल सकता है")} subtitle={tr("सर्वे में पात्र पाई गईं")}>
          {gaps.length ? (
            <ul className="didi-gaps">
              {gaps.map((g) => (
                <li key={g.code}>
                  <Icon name="scheme" size={16} />
                  <div>
                    <strong>{g.name}</strong>
                    <small>{g.department}</small>
                  </div>
                  <StatusBadge
                    label={g.open ? tr("लाभ बाकी") : tr("लाभ मिला")}
                    tone={g.open ? "amber" : "green"}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="didi-empty">{tr("अभी कोई लंबित योजना नहीं है।")}</p>
          )}
        </Card>
      </div>

      <Link className="didi-apps-link" to="/didi/applications">
        <Icon name="file" size={18} />
        <span>
          {tr("मेरे आवेदन")} <b>{applications.length}</b>
        </span>
        <Icon name="chevron" size={16} />
      </Link>
    </div>
  )
}
