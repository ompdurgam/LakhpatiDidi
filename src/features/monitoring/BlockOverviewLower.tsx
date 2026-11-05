import { Icon } from "@/components/ui/Icon"

import type { BlockSection } from "./BlockDashboard"
import { Task } from "./widgets/Task"

/** Lower half of the block overview: tasks, deadlines and village operations. */
export function BlockOverviewLower({
  onNotify: notify,
  go,
  openDepartments,
}: {
  onNotify: (message: string) => void
  go: (section: BlockSection) => void
  /** Switch to the department role (prototype behaviour). */
  openDepartments: () => void
}) {
  return (
    <>
      <section className="bottom-grid">
        <div className="card coverage-card">
          <div className="card-head">
            <div>
              <h3>CLF-वार सर्वे कवरेज</h3>
              <p>लक्ष्य के विरुद्ध पूर्ण सर्वे</p>
            </div>
            <button className="filter-button">
              कवरेज % <Icon name="chevron" size={14} />
            </button>
          </div>
          {[
            ["माँ दंतेश्वरी CLF", 88, "1,742 / 1,980"],
            ["माँ बमलेश्वरी CLF", 76, "1,421 / 1,870"],
            ["इंद्रावती CLF", 69, "1,307 / 1,895"],
            ["शक्ति महिला CLF", 61, "1,136 / 1,862"],
          ].map(([name, pct, count]) => (
            <div className="coverage-row" key={name}>
              <div>
                <strong>{name}</strong>
                <span>{count}</span>
              </div>
              <div className="progress-line">
                <i style={{ width: `${pct}%` }} />
              </div>
              <b>{pct}%</b>
            </div>
          ))}
        </div>
        <div className="card deadline-card">
          <div className="card-head">
            <div>
              <h3>SLA और जरूरी कार्य</h3>
              <p>समय सीमा के करीब और अतिदेय</p>
            </div>
            <span className="count-badge">12</span>
          </div>
          <Task
            color="red"
            icon="alert"
            title="6 आवेदन स्वीकृति में अतिदेय"
            sub="15 दिन की समय सीमा पार"
            action="अभी देखें"
            onClick={() => go("applications")}
          />
          <Task
            color="amber"
            icon="clock"
            title="4 डिलीवरी 3 दिन में देय"
            sub="स्वीकृति के बाद 30 दिन"
            action="फॉलो-अप"
            onClick={() => notify("संबंधित अधिकारियों को रिमाइंडर भेजा गया")}
          />
          <Task
            color="blue"
            icon="file"
            title="मासिक रिपोर्ट जमा करें"
            sub="DMMU को देय • 10 दिसंबर"
            action="तैयार करें"
            onClick={() => go("reports")}
          />
        </div>
      </section>
      <section className="overview-operations-grid">
        <div className="card department-pendency">
          <div className="card-head">
            <div>
              <h3>विभागीय लंबितता</h3>
              <p>प्राप्त / लंबित / अतिदेय आवेदन</p>
            </div>
            <button className="text-button" onClick={openDepartments}>
              विभाग खोलें <Icon name="arrow" size={14} />
            </button>
          </div>
          <div className="pendency-table">
            <div className="head">
              <span>विभाग</span>
              <b>प्राप्त</b>
              <b>लंबित</b>
              <b>अतिदेय</b>
            </div>
            {[
              ["मत्स्य", 142, 38, 12],
              ["पशुपालन", 186, 42, 8],
              ["उद्यानिकी", 118, 29, 5],
              ["कृषि", 224, 31, 3],
              ["वन / CGMFP", 96, 18, 7],
              ["उद्योग", 74, 22, 4],
            ].map(([dept, received, pending, overdue]) => (
              <div key={String(dept)}>
                <span>{dept}</span>
                <b>{received}</b>
                <b className="pending">{pending}</b>
                <b className="overdue">{overdue}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="card surveyor-performance">
          <div className="card-head">
            <div>
              <h3>सर्वेयर प्रदर्शन</h3>
              <p>नवंबर 2026 • गुणवत्ता और सिंक</p>
            </div>
          </div>
          <div className="surveyor-table">
            <div className="head">
              <span>सर्वेयर</span>
              <b>निर्धारित</b>
              <b>पूर्ण</b>
              <b>ड्राफ्ट</b>
              <b>सिंक बाकी</b>
              <b>गुणवत्ता</b>
            </div>
            {[
              ["गीता नेताम", 86, 72, 8, 2, "उत्कृष्ट"],
              ["सविता कश्यप", 80, 61, 12, 4, "अच्छा"],
              ["लक्ष्मी बघेल", 74, 48, 16, 7, "जाँचें"],
              ["मीना नाग", 78, 66, 7, 1, "उत्कृष्ट"],
            ].map(([name, assigned, done, draft, sync, quality]) => (
              <div key={String(name)}>
                <span>{name}</span>
                <b>{assigned}</b>
                <b>{done}</b>
                <b>{draft}</b>
                <b className={Number(sync) > 4 ? "warning" : ""}>{sync}</b>
                <em className={quality === "जाँचें" ? "warning" : ""}>{quality}</em>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
