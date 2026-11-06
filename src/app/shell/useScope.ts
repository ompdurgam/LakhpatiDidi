import { useTr } from "@/i18n/tr"
import { useSession } from "@/stores/session"

/** "Your area" labels for the sidebar and header, from the signed-in user's own district / block. */
export function useScope() {
  const tr = useTr()
  const scope = useSession((s) => s.user?.scope)
  const english = document.documentElement.lang === "en"
  const pick = (hi: string | null | undefined, en: string | null | undefined) =>
    (english ? en : hi) || hi || en || null
  const district = pick(scope?.districtHi, scope?.districtEn)
  const block = pick(scope?.blockHi, scope?.blockEn)

  if (block)
    return {
      title: tr("{{name}} ब्लॉक", { name: block }),
      region: district ? tr("{{name}} जिला, छत्तीसगढ़", { name: district }) : tr("छत्तीसगढ़"),
      breadcrumb: [district, block].filter(Boolean).join(" / "),
    }
  if (district)
    return {
      title: tr("{{name}} जिला", { name: district }),
      region: tr("छत्तीसगढ़"),
      breadcrumb: `${tr("छत्तीसगढ़")} / ${district}`,
    }
  return {
    title: tr("छत्तीसगढ़ राज्य"),
    region: tr("सभी 33 जिले"),
    breadcrumb: tr("छत्तीसगढ़"),
  }
}
