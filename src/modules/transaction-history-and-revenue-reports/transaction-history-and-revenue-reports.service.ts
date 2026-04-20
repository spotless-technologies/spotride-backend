import prisma from '../../config/prisma';
import { subDays, subWeeks, subMonths, startOfDay, endOfDay } from 'date-fns';

const getDateRange = (period: string) => {
  const now = new Date();
  if (period === 'daily') return { gte: startOfDay(subDays(now, 30)), lte: endOfDay(now) };
  if (period === 'weekly') return { gte: startOfDay(subWeeks(now, 12)), lte: endOfDay(now) };
  return { gte: startOfDay(subMonths(now, 6)), lte: endOfDay(now) };
};

export const getTransactionStats = async () => {
  const [totalRevenue, platformCommission, driverPayouts, totalTransactions] = await Promise.all([
    prisma.trip.aggregate({ _sum: { actualFare: true } }),
    prisma.trip.aggregate({ _sum: { commissionAmount: true } }),
    prisma.driverPayout.aggregate({ _sum: { amount: true } }),
    prisma.trip.count(),
  ]);

  return {
    totalRevenue: totalRevenue._sum.actualFare || 0,
    platformCommission: platformCommission._sum.commissionAmount || 0,
    driverPayouts: driverPayouts._sum.amount || 0,
    totalTransactions,
  };
};

export const getTransactionHistory = async (filters: any) => {
  const { period, city, type, status, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (city) where.city = city;                   
  if (type) where.paymentMethod = type;
  if (status) where.paymentStatus = status;

  const [transactions, total] = await Promise.all([
    prisma.trip.findMany({
      where,
      skip,
      take: limit,
      include: {
        rider: { select: { firstName: true, lastName: true } },
        driver: { 
          include: { 
            user: { select: { firstName: true, lastName: true } } 
          } 
        },
        category: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.trip.count({ where }),
  ]);

  return {
    transactions: transactions.map(t => ({
      transactionId: `TXN-${t.id.slice(0,8)}`,
      dateTime: t.createdAt,
      type: t.paymentMethod || 'Trip Payment',
      driver: t.driver ? `${t.driver.user.firstName} ${t.driver.user.lastName}` : 'N/A',
      location: (t.pickupLocation as any)?.address || t.city,
      vehicle: t.category?.name || 'Standard',
      amount: t.actualFare || t.estimatedFare || 0,
      commission: t.commissionAmount || 0,
      driverPayout: (t.actualFare || 0) - (t.commissionAmount || 0),
      status: t.paymentStatus || 'Completed',
      city: t.city || 'Unknown',                  
    })),
    total,
    page,
    limit,
  };
};

export const getRevenueReports = async (period: string) => {
  const range = getDateRange(period);

  const [reports, refundData] = await Promise.all([
    prisma.trip.groupBy({
      by: ['createdAt'],
      where: { createdAt: range },
      _sum: { actualFare: true, commissionAmount: true },
      _count: { id: true },
    }),

    prisma.payment.groupBy({
      by: ['createdAt'],
      where: { 
        createdAt: range,
        status: 'REFUNDED' 
      },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);

  return reports.map(r => {
    const refundForPeriod = refundData.find(ref => 
      ref.createdAt.toDateString() === r.createdAt.toDateString()
    );

    return {
      period: r.createdAt.toISOString().split('T')[0],
      totalRevenue: r._sum.actualFare || 0,
      platformCommission: r._sum.commissionAmount || 0,
      driverPayouts: (r._sum.actualFare || 0) - (r._sum.commissionAmount || 0),
      transactions: r._count.id,
      avgValue: r._sum.actualFare ? Math.round((r._sum.actualFare / r._count.id) * 100) / 100 : 0,
      refunds: refundForPeriod?._sum.amount || 0,
      refundCount: refundForPeriod?._count.id || 0,
    };
  });
};

export const getFinancialBreakdown = async () => {
  const [byVehicle, byCity] = await Promise.all([
    prisma.trip.groupBy({
      by: ['rideType'],
      _sum: { actualFare: true },
    }),
    prisma.trip.groupBy({
      by: ['city'],                    
      _sum: { actualFare: true },
    }),
  ]);

  return {
    revenueByVehicleType: byVehicle.map(v => ({
      type: v.rideType || 'Regular',
      revenue: v._sum.actualFare || 0,
    })),
    revenueByCity: byCity.map(c => ({
      city: c.city || '',         
      revenue: c._sum.actualFare || 0,
    })),
  };
};