import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Navigate, useNavigate } from "react-router"

import { roleHome } from "@/app/navigation"
import { BrandMark } from "@/components/ui/BrandMark"
import { LanguageChooser } from "@/components/ui/LanguageChooser"
import { LanguageMenu } from "@/components/ui/LanguageMenu"
import { TextSizeControl } from "@/components/ui/TextSizeControl"
import { useIsMobile } from "@/lib/useMediaQuery"
import { isRole, type Role, useSession } from "@/stores/session"

import { LoginHero } from "./LoginHero"
import { MobileStep, OtpStep, SelectedRole } from "./LoginSteps"
import { RolePicker } from "./RolePicker"
import { useOtpLogin } from "./useOtpLogin"

const STEPS = ["role", "mobile", "otp"] as const

/**
 * Login: choose role → mobile number → OTP → into the app as that role.
 * Phones see the onboarding card first (as in the design), desktops side by side.
 */
export function LoginScreen() {
  const { t } = useTranslation("auth")
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const token = useSession((s) => s.token)
  const currentRole = useSession((s) => s.role)
  const signIn = useSession((s) => s.signIn)
  const [introDone, setIntroDone] = useState(false)
  const [role, setRole] = useState<Role | null>(null)
  const login = useOtpLogin("", role)

  // OTP verified: sign in with the chosen role and go to its home.
  useEffect(() => {
    if (!login.auth || !role) return
    // The server confirms the role (a Didi account is always a Didi).
    const effective: Role = isRole(login.auth.user.role) ? login.auth.user.role : role
    signIn(login.auth.token, login.auth.user, effective)
    navigate(roleHome(effective), { replace: true })
  }, [login.auth, role, signIn, navigate])

  if (token) return <Navigate to={roleHome(currentRole)} replace />

  const step = !role ? "role" : login.otpSent ? "otp" : "mobile"
  const pickRole = (picked: Role) => {
    setRole(picked)
  }
  const changeRole = () => {
    login.reset()
    setRole(null)
  }
  const showHero = !isMobile || !introDone

  return (
    <div className={`login-screen ${isMobile && !introDone ? "intro" : ""}`}>
      <LanguageChooser />
      {showHero && <LoginHero onContinue={() => setIntroDone(true)} />}
      {(!isMobile || introDone) && (
        <main className="login-card">
          <div className="login-tools">
            <TextSizeControl />
            <LanguageMenu />
          </div>
          <div className="login-logo">
            <BrandMark size={104} />
            <span>{t("emblem")}</span>
          </div>
          <h2 className="login-greeting">
            <span>{t("greeting")}</span>
            {t("loginNow")}
          </h2>
          <ol className="login-steps" aria-label={t("stepsLabel")}>
            {STEPS.map((name, index) => (
              <li
                key={name}
                className={
                  name === step ? "active" : index < STEPS.indexOf(step) ? "done" : undefined
                }
                aria-current={name === step ? "step" : undefined}
              >
                <i>{index + 1}</i>
                {t(`steps.${name}`)}
              </li>
            ))}
          </ol>

          {step === "role" ? (
            <>
              <p className="login-step-hint">{t("chooseRoleHint")}</p>
              <RolePicker onPick={pickRole} />
            </>
          ) : (
            <>
              <SelectedRole role={role!} onChange={changeRole} />
              {step === "mobile" ? <MobileStep login={login} /> : <OtpStep login={login} />}
            </>
          )}

          {login.error && (
            <p className="form-error" role="alert">
              {login.error}
            </p>
          )}
          <footer>{t("footer")}</footer>
        </main>
      )}
    </div>
  )
}
