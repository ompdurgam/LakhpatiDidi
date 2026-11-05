import { useTranslation } from "react-i18next"
import { Navigate, useNavigate } from "react-router"

import { roleHome } from "@/app/navigation"
import { Icon } from "@/components/ui/Icon"
import { LanguageToggle } from "@/components/ui/LanguageToggle"
import { useSession } from "@/stores/session"

import { LoginBrandPanel } from "./LoginBrandPanel"
import { RolePicker } from "./RolePicker"
import { useOtpLogin } from "./useOtpLogin"

export function LoginScreen() {
  const { t } = useTranslation("auth")
  const navigate = useNavigate()
  const token = useSession((s) => s.token)
  const role = useSession((s) => s.role)
  const signIn = useSession((s) => s.signIn)
  const login = useOtpLogin()
  const verified = Boolean(login.auth)

  if (token) return <Navigate to={roleHome(role)} replace />

  return (
    <div className="login-screen">
      <LoginBrandPanel />
      <main className="login-card">
        <div className="login-card-head">
          <div>
            <span className="eyebrow">{t("card.eyebrow")}</span>
            <h2>{t("card.title")}</h2>
            <p>{t("card.subtitle")}</p>
          </div>
          <LanguageToggle />
        </div>
        <label className="login-mobile">
          <span>{t("mobile")}</span>
          <div>
            <b>+91</b>
            <input
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel-national"
              value={login.mobile}
              onChange={(event) => login.setMobile(event.target.value)}
            />
          </div>
        </label>
        <button
          className="primary send-otp"
          disabled={login.mobile.length !== 10 || login.busy}
          onClick={login.sendOtp}
        >
          {login.otpSent ? t("otpSent") : t("sendOtp")}
          <Icon name="arrow" size={16} />
        </button>
        {login.otpSent && (
          <section className="login-otp">
            <div>
              <strong>{t("enterOtp")}</strong>
              <span>+91 {login.maskedMobile}</span>
            </div>
            <div className="otp-boxes">
              {login.otp.map((digit, index) => (
                <input
                  key={index}
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={digit}
                  disabled={login.busy || verified}
                  aria-label={t("otpDigit", { n: index + 1 })}
                  onChange={(event) => login.updateOtp(index, event.target.value)}
                />
              ))}
            </div>
            {login.devOtp && !verified && (
              <small className="dev-otp-hint">
                {t("demoOtp")} <b>{login.devOtp}</b>
              </small>
            )}
            <button disabled={login.timer > 0 || login.busy} onClick={login.sendOtp}>
              {login.timer > 0
                ? t("resendIn", { seconds: String(login.timer).padStart(2, "0") })
                : t("resend")}
            </button>
          </section>
        )}
        {login.error && (
          <p className="form-error" role="alert">
            {login.error}
          </p>
        )}
        {login.auth && (
          <RolePicker
            onPick={(picked) => {
              signIn(login.auth!.token, login.auth!.user, picked)
              navigate(roleHome(picked), { replace: true })
            }}
          />
        )}
        <footer>{t("footer")}</footer>
      </main>
    </div>
  )
}
