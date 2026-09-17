import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const getCourtAvailability = query({
  args: { courtId: v.id("courts"), dayStart: v.number(), dayEnd: v.number() },
  handler: async (ctx, args) => {
    if (args.dayEnd <= args.dayStart) throw new Error("Invalid date range");
    return await ctx.db.query("bookings").withIndex("by_court_and_start", (q) => q.eq("courtId", args.courtId).gte("startTime", args.dayStart).lt("startTime", args.dayEnd)).filter((q) => q.eq(q.field("status"), "confirmed")).collect();
  },
});

async function requirePlayer(ctx: QueryCtx | MutationCtx) {
  const playerId = await getAuthUserId(ctx);
  if (!playerId) throw new Error("Authentication required");
  const user = await ctx.db.get(playerId);
  if (!user || user.role !== "player") throw new Error("Player role required");
  return playerId;
}

export const createBooking = mutation({
  args: { courtId: v.id("courts"), startTime: v.number(), endTime: v.number() },
  handler: async (ctx, args) => {
    const playerId = await requirePlayer(ctx);
    if (args.endTime <= args.startTime) throw new Error("Booking end time must be after start time");
    const court = await ctx.db.get(args.courtId);
    if (!court) throw new Error("Court not found");
    const conflicts = await ctx.db.query("bookings").withIndex("by_court_and_start", (q) => q.eq("courtId", args.courtId)).filter((q) => q.and(q.eq(q.field("status"), "confirmed"), q.lt(q.field("startTime"), args.endTime), q.gt(q.field("endTime"), args.startTime))).first();
    if (conflicts) throw new Error("This slot is no longer available");
    return await ctx.db.insert("bookings", { courtId: args.courtId, playerId, startTime: args.startTime, endTime: args.endTime, status: "confirmed" });
  },
});

export const listMyBookings = query({
  args: {},
  handler: async (ctx) => {
    const playerId = await requirePlayer(ctx);
    return await ctx.db.query("bookings").withIndex("by_court_and_start").filter((q) => q.eq(q.field("playerId"), playerId)).order("desc").collect();
  },
});

const CANCELLATION_WINDOW_MS = 2 * 60 * 60 * 1000;

export const cancelBooking = mutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const playerId = await requirePlayer(ctx);
    const booking = await ctx.db.get(args.bookingId);
    if (!booking || booking.playerId !== playerId) throw new Error("Booking does not belong to the current player");
    if (booking.status !== "confirmed") throw new Error("Booking is already cancelled");
    if (booking.startTime - Date.now() < CANCELLATION_WINDOW_MS) throw new Error("Bookings can only be cancelled at least 2 hours before start time");
    await ctx.db.patch(args.bookingId, { status: "cancelled" });
  },
});
