import { Link } from "react-router"

import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

import type { DidiTask } from "./useDidi"

/** Plain-language text for each kind of task (pending / done). */
function useTaskText() {
  const tr = useTr()
  return (task: DidiTask) => {
    const vars = { scheme: task.scheme ?? "", id: task.application ?? "" }
    switch (task.kind) {
      case "second_source":
        return task.done
          ? tr("आय के कम से कम 2 स्रोत हैं")
          : tr("आय का दूसरा स्रोत जुड़वाएँ (अपनी CRP से बात करें)")
      case "scheme_gap":
        return task.done
          ? tr("{{scheme}} का लाभ मिल गया", vars)
          : tr("{{scheme}} के लिए CRP के साथ आवेदन करें", vars)
      case "info_requested":
        return tr(
          "आवेदन {{id}} ({{scheme}}): विभाग ने जानकारी माँगी है — CRP को दस्तावेज़ दें",
          vars,
        )
      case "delivery":
        return task.done
          ? tr("{{scheme}} ({{id}}): डिलीवरी हो गई", vars)
          : tr("{{scheme}} ({{id}}): स्वीकृति मिल गई — संपत्ति की डिलीवरी लें", vars)
      case "lakhpati":
        return task.done ? tr("आप लखपति दीदी बन गई हैं!") : tr("सालाना आय ₹1,00,000 तक पहुँचें")
    }
  }
}

/** Checklist of tasks; those about an application link to "My applications". */
export function TaskList({ tasks }: { tasks: DidiTask[] }) {
  const text = useTaskText()
  return (
    <ul className="didi-tasks">
      {tasks.map((task) => {
        const body = (
          <>
            <span className={`didi-task-check ${task.done ? "done" : ""}`} aria-hidden="true">
              {task.done && <Icon name="check" size={13} />}
            </span>
            <span className="didi-task-text">{text(task)}</span>
            {task.application && !task.done && <Icon name="chevron" size={15} />}
          </>
        )
        return (
          <li key={task.id} className={task.done ? "done" : ""}>
            {task.application && !task.done ? (
              <Link to="/didi/applications">{body}</Link>
            ) : (
              <div>{body}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
