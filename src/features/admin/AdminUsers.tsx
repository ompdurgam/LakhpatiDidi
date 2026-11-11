import { useState } from "react"

import { api } from "@/api/client"
import { useResource } from "@/api/hooks"
import { Icon } from "@/components/ui/Icon"
import { useTr } from "@/i18n/tr"

import { type AdminUserRow, AdminUsersTable } from "./AdminUsersTable"
import { AssignmentEditor } from "./AssignmentEditor"
import { type AssignmentDraft, isComplete, toAssignment } from "./assignmentRules"

const NEW_ASSIGNMENT: AssignmentDraft = { role: "field", level: "block" }

/** A saved assignment as an editable draft (its area path fills the pickers). */
const toDraft = (a: AdminUserRow["assignments"][number]): AssignmentDraft => ({
  role: a.role,
  level: a.level,
  ...a.path,
  department: a.departmentCode ?? undefined,
})

export function AdminUsers({ onNotify }: { onNotify: (message: string) => void }) {
  const tr = useTr()
  const { data: users, error, reload } = useResource<AdminUserRow[]>("/users")
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState("")
  const [form, setForm] = useState({ name: "", mobile: "", designation: "" })
  const [drafts, setDrafts] = useState<AssignmentDraft[]>([NEW_ASSIGNMENT])
  /** The user whose roles / areas are being changed. */
  const [editing, setEditing] = useState<AdminUserRow | null>(null)
  const [editDrafts, setEditDrafts] = useState<AssignmentDraft[]>([])

  const call = async (path: string, body: unknown, method = "POST") => {
    setBusy(true)
    try {
      const { message } = await api<{ message: string }>(path, { method, body })
      onNotify(message)
      await reload()
      return true
    } catch (e) {
      onNotify((e as Error).message)
      return false
    } finally {
      setBusy(false)
    }
  }
  const addUser = async () => {
    setFormError("")
    setBusy(true)
    try {
      const { message } = await api<{ message: string }>("/users", {
        body: { ...form, assignments: drafts.map(toAssignment) },
      })
      onNotify(message)
      setForm({ name: "", mobile: "", designation: "" })
      setDrafts([NEW_ASSIGNMENT])
      setAdding(false)
      await reload()
    } catch (e) {
      setFormError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const saveEdit = async () => {
    if (!editing) return
    const ok = await call(
      `/users/${editing.id}/assignments`,
      { assignments: editDrafts.map(toAssignment) },
      "PUT",
    )
    if (ok) setEditing(null)
  }
  return (
    <section className="card admin-data-table">
      <div className="card-head">
        <div>
          <h3>{tr("यूज़र और भूमिकाएँ")}</h3>
          <p>{tr("OTP लॉगिन, कार्यक्षेत्र और पहुँच")}</p>
        </div>
        <button className="primary" onClick={() => setAdding(!adding)}>
          <Icon name={adding ? "close" : "plus"} size={14} />{" "}
          {adding ? tr("बंद करें") : tr("यूज़र जोड़ें")}
        </button>
      </div>
      {adding && (
        <div className="admin-inline-form">
          <label className="text-control">
            <span>{tr("नाम")}</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="text-control">
            <span>{tr("मोबाइल (10 अंक)")}</span>
            <input
              inputMode="numeric"
              maxLength={10}
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "") })}
            />
          </label>
          <label className="text-control">
            <span>{tr("पदनाम")}</span>
            <input
              value={form.designation}
              placeholder={tr("वैकल्पिक")}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
            />
          </label>
          <AssignmentEditor value={drafts} onChange={setDrafts} />
          <button
            className="primary"
            disabled={
              busy || !form.name.trim() || form.mobile.length !== 10 || !drafts.every(isComplete)
            }
            onClick={addUser}
          >
            {tr("सहेजें")}
          </button>
          {formError && <p className="form-error">{tr(formError)}</p>}
        </div>
      )}
      {editing && (
        <div className="admin-inline-form">
          <strong>
            {tr("भूमिकाएँ और क्षेत्र बदलें")}: {tr(editing.name)} • {editing.mobile}
          </strong>
          <AssignmentEditor value={editDrafts} onChange={setEditDrafts} />
          <button
            className="primary"
            disabled={busy || !editDrafts.length || !editDrafts.every(isComplete)}
            onClick={saveEdit}
          >
            {tr("सहेजें")}
          </button>
          <button className="secondary" onClick={() => setEditing(null)}>
            {tr("रद्द करें")}
          </button>
          <p className="empty-note">{tr("सहेजने पर यूज़र को फिर से लॉगिन करना होगा।")}</p>
        </div>
      )}
      {error && <p className="form-error">{tr(error)}</p>}
      {users ? (
        <AdminUsersTable
          users={users}
          busy={busy}
          onToggle={(row) =>
            call(
              `/users/${row.id}`,
              { status: row.status === "active" ? "locked" : "active" },
              "PATCH",
            )
          }
          onReset={(row) => call(`/users/${row.id}/otp-reset`, {})}
          onEdit={(row) => {
            setEditing(row)
            setEditDrafts(row.assignments.length ? row.assignments.map(toDraft) : [NEW_ASSIGNMENT])
          }}
        />
      ) : (
        !error && <div className="empty">{tr("लोड हो रहा है…")}</div>
      )}
    </section>
  )
}
