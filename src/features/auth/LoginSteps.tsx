import { useTranslation } from "react-i18next"

import { Icon } from "@/components/ui/Icon"
import type { Role } from "@/stores/session"

import { roleIcon } from "./roleIcon"
import type { useOtpLogin } from "./useOtpLogin"

type Login = ReturnType<typeof useOtpLogin>

/** The chosen role, with a link back to step 1. */
export function SelectedRole({ role, onChange }: { role: Role; onChange: () => void }) {
  const { t } = useTranslation("auth")
  return (
    <div className="login-selected-role">
      <span>
        <Icon name={roleIcon[role]} size={16} />
      </span>
      <div>
        <small>{t("loggingInAs")}</small>
        <strong>{t(`roles.${role}.label`)}</strong>
      </div>
      <button type="button" className="login-link" onClick={onChange}>
        {t("change")}
      </button>
    </div>
  )
}

/** Step 2: mobile number → send OTP. */
export function MobileStep({ login }: { login: Login }) {
  const { t } = useTranslation("auth")
  return (
    <form
      className="login-form"
      onSubmit={(event) => {
        event.preventDefault()
        void login.sendOtp()
      }}
    >
      <label className="login-field">
        <span>{t("mobile")}</span>
        <div>
          <b>+91</b>
          <input
            inputMode="numeric"
            maxLength={10}
            autoComplete="tel-national"
            autoFocus
            placeholder="98XXXXXXXX"
            value={login.mobile}
            onChange={(event) => login.setMobile(event.target.value)}
          />
          {login.mobile.length === 10 && <Icon name="check" size={16} />}
        </div>
        <small>{t("mobileHint")}</small>
      </label>
      <button
        type="submit"
        className="login-submit"
        disabled={login.mobile.length !== 10 || login.busy}
      >
        {t("sendOtp")} <Icon name="arrow" size={16} />
      </button>
    </form>
  )
}

/** Step 3: six OTP boxes → Login. */
export function OtpStep({ login }: { login: Login }) {
  const { t } = useTranslation("auth")
  const complete = login.otp.every(Boolean)
  return (
    <form
      className="login-form"
      onSubmit={(event) => {
        event.preventDefault()
        void login.verify()
      }}
    >
      <div className="login-otp-head">
        <strong>{t("enterOtp")}</strong>
        <span>
          {t("otpSentTo")} +91 {login.maskedMobile}{" "}
          <button type="button" className="login-link" onClick={login.reset}>
            {t("editNumber")}
          </button>
        </span>
      </div>
      <div className="otp-boxes">
        {login.otp.map((digit, index) => (
          <input
            key={index}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            autoFocus={index === 0}
            maxLength={1}
            value={digit}
            disabled={login.busy}
            aria-label={t("otpDigit", { n: index + 1 })}
            onChange={(event) => void login.updateOtp(index, event.target.value)}
          />
        ))}
      </div>
      {login.devOtp && (
        <small className="dev-otp-hint">
          {t("demoOtp")} <b>{login.devOtp}</b>
        </small>
      )}
      <button type="submit" className="login-submit" disabled={!complete || login.busy}>
        {t("login")}
      </button>
      <button
        type="button"
        className="login-link login-resend"
        disabled={login.timer > 0 || login.busy}
        onClick={() => void login.sendOtp()}
      >
        {login.timer > 0
          ? t("resendIn", { seconds: String(login.timer).padStart(2, "0") })
          : t("resend")}
      </button>
    </form>
  )
}
