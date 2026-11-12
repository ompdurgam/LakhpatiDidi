import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router"

import { api } from "@/api/client"
import { LIVE_MS } from "@/api/hooks"
import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

type Didi = { code: string; name: string }
type MyDayData = {
  toSurvey: number
  surveyedToday: number
  surveyedThisWeek: number
  incomeDue: { total: number; items: (Didi & { village: string })[] }
  infoRequested: (Didi & {
    application: string
    scheme: string
    schemeName: string
    department: string
    comment: string | null
  })[]
  dprs: { total: number; items: (Didi & { scheme: string; schemeName: string; ready: boolean })[] }
}

/** The CRP's to-do list for today, from her own areas. */
export function MyDay() {
  const tr = useTr()
  const navigate = useNavigate()
  const { data } = useQuery({
    queryKey: ["survey", "my-day"],
    queryFn: () => api<MyDayData>("/surveys/my-day"),
    refetchInterval: LIVE_MS,
    refetchOnWindowFocus: true,
  })
  if (!data?.incomeDue) return null
  const nothing = !data.incomeDue.total && !data.infoRequested.length && !data.dprs.total
  return (
    <section className="my-day">
      <div className="my-day-head">
        <h3>{tr("मेरा आज का काम")}</h3>
        <span>
          {tr("आज {{t}} • इस सप्ताह {{w}} सर्वे", {
            t: data.surveyedToday,
            w: data.surveyedThisWeek,
          })}
        </span>
      </div>
      {data.infoRequested.length > 0 && (
        <Group
          tone="red"
          icon="alert"
          title={tr("विभाग ने जानकारी माँगी • {{n}}", { n: data.infoRequested.length })}
        >
          {data.infoRequested.map((r) => (
            <Row
              key={r.application}
              title={`${r.name} • ${r.schemeName}`}
              sub={`${r.application} • ${r.department}${r.comment ? ` — “${r.comment}”` : ""}`}
              onClick={() => navigate(`/field/dpr/${r.code}/${r.scheme}`)}
            />
          ))}
        </Group>
      )}
      {data.dprs.total > 0 && (
        <Group tone="blue" icon="file" title={tr("अधूरे DPR • {{n}}", { n: data.dprs.total })}>
          {data.dprs.items.map((r) => (
            <Row
              key={`${r.code}-${r.scheme}`}
              title={`${r.name} • ${r.schemeName}`}
              sub={r.ready ? tr("भरा हुआ — विभाग को भेजें") : tr("ड्राफ्ट — पूरा करें")}
              onClick={() => navigate(`/field/dpr/${r.code}/${r.scheme}`)}
            />
          ))}
        </Group>
      )}
      {data.incomeDue.total > 0 && (
        <Group
          tone="amber"
          icon="trend"
          title={tr("इस माह की आय दर्ज करनी है • {{n}}", { n: data.incomeDue.total })}
        >
          {data.incomeDue.items.map((r) => (
            <Row
              key={r.code}
              title={r.name}
              sub={`${r.code} • ${r.village}`}
              onClick={() => navigate("/field/income")}
            />
          ))}
        </Group>
      )}
      {nothing && (
        <p className="empty-note">
          {tr("आज कोई लंबित काम नहीं • {{n}} दीदी का सर्वे बाकी", {
            n: data.toSurvey.toLocaleString("en-IN"),
          })}
        </p>
      )}
    </section>
  )
}

function Group({
  tone,
  icon,
  title,
  children,
}: {
  tone: string
  icon: "alert" | "file" | "trend"
  title: string
  children: React.ReactNode
}) {
  return (
    <div className={`my-day-group ${tone}`}>
      <h4>
        <Icon name={icon} size={15} /> {title}
      </h4>
      {children}
    </div>
  )
}

function Row({ title, sub, onClick }: { title: string; sub: string; onClick: () => void }) {
  return (
    <button className="picker-row" onClick={onClick}>
      <div>
        <strong>{title}</strong>
        <span>{sub}</span>
      </div>
      <Icon name="chevron" size={16} />
    </button>
  )
}
