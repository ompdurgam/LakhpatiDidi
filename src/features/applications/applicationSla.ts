import type { ApplicationDetail } from "@/api/types"
import type { IconName } from "@/components/ui/Icon"
import { translate as tr } from "@/i18n/tr"

import { OPEN_STATUSES } from "./applicationStatus"

export type SlaBanner = { tone: "overdue" | "due"; icon: IconName; title: string; sub: string }

/** The coloured strip at the top of the application drawer (call during render). */
export function slaBanner(detail: ApplicationDetail): SlaBanner {
  if (detail.overdue) {
    const escalation = detail.escalation
      ? tr(" – {{level}} स्तर एस्केलेशन", { level: tr(detail.escalation) })
      : ""
    return {
      tone: "overdue",
      icon: "alert",
      title: tr("अतिदेय {{n}} दिन", { n: Math.abs(detail.daysToSla) }) + escalation,
      sub: tr("SLA अंतिम तिथि {{date}} बीत चुकी", { date: detail.slaDue }),
    }
  }
  if (OPEN_STATUSES.includes(detail.statusCode)) {
    return {
      tone: "due",
      icon: "clock",
      title: tr("स्वीकृति देय: {{n}} दिन", { n: detail.daysToSla }),
      sub: tr("SLA अंतिम तिथि {{date}}", { date: detail.slaDue }),
    }
  }
  if (detail.statusCode === "rejected") {
    return {
      tone: "overdue",
      icon: "close",
      title: tr("आवेदन अस्वीकृत"),
      sub: detail.rejectionReason ?? "",
    }
  }
  if (detail.statusCode === "delivered") {
    return {
      tone: "due",
      icon: "check",
      title: tr("डिलीवर • {{date}}", { date: detail.delivery?.date ?? "" }),
      sub: detail.delivery?.asset ?? "",
    }
  }
  return {
    tone: "due",
    icon: "check",
    title: tr("स्वीकृत • आदेश सं. {{no}}", { no: detail.sanction?.orderNo ?? "" }),
    sub: `${detail.sanction?.date ?? ""} • ${detail.sanction?.amount ?? ""}`,
  }
}
