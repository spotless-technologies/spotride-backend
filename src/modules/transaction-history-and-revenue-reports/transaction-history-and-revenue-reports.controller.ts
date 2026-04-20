import { Request, Response } from 'express';
import * as service from './transaction-history-and-revenue-reports.service';
import { transactionFilterSchema, revenueReportFilterSchema } from './transaction-history-and-revenue-reports.dto';

export const getTransactionStats = async (req: Request, res: Response) => {
  try {
    const stats = await service.getTransactionStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch transaction stats' });
  }
};

export const getTransactionHistory = async (req: Request, res: Response) => {
  try {
    const filters = transactionFilterSchema.parse(req.query);
    const result = await service.getTransactionHistory(filters);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch transaction history' });
  }
};

export const getRevenueReports = async (req: Request, res: Response) => {
  try {
    const { period = 'monthly' } = revenueReportFilterSchema.parse(req.query);
    const reports = await service.getRevenueReports(period);
    res.json({ period, reports });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch revenue reports' });
  }
};

export const getFinancialBreakdown = async (req: Request, res: Response) => {
  try {
    const breakdown = await service.getFinancialBreakdown();
    res.json(breakdown);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch financial breakdown' });
  }
};