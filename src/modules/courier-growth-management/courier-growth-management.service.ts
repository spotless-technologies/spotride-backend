import prisma from '../../config/prisma';

export const getPromoStats = async () => {
  const [activeCampaigns, totalRedemptions, revenueImpactResult] = await Promise.all([
    prisma.promoCode.count({ where: { status: 'ACTIVE' } }),
    prisma.promoCode.aggregate({ _sum: { redemptions: true } }),
    prisma.promoCode.aggregate({
      _sum: { revenueImpact: true },
    }),
  ]);

  const avgDiscount = totalRedemptions._sum.redemptions 
    ? (revenueImpactResult._sum.revenueImpact || 0) / totalRedemptions._sum.redemptions 
    : 0;

  return {
    activeCampaigns,
    totalRedemptions: totalRedemptions._sum.redemptions || 0,
    revenueImpact: revenueImpactResult._sum.revenueImpact || 0,
    avgDiscount: Number(avgDiscount.toFixed(2)),
  };
};

export const getPromotionalCampaigns = async () => {
  return prisma.promoCode.findMany({
    orderBy: { createdAt: 'desc' },
  });
};

export const createPromoCode = async (data: any) => {
  return prisma.promoCode.create({
    data: {
      code: data.code.toUpperCase(),
      type: data.type,
      value: data.value,
      description: data.description,
      target: data.target,
      usageLimit: data.usageLimit,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      status: 'ACTIVE',
      revenueImpact: 0, // Will be calculated on redemption
      redemptions: 0,
    },
  });
};

export const updatePromoCode = async (id: string, data: any) => {
  return prisma.promoCode.update({
    where: { id },
    data: {
      code: data.code ? data.code.toUpperCase() : undefined,
      value: data.value,
      description: data.description,
      usageLimit: data.usageLimit,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      status: data.status,
    },
  });
};

export const togglePromoStatus = async (id: string) => {
  const promo = await prisma.promoCode.findUnique({ where: { id } });
  if (!promo) throw new Error('Promo code not found');

  return prisma.promoCode.update({
    where: { id },
    data: { status: promo.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' },
  });
};

export const getAlerts = async () => {
  return prisma.courierAlert.findMany({
    where: { isActive: true },
    include: {
      driver: {
        select: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
};