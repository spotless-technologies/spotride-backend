import prisma from '../../config/prisma';

export const getBookingsStats = async () => {
  const [total, active, completed, upcoming, cancelled] = await Promise.all([
    prisma.carRentalBooking.count(),
    prisma.carRentalBooking.count({ where: { status: 'active' } }),
    prisma.carRentalBooking.count({ where: { status: 'completed' } }),
    prisma.carRentalBooking.count({ where: { status: 'upcoming' } }),
    prisma.carRentalBooking.count({ where: { status: 'cancelled' } }),
  ]);

  return { total, active, completed, upcoming, cancelled };
};

export const getBookings = async (page: number = 1, limit: number = 20, status?: string, search?: string) => {
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status && status !== 'all') where.status = status;

  if (search) {
    where.OR = [
      { id: { contains: search } },
      { car: { vehicleModel: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [bookings, total] = await Promise.all([
    prisma.carRentalBooking.findMany({
      skip,
      take: limit,
      where,
      include: {
        car: true,
        driver: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.carRentalBooking.count({ where }),
  ]);

  return {
    data: bookings,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

export const getBookingById = async (id: string) => {
  const booking = await prisma.carRentalBooking.findUnique({
    where: { id },
    include: {
      car: true,
      driver: { include: { user: true } },
    },
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  return booking;
};

export const cancelBooking = async (id: string, reason: string) => {
  await getBookingById(id);

  await prisma.carRentalBooking.update({
    where: { id },
    data: { 
      status: 'cancelled',
      adjustmentReason: reason 
    },
  });

  return { message: 'Booking cancelled successfully' };
};

export const markAsReturned = async (id: string, returnNotes?: string) => {
  await getBookingById(id);

  await prisma.carRentalBooking.update({
    where: { id },
    data: { 
      status: 'completed',
      returnNotes: returnNotes || null 
    },
  });

  return { message: 'Booking marked as returned' };
};

export const adjustBooking = async (id: string, newReturnDate: string, adjustedAmount: number, reason: string) => {
  await getBookingById(id);

  await prisma.carRentalBooking.update({
    where: { id },
    data: {
      endDate: new Date(newReturnDate),
      totalPrice: adjustedAmount,
      adjustmentReason: reason,
    },
  });

  return { message: 'Booking adjustment applied successfully' };
};