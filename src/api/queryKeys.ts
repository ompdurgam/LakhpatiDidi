export const queryKeys = {
  applications: ["applications"] as const,
  application: (id: string) => ["applications", id] as const,
  households: ["households"] as const,
  meta: ["meta"] as const,
  me: ["auth", "me"] as const,
  resource: (path: string) => ["resource", path] as const,
}
