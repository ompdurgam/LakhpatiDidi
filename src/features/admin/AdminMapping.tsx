import { useResource } from "@/api/hooks"
import { useTr } from "@/i18n/tr"

type Mapping = {
  id: number
  block: string
  department: string
  scheme: string | null
  officer: string
  backup: string | null
  active: boolean
}

/** Officer routing per block × department × scheme (master_officer_mappings). */
export function AdminMapping() {
  const tr = useTr()
  const { data, loading, error } = useResource<Mapping[]>("/officer-mappings")
  return (
    <section className="card admin-data-table">
      <div className="card-head">
        <div>
          <h3>{tr("विभाग एवं अधिकारी मैपिंग")}</h3>
          <p>{tr("ब्लॉक × विभाग × योजना के अनुसार रूटिंग")}</p>
        </div>
      </div>
      {loading ? (
        <p className="empty-note">{tr("लोड हो रहा है…")}</p>
      ) : error ? (
        <p className="empty-note">{error}</p>
      ) : data?.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{tr("ब्लॉक")}</th>
                <th>{tr("विभाग")}</th>
                <th>{tr("योजना")}</th>
                <th>{tr("अधिकारी")}</th>
                <th>{tr("बैकअप अधिकारी")}</th>
                <th>{tr("स्थिति")}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id}>
                  <td>{row.block}</td>
                  <td>{row.department}</td>
                  <td>{row.scheme ?? tr("सभी योजनाएँ")}</td>
                  <td>{row.officer}</td>
                  <td>{row.backup ?? "—"}</td>
                  <td>
                    <span className={`status ${row.active ? "green" : "amber"}`}>
                      {row.active ? tr("सक्रिय") : tr("निष्क्रिय")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty-note">
          {tr("अभी कोई अधिकारी मैपिंग नहीं — आवेदन किसी अधिकारी को स्वतः नहीं जाएँगे")}
        </p>
      )}
    </section>
  )
}
