import { Icon } from "@/components/ui/Icon"

import { OPEN_STATUSES } from "./applicationStatus"

export type FormAction = "info" | "sanction" | "reject" | "deliver"

/**
 * Role-aware buttons at the bottom of the drawer: the department decides,
 * block staff follow up and escalate. Buttons are disabled when the
 * application's status doesn't allow the action.
 */
export function ApplicationActionBar({
  role,
  statusCode,
  escalation,
  busy,
  onRun,
  onOpenForm,
}: {
  role: string
  statusCode: string
  escalation?: string
  busy: boolean
  onRun: (payload: Record<string, unknown>) => void
  onOpenForm: (action: FormAction) => void
}) {
  const isOpen = OPEN_STATUSES.includes(statusCode)
  const departmentRole = role === "department"
  return (
    <div className={`drawer-actions role-actions ${departmentRole ? "department" : "block"}`}>
      {departmentRole ? (
        <>
          <button
            className="secondary accept-action"
            disabled={busy || statusCode !== "submitted"}
            onClick={() => onRun({ action: "accept" })}
          >
            <Icon name="check" size={14} /> स्वीकार
          </button>
          <button
            className="secondary"
            disabled={busy || !isOpen}
            onClick={() => onOpenForm("info")}
          >
            जानकारी माँगें
          </button>
          <button
            className="primary"
            disabled={busy || !isOpen}
            onClick={() => onOpenForm("sanction")}
          >
            स्वीकृत करें
          </button>
          <button
            className="secondary danger-action"
            disabled={busy || !isOpen}
            onClick={() => onOpenForm("reject")}
          >
            अस्वीकार
          </button>
          <button
            className="secondary deliver-action"
            disabled={busy || statusCode !== "sanctioned"}
            onClick={() => onOpenForm("deliver")}
          >
            डिलीवर चिह्नित करें
          </button>
        </>
      ) : (
        <>
          <button
            className="secondary"
            disabled={busy}
            onClick={() => onRun({ action: "follow_up" })}
          >
            <Icon name="bell" size={14} /> फॉलो-अप भेजें
          </button>
          <button
            className="primary danger-action"
            disabled={busy || !isOpen || escalation === "कलेक्टर"}
            onClick={() => onRun({ action: "escalate" })}
          >
            <Icon name="alert" size={14} /> एस्केलेट करें
          </button>
        </>
      )}
    </div>
  )
}
