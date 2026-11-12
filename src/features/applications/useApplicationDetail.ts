import { useState } from "react"

import { api } from "@/api/client"
import { useRefreshData, useResource } from "@/api/hooks"
import type { ApplicationDetail } from "@/api/types"

import type { FormAction } from "./ApplicationActionBar"

/** One application's detail plus its workflow actions and comments (drawer and full page). */
export function useApplicationDetail(code: string, onNotify: (message: string) => void) {
  const refresh = useRefreshData()
  const {
    data: detail,
    error: loadError,
    reload,
  } = useResource<ApplicationDetail>(`/applications/${code}`)
  const [action, setAction] = useState<FormAction | null>(null)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState("")

  /** Runs a request with the busy / error handling every action shares. */
  const submit = async (work: () => Promise<string>, after: () => Promise<unknown>) => {
    setBusy(true)
    setActionError("")
    try {
      onNotify(await work())
      await after()
      return true
    } catch (e) {
      setActionError((e as Error).message)
      return false
    } finally {
      setBusy(false)
    }
  }

  const run = (payload: Record<string, unknown>) =>
    submit(
      async () => {
        const { message } = await api<{ message: string }>(`/applications/${code}/actions`, {
          body: payload,
        })
        setAction(null)
        return message
      },
      () => Promise.all([reload(), refresh()]),
    )

  const sendComment = (body: string) =>
    submit(async () => {
      await api(`/applications/${code}/comments`, { body: { body } })
      return "टिप्पणी भेजी गई"
    }, reload)

  return {
    detail,
    loadError,
    action,
    setAction,
    pdfOpen,
    setPdfOpen,
    busy,
    actionError,
    setActionError,
    run,
    sendComment,
  }
}

export type ApplicationDetailState = ReturnType<typeof useApplicationDetail>
