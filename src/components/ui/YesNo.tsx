import { useTranslation } from "react-i18next"

import { ChipGroup } from "./ChipGroup"

/** हाँ / नहीं chip pair built on ChipGroup. */
export function YesNo({
  value,
  onChange,
}: {
  value?: boolean
  onChange?: (value: boolean) => void
}) {
  const { t } = useTranslation()
  const yes = t("yesNo.yes")
  const no = t("yesNo.no")
  return (
    <ChipGroup
      single
      options={[yes, no]}
      selected={value === undefined ? [] : [value ? yes : no]}
      onToggle={(item) => onChange?.(item === yes)}
    />
  )
}
