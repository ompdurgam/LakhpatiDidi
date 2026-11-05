import { useTranslation } from "react-i18next"

import { Icon, type IconName } from "@/components/ui/Icon"
import { type Role, ROLES } from "@/stores/session"

const roleIcon: Record<Role, IconName> = {
  field: "people",
  block: "home",
  department: "building",
  district: "map",
  state: "map",
  admin: "settings",
}

/** Role cards shown after OTP verification. */
export function RolePicker({ onPick }: { onPick: (role: Role) => void }) {
  const { t } = useTranslation("auth")
  return (
    <section className="login-roles">
      <div>
        <strong>{t("chooseRole")}</strong>
        <span>{t("chooseRoleHint")}</span>
      </div>
      <div className="role-card-grid">
        {ROLES.map((role) => (
          <button key={role} onClick={() => onPick(role)}>
            <span>
              <Icon name={roleIcon[role]} size={19} />
            </span>
            <div>
              <strong>{t(`roles.${role}.label`)}</strong>
              <small>{t(`roles.${role}.person`)}</small>
              <em>{t(`roles.${role}.area`)}</em>
            </div>
            <Icon name="chevron" size={15} />
          </button>
        ))}
      </div>
    </section>
  )
}
