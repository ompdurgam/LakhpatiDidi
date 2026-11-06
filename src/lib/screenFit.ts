/**
 * Fits the type to the screen. Sets `--fit-scale` from the window size, so
 * text shrinks a little on small laptops (1366×768) and grows a little on big
 * monitors, smoothly as the window is resized. Phones keep full size (their
 * layout is already single-column). The user's A− / A / A+ choice
 * (`--text-scale`) multiplies on top — see `--font-scale` in tokens.css.
 */
const MIN = 0.86
const MAX = 1.1
// Window size that renders at exactly 100%.
const REFERENCE_WIDTH = 1520
const REFERENCE_HEIGHT = 950
const PHONE_MAX_WIDTH = 760

export function fitScale(width: number, height: number) {
  if (width <= PHONE_MAX_WIDTH) return 1
  const fit = Math.min(width / REFERENCE_WIDTH, height / REFERENCE_HEIGHT)
  return Math.round(Math.min(MAX, Math.max(MIN, fit)) * 1000) / 1000
}

function apply() {
  document.documentElement.style.setProperty(
    "--fit-scale",
    String(fitScale(window.innerWidth, window.innerHeight)),
  )
}

let frame = 0
apply()
window.addEventListener("resize", () => {
  cancelAnimationFrame(frame)
  frame = requestAnimationFrame(apply)
})
