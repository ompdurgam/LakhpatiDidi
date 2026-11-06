import { Card } from "@/components/ui/Card"
import { EmptyState } from "@/components/ui/EmptyState"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { useTr } from "@/i18n/tr"

import { TaskList } from "./TaskList"
import { useDidi } from "./useDidi"

/** Every task, pending first, with the overall progress. */
export function DidiTasks() {
  const tr = useTr()
  const { data, isLoading, error } = useDidi()
  if (error) return <EmptyState>{(error as Error).message}</EmptyState>
  if (isLoading || !data) return <EmptyState>{tr("लोड हो रहा है…")}</EmptyState>
  const { tasks } = data
  const pending = tasks.items.filter((t) => !t.done)
  const done = tasks.items.filter((t) => t.done)
  return (
    <div className="page didi-page">
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">{data.profile.name}</span>
          <h2>{tr("मेरे कार्य")}</h2>
          <p>{tr("लखपति बनने के लिए आपके अगले कदम")}</p>
        </div>
      </div>
      <Card
        title={tr("{{done}} में से {{total}} पूरे", { done: tasks.done, total: tasks.total })}
        subtitle={`${tasks.percent}%`}
      >
        <ProgressBar value={tasks.percent} label={tr("मेरे कार्य")} />
      </Card>
      <Card
        className="didi-tasks-section"
        title={tr("करने के लिए")}
        subtitle={String(pending.length)}
      >
        {pending.length ? (
          <TaskList tasks={pending} />
        ) : (
          <p className="didi-empty">{tr("सभी कार्य पूरे हो गए। शाबाश!")}</p>
        )}
      </Card>
      {done.length > 0 && (
        <Card className="didi-tasks-section" title={tr("पूरे हुए")} subtitle={String(done.length)}>
          <TaskList tasks={done} />
        </Card>
      )}
    </div>
  )
}
