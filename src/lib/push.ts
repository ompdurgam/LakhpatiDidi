// Phone alerts (Web Push): permission, subscribe/unsubscribe, and keeping the
// server's copy of this device's subscription in sync with the signed-in user.
import { api } from "@/api/client"
import i18n from "@/i18n"
import { useSession } from "@/stores/session"

export type PushState = "unsupported" | "insecure" | "default" | "granted" | "denied"

export function pushState(): PushState {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  )
    return "unsupported"
  if (!window.isSecureContext) return "insecure"
  return Notification.permission
}

/** VAPID public key (URL-safe base64) → the bytes pushManager.subscribe wants. */
function keyBytes(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/")
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
}

/** The PWA service worker (it handles "push"). None in `npm run dev`, so give up after a while. */
function registration() {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("service worker not active")), 8000),
    ),
  ])
}

/** Sends this device's subscription to the server for the signed-in user. */
async function save(subscription: PushSubscription) {
  const json = subscription.toJSON()
  await api("/notifications/push/subscriptions", {
    body: { endpoint: json.endpoint, keys: json.keys },
  })
}

/** Asks for permission (call from a tap) and subscribes this device. Returns the new state. */
export async function enablePush(): Promise<PushState> {
  const state = pushState()
  if (state === "unsupported" || state === "insecure" || state === "denied") return state
  const permission = await Notification.requestPermission()
  if (permission !== "granted") return permission
  const reg = await registration()
  const { publicKey } = await api<{ publicKey: string }>("/notifications/push/key")
  const subscription =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyBytes(publicKey),
    }))
  await save(subscription)
  return "granted"
}

/**
 * On app start / sign-in: if alerts are already allowed, re-send the subscription.
 * Keeps the server right after a browser rotated the endpoint or another user signed in
 * on this phone. Never prompts.
 */
export async function syncPush() {
  if (pushState() !== "granted" || !useSession.getState().token) return
  const subscription = await (await registration()).pushManager.getSubscription()
  if (subscription) await save(subscription)
  else await enablePush()
}

/** Sign-out: stop this phone receiving the previous user's alerts. */
async function revokeFor(token: string) {
  if (pushState() !== "granted") return
  const subscription = await (await registration()).pushManager.getSubscription()
  if (!subscription) return
  await fetch("/api/notifications/push/subscriptions", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "Accept-Language": i18n.language === "en" ? "en" : "hi",
    },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  }).catch(() => {})
}

if (typeof window !== "undefined") {
  useSession.subscribe((state, previous) => {
    if (previous.token && !state.token) void revokeFor(previous.token)
    else if (state.token && state.token !== previous.token) void syncPush().catch(() => {})
  })
  // The push language follows the UI language (the server stores it per device).
  i18n.on("languageChanged", () => void syncPush().catch(() => {}))
  void syncPush().catch(() => {})
}
