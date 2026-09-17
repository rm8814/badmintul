import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getStatus = query({
  args: {},
  handler: async (ctx) => {
    const latest = await ctx.db.query("connectionChecks").withIndex("by_updatedAt").order("desc").first();
    return latest ?? { message: "Convex connection is ready.", updatedAt: 0 };
  },
});

export const recordCheck = mutation({
  args: { message: v.string() },
  handler: async (ctx, args) => {
    const record = { message: args.message, updatedAt: Date.now() };
    await ctx.db.insert("connectionChecks", record);
    return record;
  },
});
