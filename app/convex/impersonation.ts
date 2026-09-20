import type { MutationCtx, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

const roleLabels = { player: "Player", venueOwner: "Venue owner" } as const;

/**
 * Resolves the user id a player/venue-owner-scoped function should act as.
 * With no `asUserId`, behavior is identical to the caller acting as themselves.
 * With `asUserId`, only a non-suspended superadmin may impersonate a non-suspended
 * user who actually holds `role` — every impersonated call is logged.
 */
export async function resolveActingUser(
  ctx: QueryCtx | MutationCtx,
  role: "player" | "venueOwner",
  asUserId: Id<"users"> | undefined,
  action: string,
) {
  const callerId = await getAuthUserId(ctx);
  if (!callerId) throw new Error("Authentication required");
  const caller = await ctx.db.get(callerId);
  if (!caller) throw new Error("Authentication required");

  if (asUserId === undefined) {
    if (caller.role !== role) throw new Error(`${roleLabels[role]} role required`);
    if (caller.suspended === true) throw new Error("User account is suspended");
    return callerId;
  }

  if (caller.role !== "superadmin") throw new Error("Only superadmins can act on behalf of another user");
  if (caller.suspended === true) throw new Error("User account is suspended");
  const target = await ctx.db.get(asUserId);
  if (!target || target.role !== role) throw new Error(`Target user is not a ${roleLabels[role].toLowerCase()}`);
  if (target.suspended === true) throw new Error("Cannot impersonate a suspended account");
  if ("insert" in ctx.db) {
    await ctx.db.insert("impersonationLogs", { actorId: callerId, targetUserId: asUserId, action, createdAt: Date.now() });
  }
  return asUserId;
}
