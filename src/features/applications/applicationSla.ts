import type { ApplicationDetail } from "@/api/types"
import type { IconName } from "@/components/ui/Icon"

import { OPEN_STATUSES } from "./applicationStatus"

export type SlaBanner = { tone: "overdue" | "due"; icon: IconName; title: string; sub: string }

/** The coloured strip at the top of the application drawer. */
export function slaBanner(detail: ApplicationDetail): SlaBanner {
  if (detail.overdue) {
    const escalation = detail.escalation ? ` – ${detail.escalation} स्तर एस्केलेशन` : ""
    return {
      tone: "overdue",
      icon: "alert",
      title: `अतिदेय ${Math.abs(detail.daysToSla)} दिन${escalation}`,
      sub: `SLA अंतिम तिथि ${detail.slaDue} बीत चुकी`,
    }
  }
  if (OPEN_STATUSES.includes(detail.statusCode)) {
    return {
      tone: "due",
      icon: "clock",
      title: `स्वीकृति देय: ${detail.daysToSla} दिन`,
      sub: `SLA अंतिम तिथि ${detail.slaDue}`,
    }
  }
  if (detail.statusCode === "rejected") {
    return {
      tone: "overdue",
      icon: "close",
      title: "आवेदन अस्वीकृत",
      sub: detail.rejectionReason ?? "",
    }
  }
  if (detail.statusCode === "delivered") {
    return {
      tone: "due",
      icon: "check",
      title: `डिलीवर • ${detail.delivery?.date ?? ""}`,
      sub: detail.delivery?.asset ?? "",
    }
  }
  return {
    tone: "due",
    icon: "check",
    title: `स्वीकृत • आदेश सं. ${detail.sanction?.orderNo ?? ""}`,
    sub: `${detail.sanction?.date ?? ""} • ${detail.sanction?.amount ?? ""}`,
  }
}
