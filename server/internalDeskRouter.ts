import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { TARIFF_FIELDS, type Tariff } from "../shared/internalDesk";
import { DeskError, actorFromHeader, internalDeskRuntime } from "./internalDeskStore";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

const tariffShape = Object.fromEntries(TARIFF_FIELDS.map(field => [field.key, z.number()])) as {
  [Key in keyof Tariff]: z.ZodNumber;
};

function call<T>(action: () => T) {
  try {
    return action();
  } catch (error) {
    if (error instanceof DeskError) {
      throw new TRPCError({ code: error.status === "FORBIDDEN" ? "FORBIDDEN" : "BAD_REQUEST", message: error.message });
    }
    throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "İşlem tamamlanamadı" });
  }
}

const deskProcedure = publicProcedure.use(({ ctx, next }) => {
  const actor = ctx.internalActor ?? actorFromHeader(ctx.req.headers["x-internal-desk"]);
  if (!actor) throw new TRPCError({ code: "UNAUTHORIZED", message: "İç operasyon oturumu gerekli" });
  return next({ ctx: { ...ctx, actor } });
});

const jobText = {
  product: z.string().trim().min(2).max(120),
  quantity: z.number().int().min(1).max(500),
  weightKg: z.number().min(0.1).max(50),
  note: z.string().trim().max(300).optional(),
};

export const internalDeskRouter = router({
  directory: publicProcedure.query(() => internalDeskRuntime.api.directory()),
  login: publicProcedure
    .input(z.object({ staffId: z.string().trim().min(2).max(80), pin: z.string().trim().min(4).max(6) }))
    .mutation(({ input }) => call(() => internalDeskRuntime.api.login(input.staffId, input.pin))),
  logout: publicProcedure.mutation(({ ctx }) => {
    const header = ctx.req.headers["x-internal-desk"];
    const token = Array.isArray(header) ? header[0] : header;
    return internalDeskRuntime.api.logout(token);
  }),
  home: deskProcedure.query(({ ctx }) => internalDeskRuntime.api.home(ctx.actor)),
  enterAsAdmin: protectedProcedure.mutation(({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Fiyat listesine bu hesaptan yalnız admin girer" });
    return call(() => internalDeskRuntime.api.openAdminSession());
  }),
  quote: deskProcedure
    .input(z.object({ branchId: z.string().optional(), direction: z.enum(["to_central", "from_central"]) }))
    .query(({ ctx, input }) => call(() => internalDeskRuntime.api.quote(ctx.actor, input))),
  createHubJob: deskProcedure
    .input(z.object({ branchId: z.string().optional(), direction: z.enum(["to_central", "from_central"]), ...jobText }))
    .mutation(({ ctx, input }) => call(() => internalDeskRuntime.api.createHubJob(ctx.actor, input))),
  approve: deskProcedure.input(z.object({ jobId: z.string() })).mutation(({ ctx, input }) => call(() => internalDeskRuntime.api.approve(ctx.actor, input.jobId))),
  assign: deskProcedure
    .input(z.object({ jobId: z.string(), courierId: z.string() }))
    .mutation(({ ctx, input }) => call(() => internalDeskRuntime.api.assign(ctx.actor, input.jobId, input.courierId))),
  advance: deskProcedure
    .input(z.object({ jobId: z.string(), next: z.enum(["picked_up", "delivered"]) }))
    .mutation(({ ctx, input }) => call(() => internalDeskRuntime.api.advance(ctx.actor, input.jobId, input.next))),
  cancel: deskProcedure.input(z.object({ jobId: z.string() })).mutation(({ ctx, input }) => call(() => internalDeskRuntime.api.cancel(ctx.actor, input.jobId))),
  updateTariff: deskProcedure.input(z.object(tariffShape)).mutation(({ ctx, input }) => call(() => internalDeskRuntime.api.updateTariff(ctx.actor, input))),
  updatePriceList: deskProcedure
    .input(z.object({ rows: z.array(z.object({ branchId: z.string(), chargeTl: z.number(), payoutTl: z.number() })).length(10) }))
    .mutation(({ ctx, input }) => call(() => internalDeskRuntime.api.updatePriceList(ctx.actor, input.rows))),
  priceList: deskProcedure.query(({ ctx }) => call(() => internalDeskRuntime.api.priceList(ctx.actor))),
  ledger: deskProcedure.query(({ ctx }) => call(() => internalDeskRuntime.api.ledger(ctx.actor))),
  settle: deskProcedure.input(z.object({ entryId: z.string() })).mutation(({ ctx, input }) => call(() => internalDeskRuntime.api.settle(ctx.actor, input.entryId))),
  messages: deskProcedure.input(z.object({ roomId: z.string() })).query(({ ctx, input }) => call(() => internalDeskRuntime.api.messages(ctx.actor, input.roomId))),
  postMessage: deskProcedure
    .input(z.object({ roomId: z.string(), body: z.string().trim().min(1).max(500) }))
    .mutation(({ ctx, input }) => call(() => internalDeskRuntime.api.postMessage(ctx.actor, input.roomId, input.body))),
  staffCodes: deskProcedure.query(({ ctx }) => call(() => internalDeskRuntime.api.staffCodes(ctx.actor))),
  setPin: deskProcedure
    .input(z.object({ staffId: z.string(), pin: z.string().regex(/^\d{4,6}$/) }))
    .mutation(({ ctx, input }) => call(() => internalDeskRuntime.api.setPin(ctx.actor, input.staffId, input.pin))),
});
