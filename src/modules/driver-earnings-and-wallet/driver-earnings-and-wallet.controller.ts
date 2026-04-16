import { Request, Response } from 'express';
import * as service from './driver-earnings-and-wallet.service';
import * as dto from './driver-earnings-and-wallet.dto';
import { z } from 'zod';

export const getDashboardStats = async (req: Request, res: Response) => {
  const stats = await service.getDashboardStats();
  res.json(stats);
};

export const getDriverWallets = async (req: Request, res: Response) => {
  const wallets = await service.getDriverWallets();
  res.json(wallets);
};

export const getDriverDetail = async (req: Request, res: Response) => {
  const { driverId } = z.object({ driverId: z.string().uuid() }).parse(req.params);
  const detail = await service.getDriverDetail(driverId);
  res.json(detail);
};

export const adjustWallet = async (req: Request, res: Response) => {
  try {
    const { driverId } = z.object({ driverId: z.string().uuid() }).parse(req.params);
    const { amount, reason, type = 'CREDIT' } = dto.walletAdjustmentSchema.parse(req.body);

    const result = await service.adjustWallet(driverId, amount, reason, type);
    res.json(result);
  } catch (error: any) {
    if (error.message.includes('not found') || error.message.includes('Insufficient')) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Wallet adjustment error:', error);
    res.status(500).json({ message: 'Failed to adjust wallet. Please check driver ID and balance.' });
  }
};

export const getRecentPayoutRuns = async (req: Request, res: Response) => {
  const runs = await service.getRecentPayoutRuns();
  res.json(runs);
};

export const getPayoutSettings = async (req: Request, res: Response) => {
  const settings = await service.getPayoutSettings();
  res.json(settings);
};

export const updatePayoutSettings = async (req: Request, res: Response) => {
  const data = dto.payoutSettingsSchema.parse(req.body);
  const settings = await service.updatePayoutSettings(data);
  res.json({ message: 'Payout settings updated successfully', settings });
};