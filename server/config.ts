// Runtime configuration, read once from the environment (.env via --env-file).

export const config = {
  port: Number(process.env.API_PORT ?? 4000),
  /** When true the OTP is returned by the API (no SMS gateway). */
  otpDevMode: process.env.OTP_DEV_MODE !== "false",
  otpTtlMinutes: 5,
  otpMaxAttempts: 5,
  otpRequestsPer15Min: 5,
  sessionHours: 12,
  jsonLimit: "1mb",
  db: {
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "lakhpati_didi",
  },
} as const
