// Typed fetch wrapper for the REST API (proxied at /api by Vite).
import { useSession } from "@/stores/session"

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function api<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = useSession.getState().token
  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      method: options.method ?? (options.body ? "POST" : "GET"),
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    })
  } catch {
    throw new ApiError(0, "सर्वर से संपर्क नहीं हो सका। इंटरनेट/सर्वर जाँचें।")
  }
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    // An expired session anywhere logs the user out.
    if (response.status === 401 && token && !path.startsWith("/auth/")) {
      useSession.getState().signOut()
    }
    throw new ApiError(response.status, (data as { error?: string }).error ?? "अनुरोध विफल रहा")
  }
  return data as T
}
