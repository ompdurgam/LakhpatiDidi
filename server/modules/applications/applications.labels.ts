export type ApplicationStatus =
  "submitted" | "under_review" | "info_requested" | "sanctioned" | "rejected" | "delivered"

export type EscalationLevel = "none" | "bdo" | "dpm" | "collector"

/** Statuses in which the department can still act on an application. */
export const OPEN_STATUSES: ApplicationStatus[] = ["submitted", "under_review", "info_requested"]

export const statusHi: Record<ApplicationStatus, string> = {
  submitted: "जमा",
  under_review: "समीक्षाधीन",
  info_requested: "जानकारी चाहिए",
  sanctioned: "स्वीकृत",
  rejected: "अस्वीकृत",
  delivered: "डिलीवर",
}
export const OVERDUE_HI = "अतिदेय"

export const escalationHi: Record<EscalationLevel, string> = {
  none: "",
  bdo: "BDO",
  dpm: "DPM",
  collector: "कलेक्टर",
}

export const nextEscalation: Record<EscalationLevel, EscalationLevel> = {
  none: "bdo",
  bdo: "dpm",
  dpm: "collector",
  collector: "collector",
}
