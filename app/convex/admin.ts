import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

async function requireSuperadmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Authentication required");
  const user = await ctx.db.get(userId);
  if (!user || user.role !== "superadmin") throw new Error("Superadmin role required");
  if (user.suspended === true) throw new Error("User account is suspended");
  return userId;
}

export const listPendingVenues = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperadmin(ctx);
    return await ctx.db.query("venues").withIndex("by_approvalStatus", (q) => q.eq("approvalStatus", "pending")).collect();
  },
});

export const listAllVenues = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperadmin(ctx);
    return await ctx.db.query("venues").collect();
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperadmin(ctx);
    const users = await ctx.db.query("users").collect();
    return users.map((user) => ({ _id: user._id, email: user.email, role: user.role, suspended: user.suspended === true }));
  },
});

export const listImpersonatableUsers = query({
  args: { role: v.union(v.literal("player"), v.literal("venueOwner")) },
  handler: async (ctx, args) => {
    await requireSuperadmin(ctx);
    const users = await ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", args.role)).collect();
    return users.filter((user) => user.suspended !== true).map((user) => ({ _id: user._id, email: user.email }));
  },
});

export const listAllBookings = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperadmin(ctx);
    const bookings = await ctx.db.query("bookings").collect();
    const courts = new Map((await ctx.db.query("courts").collect()).map((court) => [court._id, court]));
    const venues = new Map((await ctx.db.query("venues").collect()).map((venue) => [venue._id, venue]));
    const users = new Map((await ctx.db.query("users").collect()).map((user) => [user._id, user]));
    return bookings.map((booking) => {
      const court = courts.get(booking.courtId);
      const venue = court ? venues.get(court.venueId) : undefined;
      const player = users.get(booking.playerId);
      return {
        _id: booking._id,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        courtName: court?.name ?? "Unknown court",
        venueName: venue?.name ?? "Unknown venue",
        playerEmail: player?.email ?? "Unknown player",
      };
    });
  },
});

export const listImpersonationLogs = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperadmin(ctx);
    const logs = await ctx.db.query("impersonationLogs").order("desc").collect();
    const users = new Map((await ctx.db.query("users").collect()).map((user) => [user._id, user]));
    return logs.map((log) => ({
      _id: log._id,
      createdAt: log.createdAt,
      action: log.action,
      actorEmail: users.get(log.actorId)?.email ?? "Unknown superadmin",
      targetEmail: users.get(log.targetUserId)?.email ?? "Unknown user",
    }));
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

export const setVenueSuspended = mutation({
  args: { venueId: v.id("venues"), suspended: v.boolean() },
  handler: async (ctx, args) => {
    await requireSuperadmin(ctx);
    const venue = await ctx.db.get(args.venueId);
    if (!venue) throw new Error("Venue not found");
    await ctx.db.patch(args.venueId, { suspended: args.suspended });
  },
});

export const setUserSuspended = mutation({
  args: { userId: v.id("users"), suspended: v.boolean() },
  handler: async (ctx, args) => {
    const callerId = await requireSuperadmin(ctx);
    if (args.userId === callerId && args.suspended === true) throw new Error("Superadmins cannot suspend their own account");
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    await ctx.db.patch(args.userId, { suspended: args.suspended });
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
