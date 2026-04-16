import prisma from '../../config/prisma';
import { subDays } from 'date-fns';

// Single global payout configuration record
const GLOBAL_CONFIG_ID = 'global';

export const getDashboardStats = async () => {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);

  const [totalEarnings, walletBalance, pendingPayouts, activeDrivers, totalDrivers] = await Promise.all([
    prisma.trip.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { actualFare: true },
    }),
    prisma.wallet.aggregate({ _sum: { balance: true } }),
    prisma.driverPayout.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true },
    }),
    prisma.driver.count({ where: { isOnline: true, status: 'approved' } }),
    prisma.driver.count(),
  ]);

  return {
    totalDriverEarnings: totalEarnings._sum.actualFare || 0,
    totalWalletBalance: walletBalance._sum.balance || 0,
    pendingPayouts: pendingPayouts._sum.amount || 0,
    activeDrivers,
    totalDrivers,
  };
};

export const getDriverWallets = async () => {
  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);
  const thirtyDaysAgo = subDays(now, 30);

  const drivers = await prisma.driver.findMany({
    where: { status: 'approved' },
    include: {
      user: { include: { wallet: true } },
    },
  });

  const result = await Promise.all(drivers.map(async (driver) => {
    const [weeklyData, monthlyData] = await Promise.all([
      prisma.trip.aggregate({
        where: { driverId: driver.id, status: 'COMPLETED', endTime: { gte: sevenDaysAgo } },
        _sum: { actualFare: true },
      }),
      prisma.trip.aggregate({
        where: { driverId: driver.id, status: 'COMPLETED', endTime: { gte: thirtyDaysAgo } },
        _sum: { actualFare: true },
      }),
    ]);

    return {
      driverId: driver.id,
      driverName: `${driver.user.firstName} ${driver.user.lastName}`,
      status: driver.status.toUpperCase(),
      walletBalance: driver.user.wallet?.balance || 0,
      weeklyEarnings: weeklyData._sum.actualFare || 0,
      monthlyEarnings: monthlyData._sum.actualFare || 0,
      rating: driver.rating || 0,
    };
  }));

  return result;
};

export const getDriverDetail = async (driverId: string) => {
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: {
      user: { include: { wallet: true } },
      trips: {
        where: { status: 'COMPLETED' },
        orderBy: { endTime: 'desc' },
        take: 10,
        include: { rider: { select: { firstName: true, lastName: true } } },
      },
    },
  });

  if (!driver) throw new Error('Driver not found');

  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);
  const thirtyDaysAgo = subDays(now, 30);

  const [weeklyEarningsData, monthlyEarningsData, totalTrips] = await Promise.all([
    prisma.trip.aggregate({
      where: { driverId, status: 'COMPLETED', endTime: { gte: sevenDaysAgo } },
      _sum: { actualFare: true },
    }),
    prisma.trip.aggregate({
      where: { driverId, status: 'COMPLETED', endTime: { gte: thirtyDaysAgo } },
      _sum: { actualFare: true },
    }),
    prisma.trip.count({ where: { driverId, status: 'COMPLETED' } }),
  ]);

  return {
    driver: {
      id: driver.id,
      name: `${driver.user.firstName} ${driver.user.lastName}`,
      email: driver.user.email,
      phone: driver.user.phone,
      status: driver.status.toUpperCase(),
      joinedDate: driver.createdAt,
      rating: driver.rating || 0,
      totalTrips,
    },
    walletBalance: driver.user.wallet?.balance || 0,
    weeklyEarnings: weeklyEarningsData._sum.actualFare || 0,
    monthlyEarnings: monthlyEarningsData._sum.actualFare || 0,
    recentTrips: driver.trips.map((trip) => ({
      tripId: `TRIP-${trip.id.slice(0, 8).toUpperCase()}`,
      dateTime: trip.endTime || trip.createdAt,
      route: `${(trip.pickupLocation as any)?.address || 'N/A'} → ${(trip.dropoffLocation as any)?.address || 'N/A'}`,
      fare: trip.actualFare || 0,
      commission: trip.commissionAmount || Math.round((trip.actualFare || 0) * 0.2),
      rating: trip.riderRating || 0,
    })),
  };
};

export const adjustWallet = async (driverId: string, amount: number, reason: string, type: 'CREDIT' | 'DEBIT') => {
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: { user: { include: { wallet: true } } },
  });

  if (!driver) throw new Error('Driver not found');
  if (!driver.user.wallet) throw new Error('Wallet not found for this driver');

  const adjustment = type === 'CREDIT' ? amount : -amount;
  const newBalance = Math.max(0, driver.user.wallet.balance + adjustment);

  if (type === 'DEBIT' && newBalance < 0) {
    throw new Error('Insufficient wallet balance for debit');
  }

  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.update({
      where: { id: driver.user.wallet!.id },
      data: { balance: newBalance },
    });

    const transaction = await tx.driverWalletTransaction.create({
      data: {
        driverId,
        amount,
        type,
        category: 'ADJUSTMENT',
        description: reason,
        balanceAfter: newBalance,
        reference: `ADJ-${Date.now()}`,
      },
    });

    return { 
      message: 'Wallet adjusted successfully', 
      newBalance, 
      transactionId: transaction.reference 
    };
  });
};

export const getRecentPayoutRuns = async () => {
  const runs = await prisma.payoutRun.findMany({
    orderBy: { runDate: 'desc' },
    take: 10,
  });

  return runs.map((run) => ({
    date: run.runDate.toISOString().split('T')[0],
    driversPaid: run.driversPaid,
    totalDisbursed: run.totalDisbursed,
    status: run.status.toUpperCase(),
  }));
};

export const getPayoutSettings = async () => {
  let settings = await prisma.payoutConfiguration.findUnique({
    where: { id: GLOBAL_CONFIG_ID },
  });

  if (!settings) {
    // TODO: Create the global config only once with sensible defaults
    settings = await prisma.payoutConfiguration.create({
      data: {
        id: GLOBAL_CONFIG_ID,
        frequency: 'DAILY',
        processingTime: '23:59',
        minimumThreshold: 500,
        autoPayoutEnabled: true,
        eligibleDriverTypes: ['approved'],
      },
    });
  }

  return settings;
};

export const updatePayoutSettings = async (data: any) => {
  // TODO: Always update or create the single global record
  const settings = await prisma.payoutConfiguration.upsert({
    where: { id: GLOBAL_CONFIG_ID },
    update: {
      ...data,
      updatedAt: new Date(),
    },
    create: {
      id: GLOBAL_CONFIG_ID,
      ...data,
    },
  });

  return settings;
};