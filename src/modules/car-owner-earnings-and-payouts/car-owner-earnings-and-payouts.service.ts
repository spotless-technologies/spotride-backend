import prisma from '../../config/prisma';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';

export const getCarOwnerEarningsStats = async () => {
  const [totalEarningsResult, pendingPayoutsResult, activeOwners, totalCars] = await Promise.all([
    prisma.carRentalBooking.aggregate({ _sum: { totalPrice: true } }),
    prisma.carOwnerPayoutRequest.aggregate({ 
      _sum: { amount: true }, 
      where: { status: 'PENDING' } 
    }),
    prisma.carOwner.count({ where: { status: 'approved' } }),
    prisma.carRental.count({ where: { available: true } }),
  ]);

  // Dynamic Next Payout Run (based on PayoutConfiguration or default to tomorrow)
  const config = await prisma.payoutConfiguration.findFirst() || { processingTime: '23:59' };
  
  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setDate(nextRun.getDate() + 1); 
  nextRun.setHours(23, 59, 0, 0);

  return {
    totalEarnings: totalEarningsResult._sum.totalPrice || 0,
    pendingPayouts: pendingPayoutsResult._sum.amount || 0,
    activeOwners,
    totalCars,
    nextPayoutRun: nextRun.toISOString(),  
  };
};
export const getCarOwnerList = async (status?: string) => {
  const where: any = {};
  if (status && status !== 'ALL') where.status = status;

  return prisma.carOwner.findMany({
    where,
    include: {
      user: { select: { firstName: true, lastName: true, profilePicture: true } },
      carRentals: true,
    },
    orderBy: { totalEarnings: 'desc' },
  });
};

export const getPayoutRequests = async (status = 'PENDING', page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [requests, total] = await Promise.all([
    prisma.carOwnerPayoutRequest.findMany({
      where: status === 'ALL' ? {} : { status },
      skip,
      take: limit,
      include: { carOwner: { include: { user: true } } },
      orderBy: { requestDate: 'desc' },
    }),
    prisma.carOwnerPayoutRequest.count({ where: status === 'ALL' ? {} : { status } }),
  ]);

  return { requests, total, page, limit };
};

export const approveOrDeclinePayout = async (requestId: string, action: 'APPROVE' | 'DECLINE', adminNotes?: string) => {
  const updateData: any = { adminNotes };

  if (action === 'APPROVE') {
    updateData.status = 'APPROVED';
    updateData.approvedAt = new Date();
  } else {
    updateData.status = 'DECLINED';
    updateData.declinedAt = new Date();
  }

  return prisma.carOwnerPayoutRequest.update({
    where: { id: requestId },
    data: updateData,
  });
};

export const manualEarningsAdjustment = async (carOwnerId: string, amount: number, type: 'ADD' | 'DEDUCT', reason: string) => {
  const adjustment = type === 'ADD' ? amount : -amount;

  return prisma.$transaction(async (tx) => {
    const carOwner = await tx.carOwner.findUnique({ where: { id: carOwnerId } });
    if (!carOwner) throw new Error("Car owner not found");

    await tx.carOwner.update({
      where: { id: carOwnerId },
      data: { totalEarnings: { increment: adjustment } },
    });

    // Log transaction
    await tx.carOwnerPayoutHistory.create({
      data: {
        carOwnerId,
        amount: Math.abs(adjustment),
        status: type === 'ADD' ? 'ADJUSTMENT_ADD' : 'ADJUSTMENT_DEDUCT',
        transactionId: `ADJ-${Date.now()}`,
        method: 'MANUAL',
      },
    });

    return { message: `₦${Math.abs(adjustment)} ${type === 'ADD' ? 'added to' : 'deducted from'} earnings` };
  });
};

export const getEarningsHistory = async (carOwnerId: string) => {
  return prisma.carRentalBooking.findMany({
    where: { car: { ownerId: carOwnerId } },
    include: { car: true, driver: { include: { user: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

export const getMonthlySummary = async (carOwnerId: string) => {
  const now = new Date();
  const months = [];

  for (let i = 0; i < 3; i++) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = endOfMonth(subMonths(now, i));

    const earnings = await prisma.carRentalBooking.aggregate({
      where: {
        car: { ownerId: carOwnerId },
        createdAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { totalPrice: true },
    });

    months.push({
      month: monthStart.toLocaleString('default', { month: 'long', year: 'numeric' }),
      earnings: earnings._sum.totalPrice || 0,
    });
  }

  return months;
};