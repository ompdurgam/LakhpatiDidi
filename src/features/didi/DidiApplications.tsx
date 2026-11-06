import type { ApplicationRow } from "@/api/types"
import { Card } from "@/components/ui/Card"
import { EmptyState } from "@/components/ui/EmptyState"
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge"
import { type Column, Table } from "@/components/ui/Table"
import { useTr } from "@/i18n/tr"

import { useDidi } from "./useDidi"

const tone: Record<string, StatusTone> = {
  submitted: "blue",
  under_review: "blue",
  info_requested: "amber",
  sanctioned: "green",
  delivered: "green",
  rejected: "red",
}

/** The Didi's own scheme applications and where each one stands. */
export function DidiApplications() {
  const tr = useTr()
  const { data, isLoading, error } = useDidi()
  if (error) return <EmptyState>{(error as Error).message}</EmptyState>
  if (isLoading || !data) return <EmptyState>{tr("लोड हो रहा है…")}</EmptyState>

  const columns: Column<ApplicationRow>[] = [
    { key: "id", header: tr("आवेदन ID"), render: (r) => <b className="app-id">{r.id}</b> },
    { key: "scheme", header: tr("योजना"), render: (r) => r.scheme },
    { key: "dept", header: tr("विभाग"), render: (r) => r.dept },
    { key: "amount", header: tr("परियोजना लागत"), render: (r) => <strong>{r.amount}</strong> },
    { key: "subsidy", header: tr("अनुदान"), render: (r) => r.subsidy },
    { key: "received", header: tr("प्राप्ति तिथि"), render: (r) => r.received },
    {
      key: "days",
      header: tr("लंबित"),
      render: (r) => (
        <span className={r.days > 15 ? "days overdue" : "days"}>
          {tr("{{n}} दिन", { n: r.days })}
        </span>
      ),
    },
    {
      key: "status",
      header: tr("स्थिति"),
      render: (r) => (
        <StatusBadge label={r.status} tone={r.overdue ? "red" : (tone[r.statusCode] ?? "blue")} />
      ),
    },
  ]
  return (
    <div className="page didi-page">
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">{data.profile.name}</span>
          <h2>{tr("मेरे आवेदन")}</h2>
          <p>{tr("योजनाओं के लिए भेजे गए आवेदन और उनकी स्थिति")}</p>
        </div>
      </div>
      <Card>
        <Table
          columns={columns}
          rows={data.applications}
          rowKey={(r) => r.id}
          empty={tr("अभी तक कोई आवेदन नहीं भेजा गया है।")}
        />
      </Card>
    </div>
  )
}
