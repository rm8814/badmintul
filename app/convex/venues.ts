import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

const courtValidator = v.object({
  name: v.string(),
  pricePerHour: v.number(),
  operatingHours: v.object({ open: v.string(), close: v.string() }),
});

async function requireVenueOwner(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Authentication required");
  const user = await ctx.db.get(userId);
  if (!user || user.role !== "venueOwner") throw new Error("Venue owner role required");
  return userId;
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
  },
  handler: async (ctx, args) => {
    const ownerId = await requireVenueOwner(ctx);
    validateText(args.name, "Venue name");
    validateText(args.address, "Address");
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
    });
    for (const court of args.courts) await ctx.db.insert("courts", { venueId, ...court });
    return venueId;
  },
});

export const listMyVenues = query({
  args: {},
  handler: async (ctx) => {
    const ownerId = await requireVenueOwner(ctx);
    return await ctx.db.query("venues").withIndex("by_ownerId", (q) => q.eq("ownerId", ownerId)).collect();
  },
});

export const getMyVenue = query({
  args: { venueId: v.id("venues") },
  handler: async (ctx, args) => {
    const ownerId = await requireVenueOwner(ctx);
    const venue = await ctx.db.get(args.venueId);
    if (!venue || venue.ownerId !== ownerId) throw new Error("Venue does not belong to the current owner");
    return venue;
  },
});

export const listApprovedVenues = query({
  args: {},
  handler: async (ctx) => await ctx.db.query("venues").withIndex("by_approvalStatus", (q) => q.eq("approvalStatus", "approved")).collect(),
});

export const getApprovedVenue = query({
  args: { venueId: v.id("venues") },
  handler: async (ctx, args) => {
    const venue = await ctx.db.get(args.venueId);
    if (!venue || venue.approvalStatus !== "approved") return null;
    const courts = await ctx.db.query("courts").withIndex("by_venueId", (q) => q.eq("venueId", args.venueId)).collect();
    return { ...venue, courts };
  },
});
