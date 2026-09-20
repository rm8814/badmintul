import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { getSettingsOrDefaults } from "./settings";

export const getCourtAvailability = query({
  args: { courtId: v.id("courts"), dayStart: v.number(), dayEnd: v.number() },
  handler: async (ctx, args) => {
    if (args.dayEnd <= args.dayStart) throw new Error("Invalid date range");
    return await ctx.db.query("bookings").withIndex("by_court_and_start", (q) => q.eq("courtId", args.courtId).gte("startTime", args.dayStart).lt("startTime", args.dayEnd)).filter((q) => q.eq(q.field("status"), "confirmed")).collect();
  },
});

export const getCourtBlocks = query({
  args: { courtId: v.id("courts"), dayStart: v.number(), dayEnd: v.number() },
  handler: async (ctx, args) => {
    if (args.dayEnd <= args.dayStart) throw new Error("Invalid date range");
    return await ctx.db.query("courtBlocks").withIndex("by_court_and_start", (q) => q.eq("courtId", args.courtId).gte("startTime", args.dayStart).lt("startTime", args.dayEnd)).collect();
  },
});

async function requirePlayer(ctx: QueryCtx | MutationCtx) {
  const playerId = await getAuthUserId(ctx);
  if (!playerId) throw new Error("Authentication required");
  const user = await ctx.db.get(playerId);
  if (!user || user.role !== "player") throw new Error("Player role required");
  if (user.suspended === true) throw new Error("User account is suspended");
  return playerId;
}

async function requireVenueOwner(ctx: QueryCtx | MutationCtx) {
  const ownerId = await getAuthUserId(ctx);
  if (!ownerId) throw new Error("Authentication required");
  const user = await ctx.db.get(ownerId);
  if (!user || user.role !== "venueOwner") throw new Error("Venue owner role required");
  if (user.suspended === true) throw new Error("User account is suspended");
  return ownerId;
}

async function getOwnedVenueCourts(ctx: QueryCtx | MutationCtx, ownerId: Awaited<ReturnType<typeof requireVenueOwner>>) {
  const venues = await ctx.db.query("venues").withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId)).collect();
  const courts = [];
  for (const venue of venues) {
    const venueCourts = await ctx.db.query("courts").withIndex("by_venueId", (q) => q.eq("venueId", venue._id)).collect();
    for (const court of venueCourts) courts.push({ venue, court });
  }
  return courts;
}

export const listBookingsForMyVenues = query({
  args: {},
  handler: async (ctx) => {
    const ownerId = await requireVenueOwner(ctx);
    const ownedCourts = await getOwnedVenueCourts(ctx, ownerId);
    const result = [];
    for (const { venue, court } of ownedCourts) {
      const bookings = await ctx.db.query("bookings").withIndex("by_court_and_start", (q) => q.eq("courtId", court._id)).order("desc").collect();
      for (const booking of bookings) result.push({ ...booking, venueName: venue.name, courtName: court.name });
    }
    return result.sort((a, b) => b.startTime - a.startTime);
  },
});

export const getMyVenueStats = query({
  args: {},
  handler: async (ctx) => {
    const ownerId = await requireVenueOwner(ctx);
    const ownedCourts = await getOwnedVenueCourts(ctx, ownerId);
    const byVenue = new Map<string, { venueId: typeof ownedCourts[number]["venue"]["_id"]; venueName: string; revenue: number; bookedHours: number; openHours: number }>();
    const windowStart = Date.now() - 7 * 86400000;
    const windowEnd = Date.now() + 86400000;
    for (const { venue, court } of ownedCourts) {
      const current = byVenue.get(venue._id) ?? { venueId: venue._id, venueName: venue.name, revenue: 0, bookedHours: 0, openHours: 0 };
      const [openHour, openMinute] = court.operatingHours.open.split(":").map(Number);
      const [closeHour, closeMinute] = court.operatingHours.close.split(":").map(Number);
      current.openHours += Math.max(0, closeHour + closeMinute / 60 - (openHour + openMinute / 60)) * 7;
      const bookings = await ctx.db.query("bookings").withIndex("by_court_and_start", (q) => q.eq("courtId", court._id)).filter((q) => q.eq(q.field("status"), "confirmed")).collect();
      for (const booking of bookings) {
        current.revenue += court.pricePerHour;
        if (booking.startTime < windowEnd && booking.endTime > windowStart) current.bookedHours += (Math.min(booking.endTime, windowEnd) - Math.max(booking.startTime, windowStart)) / 3600000;
      }
      byVenue.set(venue._id, current);
    }
    return [...byVenue.values()].map((stats) => ({ ...stats, utilization: stats.openHours ? stats.bookedHours / stats.openHours : 0 }));
  },
});

export const createBooking = mutation({
  args: { courtId: v.id("courts"), startTime: v.number(), endTime: v.number() },
  handler: async (ctx, args) => {
    const playerId = await requirePlayer(ctx);
    if (args.endTime <= args.startTime) throw new Error("Booking end time must be after start time");
    const settings = await getSettingsOrDefaults(ctx);
    const maxStart = Date.now() + settings.bookingLeadTimeDays * 86400000;
    if (args.startTime > maxStart) throw new Error(`Bookings can only be made up to ${settings.bookingLeadTimeDays} day(s) in advance`);
    const court = await ctx.db.get(args.courtId);
    if (!court) throw new Error("Court not found");
    const conflicts = await ctx.db.query("bookings").withIndex("by_court_and_start", (q) => q.eq("courtId", args.courtId)).filter((q) => q.and(q.eq(q.field("status"), "confirmed"), q.lt(q.field("startTime"), args.endTime), q.gt(q.field("endTime"), args.startTime))).first();
    if (conflicts) throw new Error("This slot is no longer available");
    const blocked = await ctx.db.query("courtBlocks").withIndex("by_court_and_start", (q) => q.eq("courtId", args.courtId)).filter((q) => q.and(q.lt(q.field("startTime"), args.endTime), q.gt(q.field("endTime"), args.startTime))).first();
    if (blocked) throw new Error("This slot is blocked by the venue");
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

export const cancelBooking = mutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const playerId = await requirePlayer(ctx);
    const booking = await ctx.db.get(args.bookingId);
    if (!booking || booking.playerId !== playerId) throw new Error("Booking does not belong to the current player");
    if (booking.status !== "confirmed") throw new Error("Booking is already cancelled");
    const settings = await getSettingsOrDefaults(ctx);
    const cancellationWindowMs = settings.cancellationWindowHours * 3600000;
    if (booking.startTime - Date.now() < cancellationWindowMs) throw new Error(`Bookings can only be cancelled at least ${settings.cancellationWindowHours} hours before start time`);
    await ctx.db.patch(args.bookingId, { status: "cancelled" });
  },
});
