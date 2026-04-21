import prisma from '../../config/prisma';

export const getPromoStats = async () => {
  const [totalPromos, activePromos, promoStats] = await Promise.all([
    prisma.promoCode.count(),
    prisma.promoCode.count({ where: { status: 'ACTIVE' } }),
    prisma.promoCode.aggregate({
      _sum: {
        redemptions: true,
        revenueImpact: true
      }
    }),
  ]);

  return {
    totalPromos,
    activePromos,
    totalUses: promoStats._sum.redemptions || 0,
    totalSavings: promoStats._sum.revenueImpact || 0,
  };
};

export const getPromoList = async (status?: string) => {
  const where: any = status && status !== 'ALL' ? { status: status.toUpperCase() } : {};

  return prisma.promoCode.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
};

export const createPromo = async (data: any) => {
  return prisma.promoCode.create({
    data: {
      code: data.promoCode.toUpperCase(),
      type: data.discountType,           // "FIXED_AMOUNT" or "PERCENTAGE"
      value: data.discountValue,
      description: data.promoName,
      target: data.targetGroup,
      usageLimit: data.usageLimit || 0,
      startDate: new Date(),
      endDate: new Date(data.expiryDate),
      status: 'ACTIVE',
      redemptions: 0,
      revenueImpact: 0,
    },
  });
};

export const updatePromo = async (id: string, data: any) => {
  return prisma.promoCode.update({
    where: { id },
    data: {
      code: data.promoCode?.toUpperCase(),
      type: data.discountType,
      value: data.discountValue,
      description: data.promoName,
      target: data.targetGroup,
      usageLimit: data.usageLimit,
      endDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
    },
  });
};

export const togglePromoStatus = async (id: string, action: 'ENABLE' | 'DISABLE') => {
  return prisma.promoCode.update({
    where: { id },
    data: { status: action === 'ENABLE' ? 'ACTIVE' : 'INACTIVE' },
  });
};

export const getUsageReport = async (promoId: string) => {
  const promo = await prisma.promoCode.findUnique({
    where: { id: promoId },
  });

  if (!promo) throw new Error("Promo code not found");

  // Get real redemptions from trips that used this promo code
  const usageData = await prisma.trip.findMany({
    where: { promoCode: promo.code },
    include: {
      rider: { select: { firstName: true, lastName: true } },
      payment: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10, // Recent 10 usages
  });

  const totalUses = usageData.length;
  const totalSavings = usageData.reduce((sum, trip) => {
    return sum + (trip.commissionAmount || 0); 
  }, 0);

  const usageRate = promo.usageLimit ? Math.round((totalUses / promo.usageLimit) * 100) : 0;

  return {
    promoName: promo.description || promo.code,
    totalUses,
    totalSavings,
    usageRate,
    recentUsage: usageData.map(trip => ({
      userName: `${trip.rider.firstName} ${trip.rider.lastName}`,
      dateTime: trip.createdAt,
      tripAmount: trip.actualFare || trip.estimatedFare || 0,
      savedAmount: trip.commissionAmount || 0,
    })),
  };
};