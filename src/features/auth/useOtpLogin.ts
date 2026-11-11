import { useEffect, useState } from "react"

import { api } from "@/api/client"
import type { User } from "@/api/types"

/** The i-th OTP input box, if it exists. */
const otpBox = (index: number) =>
  document.querySelectorAll<HTMLInputElement>(".otp-boxes input")[index]

const EMPTY_OTP = ["", "", "", "", "", ""]

/** OTP request / verify flow against /api/auth. */
export function useOtpLogin(initialMobile = "", role?: string | null) {
  const [mobile, setMobileValue] = useState(initialMobile)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState(EMPTY_OTP)
  const [timer, setTimer] = useState(30)
  const [maskedMobile, setMaskedMobile] = useState("")
  const [devOtp, setDevOtp] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [auth, setAuth] = useState<{ token: string; user: User } | null>(null)

  useEffect(() => {
    if (!otpSent || timer <= 0) return
    const interval = window.setInterval(() => setTimer((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(interval)
  }, [otpSent, timer])

  const setMobile = (value: string) => setMobileValue(value.replace(/\D/g, ""))

  const sendOtp = async () => {
    setBusy(true)
    setError("")
    try {
      const result = await api<{ maskedMobile: string; devOtp?: string }>("/auth/otp", {
        body: { mobile },
      })
      setMaskedMobile(result.maskedMobile)
      setDevOtp(result.devOtp ?? "")
      setOtp(EMPTY_OTP)
      setAuth(null)
      setOtpSent(true)
      setTimer(30)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const updateOtp = async (index: number, value: string) => {
    const next = otp.map((item, itemIndex) =>
      itemIndex === index ? value.replace(/\D/g, "").slice(-1) : item,
    )
    setOtp(next)
    setError("")
    if (value && index < 5) otpBox(index + 1)?.focus()
    // All six digits typed: verify straight away (the Login button does the same).
    if (next.every(Boolean)) await verify(next)
  }

  /** Backspace on an empty box steps back and clears the previous digit; arrows move. */
  const otpKeyDown = (index: number, key: string) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      setOtp(otp.map((digit, i) => (i === index - 1 ? "" : digit)))
      setError("")
      otpBox(index - 1)?.focus()
    } else if (key === "ArrowLeft") otpBox(index - 1)?.focus()
    else if (key === "ArrowRight") otpBox(index + 1)?.focus()
  }

  /** Pasting a code (e.g. copied from an SMS) fills the boxes from the first one. */
  const pasteOtp = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 6)
    if (!digits) return
    const next = EMPTY_OTP.map((_, i) => digits[i] ?? "")
    setOtp(next)
    setError("")
    otpBox(Math.min(digits.length, 5))?.focus()
    if (next.every(Boolean)) void verify(next)
  }

  const verify = async (digits = otp) => {
    if (!digits.every(Boolean) || busy) return
    setBusy(true)
    try {
      setAuth(
        await api<{ token: string; user: User }>("/auth/verify", {
          // The server checks the chosen role is one this account holds.
          body: { mobile, otp: digits.join(""), role: role ?? undefined },
        }),
      )
    } catch (e) {
      setError((e as Error).message)
      setOtp(EMPTY_OTP)
      // The boxes are disabled while verifying; start again from the first one.
      window.setTimeout(() => otpBox(0)?.focus(), 50)
    } finally {
      setBusy(false)
    }
  }

  /** Back to the mobile step (e.g. to correct the number). */
  const reset = () => {
    setOtpSent(false)
    setOtp(EMPTY_OTP)
    setError("")
    setAuth(null)
  }

  return {
    mobile,
    setMobile,
    otpSent,
    otp,
    timer,
    maskedMobile,
    devOtp,
    error,
    busy,
    auth,
    sendOtp,
    updateOtp,
    otpKeyDown,
    pasteOtp,
    verify,
    reset,
  }
}
