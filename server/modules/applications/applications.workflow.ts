// Application actions: one entry per action with its input schema, the
// statuses it is allowed from, and what it changes. Adding an action means
// adding an entry here — routes and transactions are generic.
import { z } from "zod"

import type { Db } from "../../db/pool.ts"
import { badRequest, conflict } from "../../shared/errors.ts"
import { inr } from "../../shared/format.ts"
import { msg } from "../../shared/i18n.ts"
import type { Row } from "../../shared/types.ts"
import { isoDate, text } from "../../shared/validation.ts"
import {
  isApplicationEvent,
  notifyApplication,
} from "../notifications/notifications.applications.ts"
import {
  type ApplicationStatus,
  escalationHi,
  type EscalationLevel,
  nextEscalation,
  OPEN_STATUSES,
  statusHi,
} from "./applications.labels.ts"
import { insertComment, insertEvent, updateApplication } from "./applications.repository.ts"

type Context = { application: Row; actorId: number; db: Db }

type Action<S extends z.ZodType> = {
  schema: S
  /** Statuses the action may run from (undefined = any). */
  from?: ApplicationStatus[]
  fromError?: string
  run: (input: z.infer<S>, ctx: Context) => Promise<string>
}

const define = <S extends z.ZodType>(action: Action<S>) => action
const none = z.object({})

/** Records the event; `to` also updates the status. */
async function record(
  ctx: Context,
  type: string,
  note: string | null,
  to?: ApplicationStatus,
  fields: Record<string, unknown> = {},
) {
  const { application, actorId, db } = ctx
  if (to || Object.keys(fields).length) {
    await updateApplication(application.id, { ...(to ? { status: to } : {}), ...fields }, db)
  }
  await insertEvent(
    {
      applicationId: application.id,
      type,
      fromStatus: to ? application.status : null,
      toStatus: to ?? null,
      note,
      actorId,
    },
    db,
  )
  // Same transaction: the notice exists only if the change commits.
  if (isApplicationEvent(type)) await notifyApplication(application.id, type, { actorId, note }, db)
}

const amount = z
  .union([z.string(), z.number()], { error: () => msg("स्वीकृत राशि दर्ज करें") })
  .transform((v) => Number(String(v).replace(/[^\d.]/g, "")))
  .pipe(z.number().positive({ error: () => msg("स्वीकृत राशि दर्ज करें") }))

const coordinate = z.coerce.number().finite().nullable().catch(null)

export const actions = {
  accept: define({
    schema: none,
    from: OPEN_STATUSES,
    run: async (_input, ctx) => {
      await record(ctx, "accepted", "विभाग द्वारा स्वीकार", "under_review")
      return msg("आवेदन स्वीकार किया गया")
    },
  }),

  info: define({
    schema: z.object({ message: text("संदेश") }),
    from: OPEN_STATUSES,
    run: async ({ message }, ctx) => {
      await record(ctx, "info_requested", message, "info_requested")
      await insertComment(ctx.application.id, ctx.actorId, message, ctx.db)
      return msg("जानकारी अनुरोध CRP को भेजा गया")
    },
  }),

  sanction: define({
    schema: z.object({ orderNo: text("आदेश सं.", 60), date: isoDate("स्वीकृति दिनांक"), amount }),
    from: OPEN_STATUSES,
    run: async ({ orderNo, date, amount }, ctx) => {
      const cost = Number(ctx.application.project_cost)
      if (amount > cost)
        throw badRequest(
          msg("स्वीकृत राशि परियोजना लागत {{cost}} से अधिक नहीं हो सकती", { cost: inr(cost) }),
        )
      await record(ctx, "sanctioned", `आदेश सं. ${orderNo} • ${inr(amount)}`, "sanctioned", {
        sanction_order_no: orderNo,
        sanction_date: date,
        sanctioned_amount: amount,
      })
      return msg("स्वीकृति आदेश दर्ज हुआ")
    },
  }),

  reject: define({
    schema: z.object({ reason: text("कारण", 120), note: z.string().trim().catch("") }),
    from: OPEN_STATUSES,
    run: async ({ reason, note }, ctx) => {
      await record(ctx, "rejected", note ? `${reason} — ${note}` : reason, "rejected", {
        rejection_reason: reason,
      })
      return msg("आवेदन अस्वीकृत किया गया")
    },
  }),

  deliver: define({
    schema: z.object({
      date: isoDate("डिलीवरी दिनांक"),
      asset: text("परिसंपत्ति विवरण", 255),
      lat: coordinate,
      lng: coordinate,
    }),
    from: ["sanctioned"],
    fromError: "डिलीवरी से पहले आवेदन स्वीकृत होना चाहिए",
    run: async ({ date, asset, lat, lng }, ctx) => {
      await record(ctx, "delivered", asset, "delivered", {
        delivered_on: date,
        asset_description: asset,
        geo_lat: lat,
        geo_lng: lng,
      })
      return msg("डिलीवरी दर्ज हुई")
    },
  }),

  follow_up: define({
    schema: none,
    run: async (_input, ctx) => {
      await record(ctx, "follow_up", "विभाग अधिकारी को फॉलो-अप भेजा गया")
      return msg("विभाग अधिकारी को फॉलो-अप भेजा गया")
    },
  }),

  escalate: define({
    schema: none,
    from: OPEN_STATUSES,
    run: async (_input, ctx) => {
      const level = nextEscalation[ctx.application.escalation_level as EscalationLevel]
      await record(ctx, "escalated", `${escalationHi[level]} स्तर पर एस्केलेट`, undefined, {
        escalation_level: level,
      })
      return msg("आवेदन {{level}} स्तर पर एस्केलेट किया गया", { level: msg(escalationHi[level]) })
    },
  }),
}

export type ActionName = keyof typeof actions

export const isActionName = (value: unknown): value is ActionName =>
  typeof value === "string" && value in actions

/** Throws 409 when the action isn't allowed from the application's status. */
export function assertAllowed(name: ActionName, status: ApplicationStatus) {
  const action: Action<z.ZodType> = actions[name]
  if (action.from && !action.from.includes(status)) {
    throw conflict(
      action.fromError
        ? msg(action.fromError)
        : msg('आवेदन पहले से "{{status}}" है', { status: msg(statusHi[status]) }),
    )
  }
}
