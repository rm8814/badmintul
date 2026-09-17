import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

async function requireSuperadmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Authentication required");
  const user = await ctx.db.get(userId);
  if (!user || user.role !== "superadmin") throw new Error("Superadmin role required");
}

export const listPendingVenues = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperadmin(ctx);
    return await ctx.db.query("venues").withIndex("by_approvalStatus", (q) => q.eq("approvalStatus", "pending")).collect();
  },
});

export const setVenueApproval = mutation({
  args: { venueId: v.id("venues"), status: v.union(v.literal("approved"), v.literal("rejected")) },
  handler: async (ctx, args) => {
    await requireSuperadmin(ctx);
    const venue = await ctx.db.get(args.venueId);
    if (!venue) throw new Error("Venue not found");
    await ctx.db.patch(args.venueId, { approvalStatus: args.status });
  },
});

export const getMetrics = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperadmin(ctx);
    const [venues, bookings, players] = await Promise.all([
      ctx.db.query("venues").collect(),
      ctx.db.query("bookings").collect(),
      ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "player")).collect(),
    ]);
    return {
      venues: {
        pending: venues.filter((venue) => venue.approvalStatus === "pending").length,
        approved: venues.filter((venue) => venue.approvalStatus === "approved").length,
        rejected: venues.filter((venue) => venue.approvalStatus === "rejected").length,
      },
      bookings: bookings.length,
      players: players.length,
    };
  },
});

/** CLI-only bootstrap operation; this is intentionally not a public mutation. */
export const promoteUserToSuperadmin = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (!email) throw new Error("Email is required");
    const user = (await ctx.db.query("users").collect()).find((candidate) => candidate.email.toLowerCase() === email);
    if (!user) throw new Error(`No user found for ${email}`);
    await ctx.db.patch(user._id, { role: "superadmin" });
    return user._id;
  },
});
