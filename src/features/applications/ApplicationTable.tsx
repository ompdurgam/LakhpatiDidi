import type { ApplicationRow } from "@/api/types"
import { Icon } from "@/components/ui/Icon"
import { statusClass } from "@/components/ui/statusClass"
import { useTr } from "@/i18n/tr"

export function ApplicationTable({
  rows,
  onSelect,
}: {
  rows: ApplicationRow[]
  onSelect: (item: ApplicationRow) => void
}) {
  const tr = useTr()
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>{tr("आवेदन ID")}</th>
            <th>{tr("दीदी / गाँव")}</th>
            <th>{tr("योजना")}</th>
            <th>{tr("विभाग")}</th>
            <th>{tr("राशि")}</th>
            <th>{tr("लंबित")}</th>
            <th>{tr("स्थिति")}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.id} onClick={() => onSelect(item)}>
              <td>
                <b className="app-id">{tr(item.id)}</b>
              </td>
              <td>
                <div className="person">
                  <span>{tr(item.initials)}</span>
                  <div>
                    <strong>{tr(item.name)}</strong>
                    <small>{tr(item.village)}</small>
                  </div>
                </div>
              </td>
              <td>{tr(item.scheme)}</td>
              <td>{tr(item.dept)}</td>
              <td>
                <strong>{tr(item.amount)}</strong>
              </td>
              <td>
                <span className={item.days > 15 ? "days overdue" : "days"}>
                  {item.days} {tr("दिन")}
                </span>
              </td>
              <td>
                <span className={`status ${statusClass[item.status]}`}>{tr(item.status)}</span>
              </td>
              <td>
                <button className="row-arrow">
                  <Icon name="chevron" size={17} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <div className="empty">{tr("कोई मिलान रिकॉर्ड नहीं मिला")}</div>}
    </div>
  )
}
