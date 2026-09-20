import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { getSettingsOrDefaults } from "./settings";
import { resolveActingUser } from "./impersonation";

const courtValidator = v.object({
  name: v.string(),
  pricePerHour: v.number(),
  operatingHours: v.object({ open: v.string(), close: v.string() }),
});

async function requireVenueOwner(ctx: QueryCtx | MutationCtx, asUserId: Id<"users"> | undefined, action: string) {
  return resolveActingUser(ctx, "venueOwner", asUserId, action);
}

function validateText(value: string, field: string) {
  if (!value.trim()) throw new Error(`${field} is required`);
}

export const createVenueWithCourts = mutation({
  args: {
    name: v.string(),
    address: v.string(),
    description: v.string(),
    photos: v.array(v.string()),
    courts: v.array(courtValidator),
    city: v.string(),
    asUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const ownerId = await requireVenueOwner(ctx, args.asUserId, "createVenueWithCourts");
    validateText(args.name, "Venue name");
    validateText(args.address, "Address");
    validateText(args.city, "City");
    const settings = await getSettingsOrDefaults(ctx);
    const city = args.city.trim();
    if (settings.supportedCities.length > 0 && !settings.supportedCities.includes(city)) throw new Error("City is not currently supported");
    if (args.courts.length < 1) throw new Error("At least one court is required");
    for (const court of args.courts) {
      validateText(court.name, "Court name");
      if (!Number.isFinite(court.pricePerHour) || court.pricePerHour <= 0) throw new Error("Court price must be greater than zero");
      validateText(court.operatingHours.open, "Opening time");
      validateText(court.operatingHours.close, "Closing time");
    }
    const venueId = await ctx.db.insert("venues", {
      ownerId,
      name: args.name.trim(),
      address: args.address.trim(),
      description: args.description.trim(),
      photos: args.photos,
      approvalStatus: "pending",
      city,
    });
    for (const court of args.courts) await ctx.db.insert("courts", { venueId, ...court });
    return venueId;
  },
});

export const listMyVenues = query({
  args: { asUserId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const ownerId = await requireVenueOwner(ctx, args.asUserId, "listMyVenues");
    const venues = await ctx.db.query("venues").withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId)).collect();
    return await Promise.all(venues.map(async (venue) => ({
      ...venue,
      courts: await ctx.db.query("courts").withIndex("by_venueId", (q) => q.eq("venueId", venue._id)).collect(),
    })));
  },
});

export const getMyVenue = query({
  args: { venueId: v.id("venues"), asUserId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const ownerId = await requireVenueOwner(ctx, args.asUserId, "getMyVenue");
    const venue = await ctx.db.get(args.venueId);
    if (!venue || venue.ownerId !== ownerId) throw new Error("Venue does not belong to the current owner");
    return venue;
  },
});

async function requireOwnedCourt(ctx: QueryCtx | MutationCtx, courtId: Id<"courts">, asUserId: Id<"users"> | undefined, action: string) {
  const ownerId = await requireVenueOwner(ctx, asUserId, action);
  const court = await ctx.db.get(courtId);
  if (!court) throw new Error("Court not found");
  const venue = await ctx.db.get(court.venueId);
  if (!venue || venue.ownerId !== ownerId) throw new Error("Court does not belong to the current owner");
  return court;
}

export const createCourtBlock = mutation({
  args: { courtId: v.id("courts"), startTime: v.number(), endTime: v.number(), reason: v.optional(v.string()), asUserId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    await requireOwnedCourt(ctx, args.courtId, args.asUserId, "createCourtBlock");
    if (args.endTime <= args.startTime) throw new Error("Block end time must be after start time");
    const booking = await ctx.db.query("bookings").withIndex("by_court_and_start", (q) => q.eq("courtId", args.courtId)).filter((q) => q.and(q.eq(q.field("status"), "confirmed"), q.lt(q.field("startTime"), args.endTime), q.gt(q.field("endTime"), args.startTime))).first();
    if (booking) throw new Error("Cannot block a slot with an existing confirmed booking");
    return await ctx.db.insert("courtBlocks", { courtId: args.courtId, startTime: args.startTime, endTime: args.endTime, reason: args.reason?.trim() || undefined });
  },
});

export const removeCourtBlock = mutation({
  args: { blockId: v.id("courtBlocks"), asUserId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const block = await ctx.db.get(args.blockId);
    if (!block) throw new Error("Court block not found");
    await requireOwnedCourt(ctx, block.courtId, args.asUserId, "removeCourtBlock");
    await ctx.db.delete(args.blockId);
  },
});

export const listBlocksForMyVenues = query({
  args: { asUserId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const ownerId = await requireVenueOwner(ctx, args.asUserId, "listBlocksForMyVenues");
    const venues = await ctx.db.query("venues").withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId)).collect();
    const blocks = [];
    for (const venue of venues) {
      const courts = await ctx.db.query("courts").withIndex("by_venueId", (q) => q.eq("venueId", venue._id)).collect();
      for (const court of courts) {
        const courtBlocks = await ctx.db.query("courtBlocks").withIndex("by_court_and_start", (q) => q.eq("courtId", court._id)).collect();
        blocks.push(...courtBlocks.map((block) => ({ ...block, courtName: court.name, venueName: venue.name })));
      }
    }
    return blocks.sort((a, b) => a.startTime - b.startTime);
  },
});

export const listApprovedVenues = query({
  args: {},
  handler: async (ctx) => {
    const venues = (await ctx.db.query("venues").withIndex("by_approvalStatus", (q) => q.eq("approvalStatus", "approved")).collect()).filter((venue) => venue.suspended !== true);
    return await Promise.all(venues.map(async (venue) => {
      const courts = await ctx.db.query("courts").withIndex("by_venueId", (q) => q.eq("venueId", venue._id)).collect();
      const prices = courts.map((court) => court.pricePerHour);
      return {
        ...venue,
        courtCount: courts.length,
        lowestPrice: prices.length ? Math.min(...prices) : null,
        highestPrice: prices.length ? Math.max(...prices) : null,
      };
    }));
  },
});

export const getApprovedVenue = query({
  args: { venueId: v.id("venues") },
  handler: async (ctx, args) => {
    const venue = await ctx.db.get(args.venueId);
    if (!venue || venue.approvalStatus !== "approved" || venue.suspended === true) return null;
    const courts = await ctx.db.query("courts").withIndex("by_venueId", (q) => q.eq("venueId", args.venueId)).collect();
    return { ...venue, courts };
  },
});
