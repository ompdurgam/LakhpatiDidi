import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

export function AdminMapping({ onNotify }: { onNotify: (message: string) => void }) {
  const tr = useTr()
  const rows = [
    ["जगदलपुर", "मत्स्य", "PMMSY", "आर. सिन्हा", "के. नाग"],
    ["जगदलपुर", "पशुपालन", "बैकयार्ड पोल्ट्री", "डॉ. सीमा नेताम", "पी. बघेल"],
    ["बकावंड", "उद्यानिकी", "NHM सूक्ष्म सिंचाई", "अनिता वर्मा", "आर. साहू"],
    ["तोकापाल", "वन", "वन धन / लाख", "के. नाग", "एस. कश्यप"],
    ["दरभा", "उद्योग", "PMEGP", "वी. सिन्हा", "एम. ठाकुर"],
  ]
  return (
    <section className="card admin-data-table">
      <div className="card-head">
        <div>
          <h3>{tr("विभाग एवं अधिकारी मैपिंग")}</h3>
          <p>{tr("ब्लॉक × विभाग × योजना के अनुसार रूटिंग")}</p>
        </div>
        <button className="primary" onClick={() => onNotify(tr("नई अधिकारी मैपिंग जोड़ी गई"))}>
          <Icon name="plus" size={14} /> {tr("नई मैपिंग")}
        </button>
      </div>
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
            {rows.map((row) => (
              <tr key={row.join("-")}>
                {row.map((cell) => (
                  <td key={cell}>{tr(cell)}</td>
                ))}
                <td>
                  <span className="status green">{tr("सक्रिय")}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
