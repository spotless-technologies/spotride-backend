import prisma from '../../config/prisma';

export const getSurcharges = async () => 
  prisma.courierSurcharge.findMany({ orderBy: { size: 'asc' } });

export const createSurcharge = async (data: any) => {
  // Check if surcharge with this size already exists
  const existing = await prisma.courierSurcharge.findUnique({
    where: { size: data.size }
  });
  
  if (existing) {
    throw new Error(`Surcharge for size ${data.size} already exists`);
  }
  
  return prisma.courierSurcharge.create({
    data: {
      size: data.size,
      weightRange: data.weightRange,
      bikeExtra: data.bikeExtra,
      carExtra: data.carExtra,
      notes: data.notes,
    }
  });
};

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

export const createCourierCategory = async (data: any) => {
  // Check if category with this name already exists
  const existing = await prisma.courierCategory.findUnique({
    where: { name: data.name }
  });
  
  if (existing) {
    throw new Error(`Category with name "${data.name}" already exists`);
  }
  
  // Map vehicleRestriction from the incoming format to match schema
  let vehicleRestriction = data.vehicleRestriction;
  if (vehicleRestriction === 'BIKE_ONLY') vehicleRestriction = 'BIKE ONLY';
  if (vehicleRestriction === 'CAR_ONLY') vehicleRestriction = 'CAR ONLY';
  if (vehicleRestriction === 'BOTH') vehicleRestriction = 'BOTH';
  
  // Map insuranceLevel to match schema
  let insuranceLevel = data.insuranceLevel;
  if (insuranceLevel === 'NONE') insuranceLevel = 'NONE';
  if (insuranceLevel === 'BASIC') insuranceLevel = 'BASIC';
  if (insuranceLevel === 'STANDARD') insuranceLevel = 'STANDARD';
  if (insuranceLevel === 'PREMIUM') insuranceLevel = 'PREMIUM';
  
  return prisma.courierCategory.create({
    data: {
      name: data.name,
      description: data.description,
      vehicleRestriction: vehicleRestriction,
      insuranceLevel: insuranceLevel,
      pricingMultiplier: data.pricingMultiplier || 1.0,
      maxDeliveryWindow: data.maxDeliveryWindow,
      requirements: data.requirements || [],
      isActive: true,
    }
  });
};

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

  const totalDays = resolvedWithTime.reduce((sum, dispute) => {
    if (!dispute.resolvedAt) return sum;
    const diffTime = dispute.resolvedAt.getTime() - dispute.createdAt.getTime();
    return sum + diffTime / (1000 * 3600 * 24);
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

  export const getDisputes = async (filters?: {
  search?: string;
  status?: string;
  priority?: string;
  driverId?: string;
}) => {
  const where: any = {};
  
  if (filters?.status) where.status = filters.status;
  if (filters?.priority) where.priority = filters.priority;
  if (filters?.driverId) where.driverId = filters.driverId;
  
  if (filters?.search) {
    where.OR = [
      { disputeCode: { contains: filters.search, mode: 'insensitive' } },
      { trackingNumber: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return prisma.courierDispute.findMany({
    where,
    include: { 
      driver: { 
        select: { 
          user: { select: { firstName: true, lastName: true } },
          vehiclePlate: true,
          vehicleModel: true,
        } 
      } 
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const updateDispute = async (id: string, data: any) => {
  const updateData: any = { ...data };
  if (data.status === 'RESOLVED' || data.status === 'CLOSED') {
    updateData.resolvedAt = new Date();
  }
  return prisma.courierDispute.update({ where: { id }, data: updateData });
};

  export const getPayouts = async (filters?: {
  status?: string;
  driverId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const page = filters?.page || 1;
  const limit = filters?.limit || 10;
  const skip = (page - 1) * limit;

  const where: any = {};
  
  if (filters?.status) where.status = filters.status;
  if (filters?.driverId) where.driverId = filters.driverId;
  
  if (filters?.search) {
    where.driver = {
      user: {
        OR: [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
        ]
      }
    };
  }

  const [payouts, total] = await Promise.all([
    prisma.courierPayout.findMany({
      where,
      include: { 
        driver: { 
          select: { 
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
            vehiclePlate: true,
          } 
        } 
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.courierPayout.count({ where }),
  ]);

  // Calculate summary stats
  const summary = await prisma.courierPayout.aggregate({
    where: { status: 'PENDING' },
    _sum: { pendingAmount: true }
  });

  const paidThisMonth = await prisma.courierPayout.aggregate({
    where: {
      status: 'PAID',
      paidAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    },
    _sum: { pendingAmount: true }
  });

  return {
    payouts,
    summary: {
      pendingPayouts: summary._sum.pendingAmount || 0,
      paidThisMonth: paidThisMonth._sum.pendingAmount || 0,
    },
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }
  };
};

export const updatePayoutStatus = async (id: string, status: string) => {
  if (!['APPROVED', 'ON_HOLD', 'PAID'].includes(status)) {
    throw new Error('Invalid payout status');
  }
  const updateData: any = { status };
  if (status === 'APPROVED') updateData.approvedAt = new Date();
  if (status === 'PAID') updateData.paidAt = new Date();
  
  return prisma.courierPayout.update({ 
    where: { id }, 
    data: updateData 
  });
};

export const getBasePricing = async () =>
  prisma.courierPricing.findMany({ orderBy: { category: 'asc' } });

export const getBasePricingById = async (id: string) =>
  prisma.courierPricing.findUnique({ where: { id } });

export const createBasePricing = async (data: any) => {
  // Check if pricing for this category already exists
  const existing = await prisma.courierPricing.findUnique({
    where: { category: data.category }
  });
  
  if (existing) {
    throw new Error(`Pricing for category ${data.category} already exists`);
  }
  
  return prisma.courierPricing.create({
    data: {
      category: data.category,
      baseFare: data.baseFare,
      ratePerKm: data.ratePerKm,
      minFare: data.minFare,
      peakMultiplier: data.peakMultiplier,
      notes: data.notes || null,
    }
  });
};

export const updateBasePricing = async (id: string, data: any) => {
  // Check if pricing exists
  const existing = await prisma.courierPricing.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Base pricing not found');
  }
  
  // Check if updating category name and if it conflicts with another record
  if (data.category && data.category !== existing.category) {
    const duplicate = await prisma.courierPricing.findUnique({
      where: { category: data.category }
    });
    if (duplicate) {
      throw new Error(`Pricing for category ${data.category} already exists`);
    }
  }
  
  return prisma.courierPricing.update({
    where: { id },
    data: {
      category: data.category,
      baseFare: data.baseFare,
      ratePerKm: data.ratePerKm,
      minFare: data.minFare,
      peakMultiplier: data.peakMultiplier,
      notes: data.notes,
    }
  });
};

export const deleteBasePricing = async (id: string) =>
  prisma.courierPricing.delete({ where: { id } });

export const getCategoryStats = async () => {
  const categories = await prisma.courierCategory.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: { deliveries: true }
      }
    }
  });

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthlyDeliveries = await prisma.delivery.groupBy({
    by: ['category'],
    where: {
      createdAt: { gte: startOfMonth }
    },
    _count: true
  });

  const monthlyMap = new Map();
  monthlyDeliveries.forEach(d => {
    monthlyMap.set(d.category, d._count);
  });

  return categories.map(cat => ({
    ...cat,
    totalDeliveries: cat._count.deliveries,
    monthlyDeliveries: monthlyMap.get(cat.name) || 0
  }));
};

export const getDisputeById = async (id: string) =>
  prisma.courierDispute.findUnique({
    where: { id },
    include: {
      driver: {
        select: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true } },
          vehiclePlate: true,
          vehicleModel: true,
        }
      }
    }
  });

export const processDisputeAction = async (id: string, action: string, amount?: number, notes?: string) => {
  const dispute = await prisma.courierDispute.findUnique({ where: { id } });
  if (!dispute) throw new Error('Dispute not found');

  let updateData: any = {};

  switch (action) {
    case 'PROCESS_REFUND':
      if (amount) updateData.refundAmount = amount;
      updateData.resolutionNotes = notes || `Refund of $${amount || dispute.refundAmount} processed`;
      break;
    case 'APPLY_PENALTY':
      updateData.resolutionNotes = notes || `Penalty of $${amount} applied to driver`;
      // Here you would also update driver's wallet/earnings
      break;
    case 'INSURANCE_CLAIM':
      updateData.resolutionNotes = notes || 'Insurance claim initiated';
      break;
    case 'ESCALATE_CASE':
      updateData.status = 'ESCALATED';
      updateData.resolutionNotes = notes || 'Case escalated to management';
      break;
    default:
      updateData.resolutionNotes = notes;
  }

  return prisma.courierDispute.update({ where: { id }, data: updateData });
};

export const bulkUpdatePayoutStatus = async (ids: string[], status: string) => {
  const updateData: any = { status };
  if (status === 'APPROVED') updateData.approvedAt = new Date();
  if (status === 'PAID') updateData.paidAt = new Date();
  
  return prisma.courierPayout.updateMany({
    where: { id: { in: ids } },
    data: updateData
  });
};

export const getPayoutSummaryStats = async () => {
  const [pendingPayouts, paidThisMonth, totalPaid] = await Promise.all([
    prisma.courierPayout.aggregate({
      where: { status: 'PENDING' },
      _sum: { pendingAmount: true }
    }),
    prisma.courierPayout.aggregate({
      where: {
        status: 'PAID',
        paidAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      },
      _sum: { pendingAmount: true }
    }),
    prisma.courierPayout.aggregate({
      where: { status: 'PAID' },
      _sum: { pendingAmount: true }
    }),
  ]);

  return {
    pendingPayouts: pendingPayouts._sum.pendingAmount || 0,
    paidThisMonth: paidThisMonth._sum.pendingAmount || 0,
    totalPaid: totalPaid._sum.pendingAmount || 0,
  };
};

export const updateGeographicZone = async (id: string, data: any) => {
  // Check if zone exists
  const existingZone = await prisma.geographicZone.findUnique({ where: { id } });
  if (!existingZone) {
    throw new Error('Geographic zone not found');
  }
  
  // Check if another zone with same name exists (excluding current)
  if (data.name) {
    const duplicateZone = await prisma.geographicZone.findFirst({
      where: {
        name: data.name,
        id: { not: id }
      }
    });
    if (duplicateZone) {
      throw new Error('Zone with this name already exists');
    }
  }
  
  return prisma.geographicZone.update({
    where: { id },
    data: {
      name: data.name,
      type: data.type,
      multiplier: data.multiplier,
      ratePerKm: data.ratePerKm,
      isActive: data.isActive ?? existingZone.isActive
    }
  });
};

export const deleteGeographicZone = async (id: string) => {
  // Check if zone exists
  const zone = await prisma.geographicZone.findUnique({ where: { id } });
  if (!zone) {
    throw new Error('Geographic zone not found');
  }
  
  // TODO: Check if zone is referenced by any active deliveries
  // const deliveriesCount = await prisma.delivery.count({
  //   where: { zoneId: id, status: { not: 'Delivered' } }
  // });
  // if (deliveriesCount > 0) {
  //   throw new Error('Cannot delete zone with active deliveries');
  // }
  
  return prisma.geographicZone.delete({ where: { id } });
};

// Category Services (Missing)
export const getAllCourierCategories = async () => {
  return prisma.courierCategory.findMany({
    orderBy: { name: 'asc' }
  });
};

export const getCourierCategoryById = async (id: string) => {
  const category = await prisma.courierCategory.findUnique({
    where: { id },
    include: {
      deliveries: {
        select: {
          id: true,
          status: true,
          createdAt: true
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      }
    }
  });
  
  if (!category) {
    throw new Error('Category not found');
  }
  
  // Get delivery counts
  const totalDeliveries = await prisma.delivery.count({
    where: { category: category.name }
  });
  
  const monthlyDeliveries = await prisma.delivery.count({
    where: {
      category: category.name,
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    }
  });
  
  return {
    ...category,
    stats: {
      totalDeliveries,
      monthlyDeliveries
    }
  };
};

export const updateCourierCategory = async (id: string, data: any) => {
  // Check if category exists
  const existingCategory = await prisma.courierCategory.findUnique({ where: { id } });
  if (!existingCategory) {
    throw new Error('Category not found');
  }
  
  // Check if another category with same name exists (excluding current)
  if (data.name && data.name !== existingCategory.name) {
    const duplicateCategory = await prisma.courierCategory.findFirst({
      where: {
        name: data.name,
        id: { not: id }
      }
    });
    if (duplicateCategory) {
      throw new Error('Category with this name already exists');
    }
  }
  
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.vehicleRestriction !== undefined) updateData.vehicleRestriction = data.vehicleRestriction;
  if (data.insuranceLevel !== undefined) updateData.insuranceLevel = data.insuranceLevel;
  if (data.pricingMultiplier !== undefined) updateData.pricingMultiplier = data.pricingMultiplier;
  if (data.maxDeliveryWindow !== undefined) updateData.maxDeliveryWindow = data.maxDeliveryWindow;
  if (data.requirements !== undefined) updateData.requirements = data.requirements;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  
  return prisma.courierCategory.update({
    where: { id },
    data: updateData
  });
};

export const deleteCourierCategory = async (id: string) => {
  // Check if category exists
  const category = await prisma.courierCategory.findUnique({ where: { id } });
  if (!category) {
    throw new Error('Category not found');
  }
  
  // Check if category has any deliveries
  const deliveriesCount = await prisma.delivery.count({
    where: { category: category.name }
  });
  
  if (deliveriesCount > 0) {
    throw new Error(`Cannot delete category with ${deliveriesCount} existing deliveries. Consider marking as inactive instead.`);
  }
  
  return prisma.courierCategory.delete({ where: { id } });
};