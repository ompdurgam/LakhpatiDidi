import { useEffect, useState } from "react"

import { api } from "@/api/client"
import type { User } from "@/api/types"

const EMPTY_OTP = ["", "", "", "", "", ""]

/** OTP request / verify flow against /api/auth. */
export function useOtpLogin(initialMobile = "9826143412") {
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
    if (value && index < 5) {
      document.querySelectorAll<HTMLInputElement>(".otp-boxes input")[index + 1]?.focus()
    }
    if (!next.every(Boolean)) return
    setBusy(true)
    try {
      setAuth(
        await api<{ token: string; user: User }>("/auth/verify", {
          body: { mobile, otp: next.join("") },
        }),
      )
    } catch (e) {
      setError((e as Error).message)
      setOtp(EMPTY_OTP)
    } finally {
      setBusy(false)
    }
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
  }
}
