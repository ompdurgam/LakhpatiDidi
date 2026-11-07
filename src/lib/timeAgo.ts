const steps: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 86_400],
  ["month", 30 * 86_400],
  ["week", 7 * 86_400],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
]

/** "5 मिनट पहले" / "5 minutes ago". Under a minute reads as "now". */
export function timeAgo(iso: string, lang: string, now = Date.now()) {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000)
  const format = new Intl.RelativeTimeFormat(lang === "en" ? "en-IN" : "hi-IN", {
    numeric: "auto",
  })
  for (const [unit, size] of steps)
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit)
  return format.format(0, "second")
}
