import prisma from '../../config/prisma';

export const getPricingStats = async () => {
  const [totalCategories, activeCategories, inactiveCategories, monthlyRevenue] = await Promise.all([
    prisma.vehicleCategory.count(),
    prisma.vehicleCategory.count({ where: { status: true } }),
    prisma.vehicleCategory.count({ where: { status: false } }),
    prisma.vehicleCategory.aggregate({
      _sum: { baseFare: true }, 
    }),
  ]);

  return {
    totalCategories,
    activeCategories,
    inactiveCategories,
    monthlyRevenue: monthlyRevenue._sum.baseFare || 0,
  };
};

export const getCategories = async (page: number = 1, limit: number = 20, status?: string, search?: string) => {
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) where.status = status === 'active';
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [categories, total] = await Promise.all([
    prisma.vehicleCategory.findMany({
      skip,
      take: limit,
      where,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.vehicleCategory.count({ where }),
  ]);

  return {
    data: categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      baseFare: cat.baseFare,
      ratePerKm: cat.ratePerKm,
      waitingCharge: cat.waitingCharge,
      surgeMultiplier: cat.surgeMultiplier,
      capacity: cat.capacity,
      features: cat.features,
      commissionRate: cat.commissionRate,
      status: cat.status ? 'Active' : 'Inactive',
    })),
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

export const createCategory = async (data: any) => {
  return prisma.vehicleCategory.create({
    data: {
      name: data.name,
      description: data.description,
      baseFare: data.baseFare,
      ratePerKm: data.ratePerKm,
      waitingCharge: data.waitingCharge,
      surgeMultiplier: data.surgeMultiplier,
      capacity: data.capacity,
      features: data.features,
      commissionRate: data.commissionRate,
      status: data.status,
    },
  });
};

export const getCategoryById = async (id: string) => {
  const category = await prisma.vehicleCategory.findUnique({ where: { id } });
  if (!category) throw new Error('Category not found');
  return category;
};

export const updateCategory = async (id: string, data: any) => {
  return prisma.vehicleCategory.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      baseFare: data.baseFare,
      ratePerKm: data.ratePerKm,
      waitingCharge: data.waitingCharge,
      surgeMultiplier: data.surgeMultiplier,
      capacity: data.capacity,
      features: data.features,
      commissionRate: data.commissionRate,
      status: data.status,
    },
  });
};

export const deleteCategory = async (id: string) => {
  return prisma.vehicleCategory.delete({ where: { id } });
};