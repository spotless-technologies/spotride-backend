import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getDashboardStats = async (req: Request, res: Response) => {
  const [
    activeDrivers,
    activeRiders,
    liveRides,
    completedToday,
    pendingDriverApprovals,
    pendingCarApprovals,
  ] = await Promise.all([
    prisma.driver.count({ where: { status: 'approved' } }),
    prisma.rider.count(),
    prisma.trip.count({ where: { status: 'ongoing' } }),
    prisma.trip.count({
      where: { status: 'completed', createdAt: { gte: new Date(Date.now() - 86400000) } },
    }),
    prisma.driver.count({ where: { status: 'pending' } }),
    prisma.carOwner.count({ where: { status: 'pending' } }),
  ]);

  const dailyRevenue = await prisma.trip.aggregate({
    where: { status: 'completed', createdAt: { gte: new Date(Date.now() - 86400000) } },
    _sum: { revenue: true },
  });

  res.json({
    activeDrivers,
    activeRiders,
    liveRides,
    completedToday,
    pendingDriverApprovals,
    pendingCarApprovals,
    dailyRevenue: dailyRevenue._sum.revenue || 0,
  });
};

export const getRecentActivity = async (req: Request, res: Response) => {
  const activities = await prisma.user.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: { firstName: true, lastName:true, role: true, createdAt: true },
  });

  res.json(activities);
};

export const getRevenueTrends = async (req: Request, res: Response) => {
  // Last 6 months revenue
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const trends = await prisma.trip.groupBy({
    by: ['createdAt'],
    where: {
      status: 'completed',
      createdAt: { gte: sixMonthsAgo },
    },
    _sum: { revenue: true },
    orderBy: { createdAt: 'asc' },
  });

  // Format for chart (group by month)
  const monthly = trends.reduce((acc: any[], curr) => {
    const month = new Date(curr.createdAt).toLocaleString('default', { month: 'short' });
    const existing = acc.find((item) => item.date === month);
    if (existing) {
      existing.revenue += curr._sum.revenue || 0;
    } else {
      acc.push({ date: month, revenue: curr._sum.revenue || 0 });
    }
    return acc;
  }, []);

  res.json(monthly);
};

export const getDriverRiderGrowth = async (req: Request, res: Response) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const drivers = await prisma.driver.groupBy({
    by: ['createdAt'],
    where: { createdAt: { gte: sixMonthsAgo } },
    _count: { id: true },
  });

  const riders = await prisma.rider.groupBy({
    by: ['createdAt'],
    where: { createdAt: { gte: sixMonthsAgo } },
    _count: { id: true },
  });

  // Format into monthly data (simplified)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toLocaleString('default', { month: 'short' });
  }).reverse();

  const growth = months.map((month) => ({
    date: month,
    drivers: 0,
    riders: 0,
  }));

  // Fill drivers
  drivers.forEach((d) => {
    const month = new Date(d.createdAt).toLocaleString('default', { month: 'short' });
    const item = growth.find((g) => g.date === month);
    if (item) item.drivers += d._count.id;
  });

  // Fill riders
  riders.forEach((r) => {
    const month = new Date(r.createdAt).toLocaleString('default', { month: 'short' });
    const item = growth.find((g) => g.date === month);
    if (item) item.riders += r._count.id;
  });

  res.json(growth);
};