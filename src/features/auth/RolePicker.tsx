import { useTranslation } from "react-i18next"

import { Icon } from "@/components/ui/Icon"
import { type Role, ROLES } from "@/stores/session"

import { roleIcon } from "./roleIcon"

/** Step 1 of login: pick the role to sign in as. */
export function RolePicker({ onPick }: { onPick: (role: Role) => void }) {
  const { t } = useTranslation("auth")
  return (
    <div className="role-card-grid">
      {ROLES.map((role) => (
        <button key={role} type="button" onClick={() => onPick(role)}>
          <span>
            <Icon name={roleIcon[role]} size={19} />
          </span>
          <div>
            <strong>{t(`roles.${role}.label`)}</strong>
            <small>{t(`roles.${role}.area`)}</small>
          </div>
          <Icon name="chevron" size={15} />
        </button>
      ))}
    </div>
  )
}
