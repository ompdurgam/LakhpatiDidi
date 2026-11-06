import { useTranslation } from "react-i18next"

import { BrandMark } from "@/components/ui/BrandMark"

/** Shown while the first lazy route chunk loads. */
export function BootScreen() {
  const { t } = useTranslation()
  return (
    <div className="boot-screen" role="status">
      <BrandMark size={112} />
      <p>{t("status.loading")}</p>
    </div>
  )
}
