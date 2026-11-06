import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"

import { useSession } from "@/stores/session"

import { api } from "./client"
import { queryKeys } from "./queryKeys"
import type { ApplicationRow, HouseholdRow, Meta } from "./types"

/** Staff data is only fetched for staff: a Didi account is refused it by the API (403). */
const useSignedIn = () => useSession((s) => Boolean(s.token) && s.user?.role !== "didi")

export function useApplications() {
  const signedIn = useSignedIn()
  return useQuery({
    queryKey: queryKeys.applications,
    queryFn: () => api<ApplicationRow[]>("/applications"),
    enabled: signedIn,
  })
}

export function useHouseholds() {
  const signedIn = useSignedIn()
  return useQuery({
    queryKey: queryKeys.households,
    queryFn: () => api<HouseholdRow[]>("/households"),
    enabled: signedIn,
  })
}

export function useMeta() {
  const signedIn = useSignedIn()
  return useQuery({
    queryKey: queryKeys.meta,
    queryFn: () => api<Meta>("/meta"),
    enabled: signedIn,
    staleTime: 10 * 60_000,
  })
}

/** Re-fetches the shared lists after a write. */
export function useRefreshData() {
  const client = useQueryClient()
  return useCallback(async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.applications }),
      client.invalidateQueries({ queryKey: queryKeys.households }),
    ])
  }, [client])
}

/**
 * Combined view used by the ported prototype screens.
 * New code should call the individual hooks above.
 */
export function useData() {
  const user = useSession((s) => s.user)
  const applications = useApplications()
  const households = useHouseholds()
  const meta = useMeta()
  const refresh = useRefreshData()
  return {
    user,
    applications: applications.data ?? [],
    households: households.data ?? [],
    meta: meta.data ?? null,
    loading: applications.isPending || households.isPending,
    error: (applications.error ?? households.error)?.message ?? "",
    refresh,
  }
}

/** Fetches a single API path; `setData` updates the cache optimistically. */
export function useResource<T>(path: string | null) {
  const client = useQueryClient()
  const signedIn = useSignedIn()
  const key = queryKeys.resource(path ?? "")
  const query = useQuery({
    queryKey: key,
    queryFn: () => api<T>(path!),
    enabled: Boolean(path) && signedIn,
  })
  return {
    data: (query.data ?? null) as T | null,
    error: query.error?.message ?? "",
    loading: query.isFetching,
    reload: async () => {
      await query.refetch()
    },
    setData: (value: T) => client.setQueryData(key, value),
  }
}
