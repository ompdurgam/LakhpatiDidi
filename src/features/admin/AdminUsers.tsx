import { useState } from "react"

import { api } from "@/api/client"
import { useData, useResource } from "@/api/hooks"
import { Icon } from "@/components/ui/Icon"

export type AdminUserRow = {
  id: number
  name: string
  mobile: string
  role: string
  designation: string
  scope: string
  status: "active" | "locked"
  lastLogin: string
}

export function AdminUsers({ onNotify }: { onNotify: (message: string) => void }) {
  const { data: users, error, reload } = useResource<AdminUserRow[]>("/users")
  const { meta } = useData()
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState("")
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    role: "field",
    designation: "",
    block: "JGD",
  })
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
      const { message } = await api<{ message: string }>("/users", { body: form })
      onNotify(message)
      setForm({ name: "", mobile: "", role: "field", designation: "", block: "JGD" })
      setAdding(false)
      await reload()
    } catch (e) {
      setFormError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="card admin-data-table">
      <div className="card-head">
        <div>
          <h3>यूज़र और भूमिकाएँ</h3>
          <p>OTP लॉगिन, कार्यक्षेत्र और पहुँच</p>
        </div>
        <button className="primary" onClick={() => setAdding(!adding)}>
          <Icon name={adding ? "close" : "plus"} size={14} /> {adding ? "बंद करें" : "यूज़र जोड़ें"}
        </button>
      </div>
      {adding && (
        <div className="admin-inline-form">
          <label className="text-control">
            <span>नाम</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="text-control">
            <span>मोबाइल (10 अंक)</span>
            <input
              inputMode="numeric"
              maxLength={10}
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "") })}
            />
          </label>
          <label className="text-control">
            <span>भूमिका</span>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="field">CRP / Surveyor</option>
              <option value="block">Block Manager</option>
              <option value="department">विभाग अधिकारी</option>
              <option value="district">DPM</option>
              <option value="state">SMMU</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label className="text-control">
            <span>पदनाम</span>
            <input
              value={form.designation}
              placeholder="वैकल्पिक"
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
            />
          </label>
          <label className="text-control">
            <span>ब्लॉक</span>
            <select
              value={form.block}
              onChange={(e) => setForm({ ...form, block: e.target.value })}
            >
              {(meta?.blocks ?? []).map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="primary"
            disabled={busy || !form.name.trim() || form.mobile.length !== 10}
            onClick={addUser}
          >
            सहेजें
          </button>
          {formError && <p className="form-error">{formError}</p>}
        </div>
      )}
      {error && <p className="form-error">{error}</p>}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>नाम</th>
              <th>मोबाइल</th>
              <th>भूमिका</th>
              <th>कार्यक्षेत्र</th>
              <th>स्थिति</th>
              <th>अंतिम लॉगिन</th>
              <th>रीसेट</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.mobile}</td>
                <td>{row.designation}</td>
                <td>{row.scope}</td>
                <td>
                  <button
                    className={`status ${row.status === "active" ? "green" : "red"} status-toggle`}
                    disabled={busy}
                    title="स्थिति बदलें"
                    onClick={() =>
                      call(
                        `/users/${row.id}`,
                        { status: row.status === "active" ? "locked" : "active" },
                        "PATCH",
                      )
                    }
                  >
                    {row.status === "active" ? "सक्रिय" : "लॉक"}
                  </button>
                </td>
                <td>{row.lastLogin}</td>
                <td>
                  <button
                    className="table-reset"
                    disabled={busy}
                    onClick={() => call(`/users/${row.id}/otp-reset`, {})}
                  >
                    OTP रीसेट
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!users && !error && <div className="empty">लोड हो रहा है…</div>}
      </div>
    </section>
  )
}
