import { query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

async function getUserOrThrow(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Authentication required");
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("Authenticated user record not found");
  return user;
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return userId ? await ctx.db.get(userId) : null;
  },
});

export const getVenueOwnerArea = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserOrThrow(ctx);
    if (user.role !== "venueOwner") throw new Error("Venue owner role required");
    return { role: user.role, message: "Venue owner access granted" };
  },
});
