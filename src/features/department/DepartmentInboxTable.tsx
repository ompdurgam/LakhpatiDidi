import type { ApplicationRow } from "@/api/types"
import { statusClass } from "@/components/ui/statusClass"
import { useTr } from "@/i18n/tr"

export type DepartmentInboxRecord = ApplicationRow

export function DepartmentInboxTable({
  rows,
  selected,
  onToggle,
  onSelect,
}: {
  rows: DepartmentInboxRecord[]
  selected: string[]
  onToggle: (id: string) => void
  onSelect: (item: ApplicationRow) => void
}) {
  const tr = useTr()
  return (
    <div className="table-scroll department-inbox-table">
      <table>
        <thead>
          <tr>
            <th></th>
            <th>App ID</th>
            <th>{tr("दीदी / गाँव")}</th>
            <th>{tr("योजना")}</th>
            <th>{tr("परियोजना लागत")}</th>
            <th>{tr("अनुदान ₹")}</th>
            <th>{tr("प्राप्ति तिथि")}</th>
            <th>{tr("लंबित")}</th>
            <th>{tr("स्थिति")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.id} onClick={() => onSelect(item)}>
              <td onClick={(event) => event.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selected.includes(item.id)}
                  onChange={() => onToggle(item.id)}
                />
              </td>
              <td>
                <b className="app-id">{tr(item.id)}</b>
              </td>
              <td>
                <div className="person">
                  <span>{tr(item.initials)}</span>
                  <div>
                    <strong>{tr(item.name)}</strong>
                    <small>
                      {tr(item.village)} • {tr(item.block)}
                    </small>
                  </div>
                </div>
              </td>
              <td>{tr(item.scheme)}</td>
              <td>
                <strong>{tr(item.amount)}</strong>
              </td>
              <td>
                <strong>{tr(item.subsidy)}</strong>
              </td>
              <td>{tr(item.received)}</td>
              <td>
                <span className={item.days > 15 ? "days overdue" : "days"}>
                  {item.days} {tr("दिन")}
                </span>
              </td>
              <td>
                <span className={`status ${statusClass[item.status] || "blue"}`}>
                  {tr(item.status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && (
        <div className="empty">{tr("इस विभाग और फ़िल्टर में कोई आवेदन नहीं मिला")}</div>
      )}
    </div>
  )
}
