import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const DEFAULT_SETTINGS = {
  cancellationWindowHours: 2,
  bookingLeadTimeDays: 3,
  supportedCities: [] as string[],
};

async function requireSuperadmin(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Authentication required");
  const user = await ctx.db.get(userId);
  if (!user || user.role !== "superadmin") throw new Error("Superadmin role required");
  if (user.suspended === true) throw new Error("User account is suspended");
  return userId;
}

/** Shared by other convex/*.ts files that need settings inside their own mutation's ctx (no separate query round-trip, keeps atomicity). */
export async function getSettingsOrDefaults(ctx: QueryCtx | MutationCtx) {
  const existing = await ctx.db.query("platformSettings").first();
  return existing ?? DEFAULT_SETTINGS;
}

export const getPlatformSettings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");
    return await getSettingsOrDefaults(ctx);
  },
});

export const updatePlatformSettings = mutation({
  args: {
    cancellationWindowHours: v.number(),
    bookingLeadTimeDays: v.number(),
    supportedCities: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireSuperadmin(ctx);
    if (!Number.isFinite(args.cancellationWindowHours) || args.cancellationWindowHours <= 0) throw new Error("Cancellation window must be greater than zero");
    if (!Number.isFinite(args.bookingLeadTimeDays) || args.bookingLeadTimeDays <= 0) throw new Error("Booking lead time must be greater than zero");
    const supportedCities = [...new Set(args.supportedCities.map((city) => city.trim()).filter(Boolean))];
    const payload = { cancellationWindowHours: args.cancellationWindowHours, bookingLeadTimeDays: args.bookingLeadTimeDays, supportedCities };
    const existing = await ctx.db.query("platformSettings").first();
    if (existing) await ctx.db.patch(existing._id, payload);
    else await ctx.db.insert("platformSettings", payload);
  },
});
