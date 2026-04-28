import { Router } from 'express';
import { adminAuth } from '../../middleware/admin';
import { validate } from '../../middleware/validate';
import * as controller from './admin-roles-and-permissions.controller';
import * as dto from './admin-roles-and-permissions.dto';

const router = Router();

router.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: Admin Roles & Permissions
 *   description: |
 *     Complete admin user management with role-based access control.
 */

// ==================== STATS ====================
/**
 * @swagger
 * /api/admin/admin-roles/stats:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin Roles & Permissions]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns overview statistics including:
 *       - Total admins
 *       - Active admins
 *       - Count by role
 *       - Recent login activities
 *     responses:
 *       200:
 *         description: Admin statistics retrieved successfully
 */
router.get('/admin-roles/stats', controller.getAdminStats);

// ==================== ADMIN USERS ====================
/**
 * @swagger
 * /api/admin/admin-users:
 *   get:
 *     summary: Get all admin users with pagination and filters
 *     tags: [Admin Roles & Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by name or email
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: ["SUPER_ADMIN", "FINANCE_ADMIN", "SUPPORT_ADMIN", "OPERATIONS_ADMIN", "ANALYTICS_ADMIN"] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: ["ACTIVE", "INACTIVE", "SUSPENDED"] }
 *     responses:
 *       200:
 *         description: List of admin users with their permissions
 */
router.get('/admin-users', controller.getAdminUsers);

/**
 * @swagger
 * /api/admin/admin-users/{id}:
 *   get:
 *     summary: Get admin user by ID
 *     tags: [Admin Roles & Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Admin user details with permissions
 */
router.get('/admin-users/:id', controller.getAdminUserById);

/**
 * @swagger
 * /api/admin/admin-users:
 *   post:
 *     summary: Create a new admin user
 *     tags: [Admin Roles & Permissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, role]
 *             properties:
 *               fullName: { type: string, example: "Sarah Finance" }
 *               email: { type: string, format: email, example: "sarah.finance@spotride.com" }
 *               role: { type: string, enum: ["SUPER_ADMIN", "FINANCE_ADMIN", "SUPPORT_ADMIN", "OPERATIONS_ADMIN", "ANALYTICS_ADMIN"] }
 *               status: { type: string, enum: ["ACTIVE", "INACTIVE", "SUSPENDED"], default: "ACTIVE" }
 *               enableTwoFactor: { type: boolean, default: false }
 *     responses:
 *       201:
 *         description: Admin user created with temporary password
 */
router.post('/admin-users', validate(dto.createAdminUserSchema), controller.createAdminUser);

/**
 * @swagger
 * /api/admin/admin-users/{id}:
 *   put:
 *     summary: Update an existing admin user
 *     tags: [Admin Roles & Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: string }
 *               email: { type: string, format: email }
 *               role: { type: string, enum: ["SUPER_ADMIN", "FINANCE_ADMIN", "SUPPORT_ADMIN", "OPERATIONS_ADMIN", "ANALYTICS_ADMIN"] }
 *               status: { type: string, enum: ["ACTIVE", "INACTIVE", "SUSPENDED"] }
 *               enableTwoFactor: { type: boolean }
 *               password: { type: string, minLength: 6 }
 *     responses:
 *       200:
 *         description: Admin user updated successfully
 */
router.put('/admin-users/:id', validate(dto.updateAdminUserSchema), controller.updateAdminUser);

/**
 * @swagger
 * /api/admin/admin-users/{id}/status:
 *   patch:
 *     summary: Update admin user status (activate/suspend/deactivate)
 *     tags: [Admin Roles & Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action: { type: string, enum: ["ACTIVATE", "SUSPEND", "DEACTIVATE"] }
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Admin user status updated
 */
router.patch('/admin-users/:id/status', validate(dto.adminUserActionSchema), controller.updateAdminStatus);

/**
 * @swagger
 * /api/admin/admin-users/{id}/two-factor:
 *   patch:
 *     summary: Enable or disable two-factor authentication for admin user
 *     tags: [Admin Roles & Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [enabled]
 *             properties:
 *               enabled: { type: boolean }
 *     responses:
 *       200:
 *         description: Two-factor authentication toggled
 */
router.patch('/admin-users/:id/two-factor', validate(dto.toggleTwoFactorSchema), controller.toggleTwoFactorAuth);

// ==================== ROLES & PERMISSIONS ====================
/**
 * @swagger
 * /api/admin/admin-roles:
 *   get:
 *     summary: Get all admin roles with their permissions
 *     tags: [Admin Roles & Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includePermissions
 *         schema: { type: boolean, default: true }
 *         description: Include permission details for each role
 *     responses:
 *       200:
 *         description: List of all roles with permissions and user counts
 *         content:
 *           application/json:
 *             example:
 *               - roleName: "SUPER_ADMIN"
 *                 description: "Full system access with all permissions"
 *                 userCount: 2
 *                 permissions:
 *                   - module: "DASHBOARD"
 *                     canView: true
 *                     canCreate: true
 *                     canEdit: true
 *                     canDelete: true
 */
router.get('/admin-roles', controller.getAllRoles);

/**
 * @swagger
 * /api/admin/admin-roles/{roleName}:
 *   get:
 *     summary: Get specific role details with permissions
 *     tags: [Admin Roles & Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleName
 *         required: true
 *         schema: { type: string, enum: ["SUPER_ADMIN", "FINANCE_ADMIN", "SUPPORT_ADMIN", "OPERATIONS_ADMIN", "ANALYTICS_ADMIN"] }
 *     responses:
 *       200:
 *         description: Role details with permissions
 */
router.get('/admin-roles/:roleName', controller.getRoleByName);

/**
 * @swagger
 * /api/admin/admin-roles/{roleName}/permissions:
 *   put:
 *     summary: Update permissions for a specific role
 *     tags: [Admin Roles & Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleName
 *         required: true
 *         schema: { type: string, enum: ["SUPER_ADMIN", "FINANCE_ADMIN", "SUPPORT_ADMIN", "OPERATIONS_ADMIN", "ANALYTICS_ADMIN"] }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [permissions]
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [module, canView, canCreate, canEdit, canDelete]
 *                   properties:
 *                     module: { type: string, enum: ["DASHBOARD", "USER_MANAGEMENT", "TRIP_MANAGEMENT", "COURIER_MANAGEMENT", "CAR_RENTAL_MANAGEMENT", "VEHICLE_PRICING", "FINANCIALS", "PROMOTIONS", "ADMIN_SECURITY", "ACTIVITY_LOGS", "EMERGENCY_SAFETY", "SETTINGS"] }
 *                     canView: { type: boolean }
 *                     canCreate: { type: boolean }
 *                     canEdit: { type: boolean }
 *                     canDelete: { type: boolean }
 *     responses:
 *       200:
 *         description: Role permissions updated successfully
 */
router.put('/admin-roles/:roleName/permissions', validate(dto.updateRolePermissionsSchema), controller.updateRolePermissions);

// ==================== ACTIVITY LOGS ====================
/**
 * @swagger
 * /api/admin/activity-logs:
 *   get:
 *     summary: Get admin activity logs with filters
 *     tags: [Admin Roles & Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: adminId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: module
 *         schema: { type: string }
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: List of activity logs with pagination
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 - id: "log-id"
 *                   admin: { fullName: "Sarah Finance", email: "sarah@spotride.com" }
 *                   action: "CREATE"
 *                   module: "ADMIN_USER"
 *                   targetName: "john@spotride.com"
 *                   changes: { role: "SUPPORT_ADMIN" }
 *                   ipAddress: "192.168.1.100"
 *                   createdAt: "2024-02-28T16:45:00Z"
 *               pagination:
 *                 page: 1
 *                 limit: 20
 *                 total: 156
 *                 totalPages: 8
 */
router.get('/activity-logs', controller.getActivityLogs);

export default router;