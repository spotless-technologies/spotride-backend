import prisma from '../config/prisma';

export const getCourierStats = async () => {
  const [activeDrivers, inProgress, todaysCompleted, dailyRevenue] = await Promise.all([
    prisma.courier.count({ where: { status: 'Online' } }),
    prisma.delivery.count({ where: { status: 'In Transit' } }),
    prisma.delivery.count({
      where: { 
        status: 'Delivered', 
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
      }
    }),
    prisma.delivery.aggregate({
      where: { 
        status: 'Delivered', 
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
      },
      _sum: { fare: true },
    }),
  ]);

  return {
    activeDrivers,
    inProgress,
    todaysCompleted,
    dailyRevenue: dailyRevenue._sum.fare || 0,
  };
};

export const getCourierDrivers = async (page: number = 1, limit: number = 20, status?: string, vehicleType?: string, search?: string) => {
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status && status !== 'all') where.status = status;
  if (vehicleType && vehicleType !== 'all') where.vehicleType = vehicleType;
  if (search) {
    where.OR = [
      { driver: { user: { firstName: { contains: search, mode: 'insensitive' } } } },
      { driver: { user: { lastName: { contains: search, mode: 'insensitive' } } } },
    ];
  }

  const [couriers, total] = await Promise.all([
    prisma.courier.findMany({
      skip,
      take: limit,
      where,
      include: {
        driver: {
          include: {
            user: {
              select: { firstName: true, lastName: true, phone: true }
            }
          }
        }
      },
      orderBy: { rating: 'desc' },
    }),
    prisma.courier.count({ where }),
  ]);

  return {
    data: couriers,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

export const getActiveDeliveries = async () => {
  const deliveries = await prisma.delivery.findMany({
    where: { status: 'In Transit' },
    include: {
      courier: {
        include: {
          driver: {
            include: {
              user: { select: { firstName: true, lastName: true } }
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  return deliveries;
};

export const getDeliveryHistory = async (page: number = 1, limit: number = 20, status?: string, search?: string) => {
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status && status !== 'all') where.status = status;
  if (search) {
    where.OR = [
      { trackingNumber: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [deliveries, total] = await Promise.all([
    prisma.delivery.findMany({
      skip,
      take: limit,
      where,
      include: {
        courier: {
          include: {
            driver: {
              include: {
                user: { select: { firstName: true, lastName: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.delivery.count({ where }),
  ]);

  return {
    data: deliveries,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};