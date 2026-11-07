// Web Push transport (VAPID + RFC 8291 payload encryption via the `web-push` library).
import fs from "node:fs"
import path from "node:path"
import webpush from "web-push"

type VapidKeys = { publicKey: string; privateKey: string }

const DEV_KEY_FILE = path.resolve(import.meta.dirname, "..", "..", "..", ".vapid.json")

/**
 * VAPID keys identify this server to the browsers' push services.
 * Production: set VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT in .env
 * (generate once with `npx web-push generate-vapid-keys`). Changing them
 * invalidates every phone's subscription.
 * Development: a key pair is generated once into .vapid.json (gitignored).
 */
function loadKeys(): VapidKeys {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env
  if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY)
    return { publicKey: VAPID_PUBLIC_KEY, privateKey: VAPID_PRIVATE_KEY }
  if (process.env.NODE_ENV === "production")
    throw new Error("VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set in production")
  if (fs.existsSync(DEV_KEY_FILE)) return JSON.parse(fs.readFileSync(DEV_KEY_FILE, "utf8"))
  const keys = webpush.generateVAPIDKeys()
  fs.writeFileSync(DEV_KEY_FILE, JSON.stringify(keys, null, 2))
  console.log(`Generated development VAPID keys in ${DEV_KEY_FILE}`)
  return keys
}

let keys: VapidKeys | null = null
const vapid = () => (keys ??= loadKeys())

/** Public key the browser needs for pushManager.subscribe (URL-safe base64). */
export const vapidPublicKey = () => vapid().publicKey

export type PushTarget = { endpoint: string; p256dh: string; auth: string }

export type PushMessage = {
  title: string
  body: string
  url: string
  /** Same tag replaces the older notice on the phone instead of stacking. */
  tag: string
  id: number
  /** Answer buttons and the single-use token that authorises them (actionable notices). */
  actions?: { action: string; title: string }[]
  token?: string
}

/** Sends one encrypted push. Throws a WebPushError (with statusCode) on failure. */
export async function sendPush(
  target: PushTarget,
  message: PushMessage,
  options: { ttlSeconds: number; urgency: "low" | "normal" | "high" },
) {
  const { publicKey, privateKey } = vapid()
  await webpush.sendNotification(
    { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
    JSON.stringify(message),
    {
      TTL: options.ttlSeconds,
      urgency: options.urgency,
      timeout: 10_000,
      vapidDetails: {
        subject: process.env.VAPID_SUBJECT ?? "mailto:admin@localhost",
        publicKey,
        privateKey,
      },
    },
  )
}
