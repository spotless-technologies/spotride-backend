import prisma from '../../config/prisma';

export const getSurcharges = async () => 
  prisma.courierSurcharge.findMany({ orderBy: { size: 'asc' } });

export const updateSurcharge = async (id: string, data: any) => 
  prisma.courierSurcharge.update({ where: { id }, data });

export const getGeographicZones = async () => 
  prisma.geographicZone.findMany({ orderBy: { name: 'asc' } });

export const createGeographicZone = async (data: any) => 
  prisma.geographicZone.create({ data });

export const getCourierCategories = async () => 
  prisma.courierCategory.findMany({ 
    where: { isActive: true }, 
    orderBy: { name: 'asc' } 
  });

export const createCourierCategory = async (data: any) => 
  prisma.courierCategory.create({ data });

export const getDisputeStats = async () => {
  const [
    totalDisputes,
    openDisputes,
    investigatingDisputes,
    resolvedWithTime,
    totalRefundsResult,
  ] = await Promise.all([
    prisma.courierDispute.count(),
    prisma.courierDispute.count({ where: { status: 'OPEN' } }),
    prisma.courierDispute.count({ where: { status: 'INVESTIGATING' } }),

    prisma.courierDispute.findMany({
      where: {
        status: { in: ['RESOLVED', 'CLOSED'] },
        resolvedAt: { not: null },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    }),

    prisma.courierDispute.aggregate({
      where: { refundAmount: { gt: 0 } },
      _sum: { refundAmount: true },
    }),
  ]);

  // Calculate average resolution days in days
  const totalDays = resolvedWithTime.reduce((sum, dispute) => {
    if (!dispute.resolvedAt) return sum;
    const diffTime = dispute.resolvedAt.getTime() - dispute.createdAt.getTime();
    return sum + diffTime / (1000 * 3600 * 24); // convert ms to days
  }, 0);

  const avgResolutionDays = resolvedWithTime.length > 0 
    ? totalDays / resolvedWithTime.length 
    : 0;

  return {
    totalDisputes,
    open: openDisputes,
    investigating: investigatingDisputes,
    avgResolutionDays: Number(avgResolutionDays.toFixed(1)),
    totalRefunds: Number(totalRefundsResult._sum.refundAmount || 0),
  };
};

export const getDisputes = async () => 
  prisma.courierDispute.findMany({
    include: { driver: { select: { user: { select: { firstName: true, lastName: true } } } } },
    orderBy: { createdAt: 'desc' },
  });

export const updateDispute = async (id: string, data: any) => 
  prisma.courierDispute.update({ where: { id }, data });

export const getPayouts = async () => 
  prisma.courierPayout.findMany({
    include: { driver: { select: { user: { select: { firstName: true, lastName: true } } } } },
    orderBy: { createdAt: 'desc' },
  });

export const updatePayoutStatus = async (id: string, status: string) => {
  if (!['APPROVED', 'ON_HOLD', 'PAID'].includes(status)) {
    throw new Error('Invalid payout status');
  }
  return prisma.courierPayout.update({ 
    where: { id }, 
    data: { status, approvedAt: status === 'APPROVED' ? new Date() : undefined } 
  });
};