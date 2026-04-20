import { Request, Response } from 'express';
import * as service from './car-owner-earnings-and-payouts.service';
import { payoutActionSchema, manualAdjustmentSchema, payoutRequestFilterSchema } from './car-owner-earnings-and-payouts.dto';
import { z } from 'zod';

export const getCarOwnerEarningsStats = async (req: Request, res: Response) => {
  try {
    const stats = await service.getCarOwnerEarningsStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch stats' });
  }
};

export const getCarOwnerList = async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const owners = await service.getCarOwnerList(status);
    res.json(owners);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch car owners' });
  }
};

export const getPayoutRequests = async (req: Request, res: Response) => {
  try {
    const { status, page, limit } = payoutRequestFilterSchema.parse(req.query);
    const result = await service.getPayoutRequests(status, page, limit);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch payout requests' });
  }
};

export const approveOrDeclinePayout = async (req: Request, res: Response) => {
  try {
    const { requestId } = z.object({ requestId: z.string().uuid() }).parse(req.params);
    const { action, adminNotes } = payoutActionSchema.parse(req.body);

    const result = await service.approveOrDeclinePayout(requestId, action, adminNotes);
    res.json({ message: `Payout ${action.toLowerCase()}d successfully`, result });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const manualAdjustment = async (req: Request, res: Response) => {
  try {
    const data = manualAdjustmentSchema.parse(req.body);
    const result = await service.manualEarningsAdjustment(data.carOwnerId, data.amount, data.type, data.reason);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getEarningsHistory = async (req: Request, res: Response) => {
  try {
    const { carOwnerId } = z.object({ carOwnerId: z.string().uuid() }).parse(req.params);
    const history = await service.getEarningsHistory(carOwnerId);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch earnings history' });
  }
};

export const getMonthlySummary = async (req: Request, res: Response) => {
  try {
    const { carOwnerId } = z.object({ carOwnerId: z.string().uuid() }).parse(req.params);
    const summary = await service.getMonthlySummary(carOwnerId);
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch monthly summary' });
  }
};