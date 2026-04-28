import { z } from 'zod';

// ==================== ADMIN USER SCHEMAS ====================

export const createAdminUserSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  role: z.enum(["SUPER_ADMIN", "FINANCE_ADMIN", "SUPPORT_ADMIN", "OPERATIONS_ADMIN", "ANALYTICS_ADMIN"]),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional().default("ACTIVE"),
  enableTwoFactor: z.boolean().optional().default(false),
});

export const updateAdminUserSchema = createAdminUserSchema.partial().extend({
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

export const adminUserActionSchema = z.object({
  action: z.enum(["ACTIVATE", "SUSPEND", "DEACTIVATE"]),
  reason: z.string().optional(),
});

export const toggleTwoFactorSchema = z.object({
  enabled: z.boolean(),
});

// ==================== ROLE & PERMISSION SCHEMAS ====================

export const createRoleSchema = z.object({
  roleName: z.string().min(2, "Role name is required"),
  description: z.string().optional(),
  permissions: z.array(z.object({
    module: z.enum([
      "DASHBOARD",
      "USER_MANAGEMENT", 
      "TRIP_MANAGEMENT",
      "COURIER_MANAGEMENT",
      "CAR_RENTAL_MANAGEMENT",
      "VEHICLE_PRICING",
      "FINANCIALS",
      "PROMOTIONS",
      "ADMIN_SECURITY",
      "ACTIVITY_LOGS",
      "EMERGENCY_SAFETY",
      "SETTINGS"
    ]),
    canView: z.boolean().default(true),
    canCreate: z.boolean().default(false),
    canEdit: z.boolean().default(false),
    canDelete: z.boolean().default(false),
  })),
});

export const updateRoleSchema = createRoleSchema.partial();

export const updateRolePermissionsSchema = z.object({
  permissions: z.array(z.object({
    module: z.enum([
      "DASHBOARD",
      "USER_MANAGEMENT",
      "TRIP_MANAGEMENT", 
      "COURIER_MANAGEMENT",
      "CAR_RENTAL_MANAGEMENT",
      "VEHICLE_PRICING",
      "FINANCIALS",
      "PROMOTIONS",
      "ADMIN_SECURITY",
      "ACTIVITY_LOGS",
      "EMERGENCY_SAFETY",
      "SETTINGS"
    ]),
    canView: z.boolean(),
    canCreate: z.boolean(),
    canEdit: z.boolean(),
    canDelete: z.boolean(),
  })),
});

// ==================== ACTIVITY LOG SCHEMAS ====================

export const activityLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  adminId: z.string().uuid().optional(),
  module: z.string().optional(),
  action: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ==================== QUERY SCHEMAS ====================

export const adminUserQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "FINANCE_ADMIN", "SUPPORT_ADMIN", "OPERATIONS_ADMIN", "ANALYTICS_ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
});

export const roleQuerySchema = z.object({
  includePermissions: z.coerce.boolean().default(true),
});