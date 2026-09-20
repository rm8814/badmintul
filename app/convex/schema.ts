import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    email: v.string(),
    image: v.optional(v.string()),
    phone: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
    emailVerificationTime: v.optional(v.number()),
    phoneVerificationTime: v.optional(v.number()),
    role: v.union(v.literal("superadmin"), v.literal("player"), v.literal("venueOwner")),
    suspended: v.optional(v.boolean()),
  }).index("email", ["email"]).index("phone", ["phone"]).index("by_role", ["role"]),
  venues: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    address: v.string(),
    description: v.string(),
    photos: v.array(v.string()),
    approvalStatus: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    suspended: v.optional(v.boolean()),
    city: v.optional(v.string()),
  }).index("by_ownerId", ["ownerId"]).index("by_approvalStatus", ["approvalStatus"]),
  courts: defineTable({
    venueId: v.id("venues"),
    name: v.string(),
    pricePerHour: v.number(),
    operatingHours: v.object({ open: v.string(), close: v.string() }),
  }).index("by_venueId", ["venueId"]),
  bookings: defineTable({
    courtId: v.id("courts"),
    playerId: v.id("users"),
    startTime: v.number(),
    endTime: v.number(),
    status: v.union(v.literal("confirmed"), v.literal("cancelled")),
  }).index("by_court_and_start", ["courtId", "startTime"]),
  courtBlocks: defineTable({
    courtId: v.id("courts"),
    startTime: v.number(),
    endTime: v.number(),
    reason: v.optional(v.string()),
  }).index("by_court_and_start", ["courtId", "startTime"]),
  connectionChecks: defineTable({ message: v.string(), updatedAt: v.number() })
    .index("by_updatedAt", ["updatedAt"]),
  platformSettings: defineTable({
    cancellationWindowHours: v.number(),
    bookingLeadTimeDays: v.number(),
    supportedCities: v.array(v.string()),
  }),
  impersonationLogs: defineTable({
    actorId: v.id("users"),
    targetUserId: v.id("users"),
    action: v.string(),
    createdAt: v.number(),
  }).index("by_actorId", ["actorId"]).index("by_targetUserId", ["targetUserId"]),
});
