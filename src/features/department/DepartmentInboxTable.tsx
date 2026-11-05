import type { ApplicationRow } from "@/api/types"
import { statusClass } from "@/components/ui/statusClass"

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
  return (
    <div className="table-scroll department-inbox-table">
      <table>
        <thead>
          <tr>
            <th></th>
            <th>App ID</th>
            <th>दीदी / गाँव</th>
            <th>योजना</th>
            <th>परियोजना लागत</th>
            <th>अनुदान ₹</th>
            <th>प्राप्ति तिथि</th>
            <th>लंबित</th>
            <th>स्थिति</th>
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
                <b className="app-id">{item.id}</b>
              </td>
              <td>
                <div className="person">
                  <span>{item.initials}</span>
                  <div>
                    <strong>{item.name}</strong>
                    <small>
                      {item.village} • {item.block}
                    </small>
                  </div>
                </div>
              </td>
              <td>{item.scheme}</td>
              <td>
                <strong>{item.amount}</strong>
              </td>
              <td>
                <strong>{item.subsidy}</strong>
              </td>
              <td>{item.received}</td>
              <td>
                <span className={item.days > 15 ? "days overdue" : "days"}>{item.days} दिन</span>
              </td>
              <td>
                <span className={`status ${statusClass[item.status] || "blue"}`}>
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <div className="empty">इस विभाग और फ़िल्टर में कोई आवेदन नहीं मिला</div>}
    </div>
  )
}
