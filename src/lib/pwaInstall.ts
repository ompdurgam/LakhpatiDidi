import { useSyncExternalStore } from "react"

/** Chrome's install prompt event (not in lib.dom). */
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export type PwaInstallState = {
  /** Running as the installed app (home-screen icon) — nothing to offer. */
  standalone: boolean
  /** The browser has an install prompt ready (Android/desktop Chrome, Edge). */
  canInstall: boolean
  /** Installed on this device but opened in a normal browser tab. */
  installedElsewhere: boolean
  /** iPhone/iPad Safari: no prompt exists, the user adds it from the Share menu. */
  iosManual: boolean
  /** Phone browser with no install event (e.g. plain http): show the manual menu steps. */
  manualHint: boolean
  /** The user tapped Skip recently. */
  skipped: boolean
}

const INSTALLED_KEY = "ld.pwa.installed"
const SKIPPED_KEY = "ld.pwa.skippedAt"
const SKIP_DAYS = 7

let deferred: InstallPromptEvent | null = null
const listeners = new Set<() => void>()

function read(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* private mode: the banner just reappears next visit */
  }
}

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true)

const isIos = () =>
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent) &&
  !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent)

const isPhone = () =>
  typeof navigator !== "undefined" && /Android|Mobile/i.test(navigator.userAgent)

function compute(): PwaInstallState {
  const standalone = isStandalone()
  const installedElsewhere = !standalone && deferred === null && read(INSTALLED_KEY) === "1"
  const iosManual = !standalone && isIos()
  const skippedAt = Number(read(SKIPPED_KEY) ?? 0)
  return {
    standalone,
    canInstall: deferred !== null,
    installedElsewhere,
    iosManual,
    manualHint: !standalone && !installedElsewhere && !iosManual && deferred === null && isPhone(),
    skipped: Date.now() - skippedAt < SKIP_DAYS * 86_400_000,
  }
}

let snapshot: PwaInstallState | null = null
function emit() {
  snapshot = compute()
  listeners.forEach((listener) => listener())
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault() // we show our own banner instead of the browser's mini-bar
    deferred = event as InstallPromptEvent
    write(INSTALLED_KEY, null) // the browser offers install, so it is NOT installed (any more)
    emit()
  })
  window.addEventListener("appinstalled", () => {
    deferred = null
    write(INSTALLED_KEY, "1")
    emit()
  })
  // The installed app and the browser share storage on Android, so remember the install.
  if (isStandalone()) write(INSTALLED_KEY, "1")
  // Where supported (needs related_applications in the manifest), ask the browser directly.
  const nav = navigator as Navigator & { getInstalledRelatedApps?: () => Promise<unknown[]> }
  void nav
    .getInstalledRelatedApps?.()
    .then((apps) => {
      if (apps.length) {
        write(INSTALLED_KEY, "1")
        emit()
      }
    })
    .catch(() => {})
}

/** Opens the browser's install dialog. Resolves true if the user accepted. */
async function install() {
  if (!deferred) return false
  const event = deferred
  await event.prompt()
  const { outcome } = await event.userChoice
  deferred = null // an event can be used once
  if (outcome === "accepted") write(INSTALLED_KEY, "1")
  emit()
  return outcome === "accepted"
}

function skip() {
  write(SKIPPED_KEY, String(Date.now()))
  emit()
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
const getSnapshot = () => (snapshot ??= compute())

/** Install state + actions for the "install the app" banner. */
export function usePwaInstall() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return { ...state, install, skip }
}
