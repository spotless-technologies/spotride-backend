import { Request, Response } from 'express';
import * as analyticsService from './support-and-analytics.service';
import { analyticsFilterSchema } from './support-and-analytics.dto';

export const getOverviewStats = async (req: Request, res: Response) => {
  try {
    const { period } = analyticsFilterSchema.parse(req.query);
    const stats = await analyticsService.getOverviewStats(period);
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getRevenueReports = async (req: Request, res: Response) => {
  try {
    const { period } = analyticsFilterSchema.parse(req.query);
    const reports = await analyticsService.getRevenueReports(period);
    res.json(reports);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getBookingAnalytics = async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.getBookingAnalytics();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPerformanceMetrics = async (req: Request, res: Response) => {
  try {
    const data = await analyticsService.getPerformanceMetrics();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};