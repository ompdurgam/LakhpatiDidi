import type { ApplicationRow } from "@/api/types"
import { Icon } from "@/components/ui/Icon"
import { statusClass } from "@/components/ui/statusClass"

export function ApplicationTable({
  rows,
  onSelect,
}: {
  rows: ApplicationRow[]
  onSelect: (item: ApplicationRow) => void
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>आवेदन ID</th>
            <th>दीदी / गाँव</th>
            <th>योजना</th>
            <th>विभाग</th>
            <th>राशि</th>
            <th>लंबित</th>
            <th>स्थिति</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.id} onClick={() => onSelect(item)}>
              <td>
                <b className="app-id">{item.id}</b>
              </td>
              <td>
                <div className="person">
                  <span>{item.initials}</span>
                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.village}</small>
                  </div>
                </div>
              </td>
              <td>{item.scheme}</td>
              <td>{item.dept}</td>
              <td>
                <strong>{item.amount}</strong>
              </td>
              <td>
                <span className={item.days > 15 ? "days overdue" : "days"}>{item.days} दिन</span>
              </td>
              <td>
                <span className={`status ${statusClass[item.status]}`}>{item.status}</span>
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
      {rows.length === 0 && <div className="empty">कोई मिलान रिकॉर्ड नहीं मिला</div>}
    </div>
  )
}
