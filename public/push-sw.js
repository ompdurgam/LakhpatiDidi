/* Web Push handlers, loaded into the generated PWA service worker (workbox importScripts). */
/* global self, clients */

const refreshOpenWindows = async (id) => {
  const windows = await clients.matchAll({ type: "window", includeUncontrolled: true })
  for (const client of windows) client.postMessage({ type: "notification", id })
}

// The server sends JSON: { title, body, url, tag, id, actions?, token? }.
self.addEventListener("push", (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: event.data ? event.data.text() : "" }
  }
  const title = data.title || "लखपति दीदी"
  event.waitUntil(
    (async () => {
      await self.registration.showNotification(title, {
        body: data.body || "",
        icon: "/android-chrome-192x192.png",
        badge: "/favicon-32x32.png",
        // Same tag replaces the older alert about the same application; renotify still buzzes.
        tag: data.tag,
        renotify: Boolean(data.tag),
        // Questions ("Would you like to apply?") stay on screen until answered.
        requireInteraction: Boolean(data.actions && data.actions.length),
        // Answer buttons, e.g. "हाँ, आवेदन करना है" / "अभी नहीं" (Android/desktop; max 2 shown).
        actions: data.actions || [],
        data: { url: data.url || "/", id: data.id, token: data.token },
      })
      await refreshOpenWindows(data.id)
    })(),
  )
})

const openApp = async (url) => {
  const target = new URL(url || "/", self.location.origin).href
  const windows = await clients.matchAll({ type: "window", includeUncontrolled: true })
  const open = windows.find((client) => client.url.startsWith(self.location.origin))
  if (open) {
    await open.focus()
    if ("navigate" in open) return open.navigate(target)
    return undefined
  }
  return clients.openWindow(target)
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const { url, id, token } = event.notification.data || {}
  event.waitUntil(
    (async () => {
      // An answer button: send it with the push's single-use token (no login needed).
      if (event.action && token) {
        try {
          const response = await fetch("/api/notifications/answer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, answer: event.action }),
          })
          if (response.ok) return refreshOpenWindows(id)
        } catch {
          /* offline: fall through and open the app, where she can answer in the bell menu */
        }
      }
      // Tapped the alert itself (or the answer could not be sent): open the app.
      return openApp(url)
    })(),
  )
})
