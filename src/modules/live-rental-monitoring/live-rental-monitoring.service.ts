import prisma from '../../config/prisma';

export const getLiveRentalStats = async () => {
  const now = new Date();

  const [activeRentals, endingSoon, overdueReturns, liveRevenue] = await Promise.all([
    prisma.carRentalBooking.count({ where: { status: 'active' } }),
    prisma.carRentalBooking.count({
      where: { 
        status: 'active',
        endDate: { lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) } // ending in 24hrs
      }
    }),
    prisma.carRentalBooking.count({
      where: { 
        status: 'active',
        endDate: { lt: now }
      }
    }),
    prisma.carRentalBooking.aggregate({
      where: { status: 'active' },
      _sum: { totalPrice: true }
    }),
  ]);

  return {
    activeRentals,
    endingSoon,
    overdueReturns,
    liveRevenue: liveRevenue._sum.totalPrice || 0,
  };
};

export const getActiveRentals = async (page: number = 1, limit: number = 20, status?: string, search?: string) => {
  const skip = (page - 1) * limit;
  const now = new Date();

  const where: any = { status: 'active' };

  if (status === 'overdue') where.endDate = { lt: now };
  if (status === 'ending_soon') where.endDate = { lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) };

  if (search) {
    where.OR = [
      { car: { vehicleModel: { contains: search, mode: 'insensitive' } } },
      { driver: { user: { firstName: { contains: search, mode: 'insensitive' } } } },
    ];
  }

  const [rentals, total] = await Promise.all([
    prisma.carRentalBooking.findMany({
      skip,
      take: limit,
      where,
      include: {
        car: true,
        driver: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } }
      },
      orderBy: { endDate: 'asc' },
    }),
    prisma.carRentalBooking.count({ where }),
  ]);

  return {
    data: rentals,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

export const getLiveMapData = async () => {
  const activeBookings = await prisma.carRentalBooking.findMany({
    where: { status: 'active' },
    include: {
      car: true,
      driver: {
        include: {
          user: {
            select: { firstName: true, lastName: true }
          }
        }
      }
    }
  });

  return activeBookings.map(booking => {
    const location = booking.driver.currentLocation as { lat: number; lng: number } | null;

    return {
      bookingId: booking.id,
      vehicle: booking.car.vehicleModel,
      renter: `${booking.driver.user.firstName} ${booking.driver.user.lastName}`.trim(),
      status: booking.endDate < new Date() ? 'overdue' : 'active',
      
      location: location ? {
        lat: location.lat,
        lng: location.lng
      } : null,

      overdueBy: booking.endDate < new Date() 
        ? Math.floor((new Date().getTime() - booking.endDate.getTime()) / (1000 * 60 * 60)) + 'h'
        : null,
    };
  }).filter(item => item.location !== null); // Only show rentals with live location
};