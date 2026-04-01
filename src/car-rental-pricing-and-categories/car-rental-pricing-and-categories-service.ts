import prisma from '../config/prisma';

export const getPricingStats = async () => {
  const [totalCategories, activeCategories, totalVehicles, monthlyRevenue] = await Promise.all([
    prisma.vehicleCategory.count(),
    prisma.vehicleCategory.count({ where: { status: true } }),
    prisma.vehicleCategory.count(),
    prisma.vehicleCategory.aggregate({
      _sum: { monthlyMaxRate: true },
    }),
  ]);

  return {
    totalCategories,
    activeCategories,
    totalVehicles,
    monthlyRevenue: monthlyRevenue._sum.monthlyMaxRate || 0,
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
    data: categories,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

export const createCategory = async (data: any) => {
  return prisma.vehicleCategory.create({
    data: {
      name: data.name,
      description: data.description,
      commissionRate: data.commissionRate,
      dailyMinRate: data.dailyMinRate,
      dailyMaxRate: data.dailyMaxRate,
      weeklyMinRate: data.weeklyMinRate,
      weeklyMaxRate: data.weeklyMaxRate,
      monthlyMinRate: data.monthlyMinRate,
      monthlyMaxRate: data.monthlyMaxRate,
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
      commissionRate: data.commissionRate,
      dailyMinRate: data.dailyMinRate,
      dailyMaxRate: data.dailyMaxRate,
      weeklyMinRate: data.weeklyMinRate,
      weeklyMaxRate: data.weeklyMaxRate,
      monthlyMinRate: data.monthlyMinRate,
      monthlyMaxRate: data.monthlyMaxRate,
      status: data.status,
    },
  });
};

export const deleteCategory = async (id: string) => {
  return prisma.vehicleCategory.delete({ where: { id } });
};