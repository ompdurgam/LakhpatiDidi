import { currentLanguage } from "@/i18n"
import { useTr } from "@/i18n/tr"
import { useSession } from "@/stores/session"

/** "Jagdalpur block" / "Bastar district" / "Chhattisgarh" for the signed-in user's area. */
export function useAreaLabel() {
  const tr = useTr()
  const scope = useSession((s) => s.user?.scope)
  const english = currentLanguage() === "en"
  const block = english ? scope?.blockEn : scope?.blockHi
  const district = english ? scope?.districtEn : scope?.districtHi
  if (block) return tr("{{name}} ब्लॉक", { name: block })
  if (district) return tr("{{name}} जिला", { name: district })
  return tr("छत्तीसगढ़")
}
