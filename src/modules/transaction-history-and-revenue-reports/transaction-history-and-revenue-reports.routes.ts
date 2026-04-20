import { Router } from 'express';
import { adminAuth } from '../../middleware/admin';
import { validate } from '../../middleware/validate';
import * as controller from './transaction-history-and-revenue-reports.controller';
import * as dto from './transaction-history-and-revenue-reports.dto';

const router = Router();

router.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: Admin Transaction History & Revenue Reports
 *   description: |
 *     Complete financial reporting module for admin.
 */

// ==================== OVERVIEW STATS ====================
/**
 * @swagger
 * /api/admin/transaction-history/stats:
 *   get:
 *     summary: Get transaction overview statistics cards
 *     tags: [Admin Transaction History & Revenue Reports]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns the four main stat cards shown at the top:
 *       - Total Revenue (with growth %)
 *       - Platform Commission (with % of revenue)
 *       - Driver Payouts (with % of total revenue)
 *       - Total Transactions (with average value)
 *     responses:
 *       200:
 *         description: Overview statistics
 *         content:
 *           application/json:
 *             example:
 *               totalRevenue: 245000
 *               platformCommission: 49000
 *               driverPayouts: 196000
 *               totalTransactions: 45
 */
router.get('/transaction-history/stats', controller.getTransactionStats);

// ==================== TRANSACTION HISTORY ====================
/**
 * @swagger
 * /api/admin/transaction-history/history:
 *   get:
 *     summary: Get paginated transaction history with advanced filters
 *     tags: [Admin Transaction History & Revenue Reports]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns the detailed transaction table shown in the screenshots.
 *       Supports filtering by period, city, type, status, and pagination.
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: ["daily", "weekly", "monthly"], default: "daily" }
 *       - in: query
 *         name: city
 *         schema: { type: string, example: "Lagos" }
 *       - in: query
 *         name: type
 *         schema: { type: string, example: "Trip Payment" }
 *       - in: query
 *         name: status
 *         schema: { type: string, example: "Completed" }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated list of transactions with full details
 *         content:
 *           application/json:
 *             example:
 *               transactions:
 *                 - transactionId: "TXN-001"
 *                   dateTime: "2024-02-28T14:30:00Z"
 *                   type: "Trip Payment"
 *                   driver: "James Wilson"
 *                   location: "Lagos"
 *                   vehicle: "2022 Toyota Camry"
 *                   amount: 8500
 *                   commission: 1700
 *                   driverPayout: 6800
 *                   status: "Completed"
 *               total: 45
 *               page: 1
 *               limit: 20
 */
router.get('/transaction-history/history', controller.getTransactionHistory);

// ==================== REVENUE REPORTS ====================
/**
 * @swagger
 * /api/admin/transaction-history/revenue-reports:
 *   get:
 *     summary: Get revenue reports grouped by time period
 *     tags: [Admin Transaction History & Revenue Reports]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns revenue breakdown by day/week/month including:
 *       Total Revenue, Platform Commission, Driver Payouts, Transaction count, Average Value, and Refunds.
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: ["daily", "weekly", "monthly"], default: "monthly" }
 *     responses:
 *       200:
 *         description: Revenue reports by period
 *         content:
 *           application/json:
 *             example:
 *               period: "monthly"
 *               reports:
 *                 - period: "2024-02"
 *                   totalRevenue: 7340000
 *                   platformCommission: 1468000
 *                   driverPayouts: 5872000
 *                   transactions: 1247
 *                   avgValue: 5886
 *                   refunds: 45
 */
router.get('/transaction-history/revenue-reports', controller.getRevenueReports);

// ==================== FINANCIAL BREAKDOWN ====================
/**
 * @swagger
 * /api/admin/transaction-history/financial-breakdown:
 *   get:
 *     summary: Get financial breakdown by vehicle type and by city
 *     tags: [Admin Transaction History & Revenue Reports]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns data for the two charts in the Financial Breakdown tab:
 *       - Revenue by Vehicle Type (Regular, Standard, Premium)
 *       - Revenue by City (Lagos, Abuja, Port Harcourt, etc.)
 *     responses:
 *       200:
 *         description: Financial breakdown data for charts
 *         content:
 *           application/json:
 *             example:
 *               revenueByVehicleType:
 *                 - type: "Regular"
 *                   revenue: 2940000
 *                 - type: "Standard"
 *                   revenue: 2570000
 *                 - type: "Premium"
 *                   revenue: 1470000
 *               revenueByCity:
 *                 - city: "Lagos"
 *                   revenue: 3670000
 *                 - city: "Abuja"
 *                   revenue: 3670000
 *                 - city: "Port Harcourt"
 *                   revenue: 1100000
 */
router.get('/transaction-history/financial-breakdown', controller.getFinancialBreakdown);

export default router;