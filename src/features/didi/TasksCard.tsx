import { Link } from "react-router"

import { Card } from "@/components/ui/Card"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { useTr } from "@/i18n/tr"

import { TaskList } from "./TaskList"
import type { DidiProfileData } from "./useDidi"

/** "My tasks" on the profile: progress bar and the next few things to do. */
export function TasksCard({ tasks }: { tasks: DidiProfileData["tasks"] }) {
  const tr = useTr()
  const pending = tasks.items.filter((t) => !t.done)
  return (
    <Card
      className="didi-tasks-card"
      title={tr("मेरे कार्य")}
      subtitle={tr("{{done}} में से {{total}} पूरे", { done: tasks.done, total: tasks.total })}
      action={
        <Link className="didi-link" to="/didi/tasks">
          {tr("सभी देखें")}
        </Link>
      }
    >
      <ProgressBar value={tasks.percent} label={tr("मेरे कार्य")} />
      {pending.length ? (
        <TaskList tasks={pending.slice(0, 3)} />
      ) : (
        <p className="didi-empty">{tr("सभी कार्य पूरे हो गए। शाबाश!")}</p>
      )}
    </Card>
  )
}
