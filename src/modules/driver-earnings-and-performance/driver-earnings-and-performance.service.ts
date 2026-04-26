import prisma from '../../config/prisma';

export const getTodayPerformanceService = async (driverId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [trips, earnings] = await Promise.all([
    prisma.trip.count({ 
      where: { 
        driverId: driverId, 
        createdAt: { gte: today } 
      } 
    }),
    prisma.trip.aggregate({
      where: { 
        driverId: driverId, 
        createdAt: { gte: today } 
      },
      _sum: { revenue: true },
    }),
  ]);

  return {
    tripsToday: trips,
    earningsToday: earnings._sum.revenue || 0,
  };
};

export const getPerformanceSummaryService = async (driverId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayStats, yesterdayStats] = await Promise.all([
    prisma.trip.aggregate({
      where: { 
        driverId: driverId, 
        createdAt: { gte: today, lt: tomorrow } 
      },
      _sum: { revenue: true },
      _count: { id: true },
    }),
    prisma.trip.aggregate({
      where: { 
        driverId: driverId, 
        createdAt: { gte: yesterday, lt: today } 
      },
      _sum: { revenue: true },
    }),
  ]);

  const yesterdayRevenue = yesterdayStats._sum.revenue || 0;
  const todayRevenue = todayStats._sum.revenue || 0;
  
  let deltaPercentage = 0;
  if (yesterdayRevenue > 0) {
    deltaPercentage = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;
  } else if (todayRevenue > 0) {
    deltaPercentage = 100;
  }

  return {
    todayEarnings: todayRevenue,
    todayTrips: todayStats._count.id,
    deltaPercentage: deltaPercentage.toFixed(1),
  };
};

export const getEarningsHistoryService = async (driverId: string) => {
  const history = await prisma.trip.groupBy({
    by: ['createdAt'],
    where: { driverId: driverId },
    _sum: { revenue: true, actualFare: true },
    _count: { id: true },
  });

  return history.map(record => ({
    date: record.createdAt,
    revenue: record._sum.revenue || 0,
    fare: record._sum.actualFare || 0,
    trips: record._count.id,
  }));
};

export const getEarningsBreakdownService = async (driverId: string) => {
  const trips = await prisma.trip.findMany({
    where: { driverId: driverId },
    select: { 
      id: true, 
      revenue: true, 
      rating: true,
      actualFare: true,
      createdAt: true,
      status: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return trips.map(trip => ({
    tripId: trip.id,
    date: trip.createdAt,
    revenue: trip.revenue || 0,
    fare: trip.actualFare || 0,
    rating: trip.rating || 0,
    status: trip.status,
  }));
};

export const getWalletService = async (driverId: string) => {
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    select: { 
      totalEarnings: true,
      user: {
        select: {
          wallet: {
            select: {
              balance: true,
            }
          }
        }
      }
    },
  });

  // Get pending payouts
  const pendingPayouts = await prisma.driverPayout.aggregate({
    where: { 
      driverId: driverId,
      status: { in: ['PENDING', 'PROCESSING'] }
    },
    _sum: { amount: true },
  });

  return {
    balance: driver?.user.wallet?.balance || 0,
    totalEarnings: driver?.totalEarnings || 0,
    pendingPayouts: pendingPayouts._sum.amount || 0,
  };
};

export const requestWithdrawService = async (driverId: string, amount: number) => {
  // Get driver with wallet
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: {
      user: {
        include: {
          wallet: true,
        }
      }
    }
  });

  if (!driver) {
    throw new Error('Driver not found');
  }

  const currentBalance = driver.user.wallet?.balance || 0;
  
  if (amount > currentBalance) {
    throw new Error('Insufficient balance');
  }

  // Create withdrawal request
  const withdrawal = await prisma.driverPayout.create({
    data: {
      driverId: driverId,
      amount: amount,
      status: 'PENDING',
      paymentMethod: 'BANK_TRANSFER',
      reference: `WDR-${Date.now()}-${driverId.slice(0, 8)}`,
    },
  });

  // Create transaction record
  await prisma.driverWalletTransaction.create({
    data: {
      driverId: driverId,
      amount: amount,
      type: 'DEBIT',
      category: 'WITHDRAWAL',
      description: `Withdrawal request of ₦${amount}`,
      balanceAfter: currentBalance - amount,
      reference: withdrawal.reference,
    },
  });

  return {
    message: 'Withdrawal request submitted successfully',
    withdrawalId: withdrawal.id,
    amount: amount,
    status: withdrawal.status,
    reference: withdrawal.reference,
  };
};