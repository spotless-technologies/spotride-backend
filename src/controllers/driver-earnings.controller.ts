import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { DriverRequest } from '../middleware/driver';
import { z } from 'zod';

export const getTodayPerformance = async (req: DriverRequest, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [trips, earnings] = await Promise.all([
    prisma.trip.count({ where: { driverId: req.driver!.driverId, createdAt: { gte: today } } }),
    prisma.trip.aggregate({
      where: { driverId: req.driver!.driverId, createdAt: { gte: today } },
      _sum: { revenue: true },
    }),
  ]);

  res.json({
    tripsToday: trips,
    earningsToday: earnings._sum.revenue || 0,
  });
};

export const getPerformanceSummary = async (req: DriverRequest, res: Response) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const todayStats = await prisma.trip.aggregate({
    where: { driverId: req.driver!.driverId, createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } },
    _sum: { revenue: true },
    _count: { id: true },
  });

  const yesterdayStats = await prisma.trip.aggregate({
    where: { driverId: req.driver!.driverId, createdAt: { gte: yesterday, lt: new Date(yesterday.getTime() + 86400000) } },
    _sum: { revenue: true },
  });

  const delta = yesterdayStats._sum.revenue
    ? ((todayStats._sum.revenue || 0) - (yesterdayStats._sum.revenue || 0)) / (yesterdayStats._sum.revenue || 1) * 100
    : 0;

  res.json({
    todayEarnings: todayStats._sum.revenue || 0,
    todayTrips: todayStats._count.id,
    deltaPercentage: delta.toFixed(1),
  });
};

export const getEarningsHistory = async (req: Request, res: Response) => {
  const history = await prisma.trip.groupBy({
    by: ['createdAt'],
    where: { driverId: (req as DriverRequest).driver!.driverId },
    _sum: { revenue: true },
  });

  res.json(history);
};

export const getEarningsBreakdown = async (req: DriverRequest, res: Response) => {
  const trips = await prisma.trip.findMany({
    where: { driverId: req.driver!.driverId },
    select: { id: true, revenue: true, rating: true },
  });

  res.json(trips);
};

export const getWallet = async (req: DriverRequest, res: Response) => {
  const driver = await prisma.driver.findUnique({
    where: { id: req.driver!.driverId },
    select: { totalEarnings: true },
  });

  res.json({ balance: driver?.totalEarnings || 0 });
};

export const requestWithdraw = async (req: DriverRequest, res: Response) => {
  const { amount } = z.object({ amount: z.number().positive() }).parse(req.body);

  if (amount > (await prisma.driver.findUnique({ where: { id: req.driver!.driverId } }))!.totalEarnings!) {
    return res.status(400).json({ message: 'Insufficient balance' });
  }

  // TODO: create payout request + trigger Stripe/Paystack
  res.json({ message: 'Withdrawal request submitted', amount });
};