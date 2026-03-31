import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { z } from 'zod';
import {
  cancelBookingSchema,
  returnBookingSchema,
  adjustBookingSchema,
} from './dto';

// ==================== STATS ====================

export const getRentalBookingsStats = async (req: Request, res: Response) => {
  try {
    const [total, active, completed, upcoming, cancelled] = await Promise.all([
      prisma.carRentalBooking.count(),
      prisma.carRentalBooking.count({ where: { status: 'active' } }),
      prisma.carRentalBooking.count({ where: { status: 'completed' } }),
      prisma.carRentalBooking.count({ where: { status: 'upcoming' } }),
      prisma.carRentalBooking.count({ where: { status: 'cancelled' } }),
    ]);

    res.json({
      totalBookings: total,
      active,
      completed,
      upcoming,
      cancelled,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to load rental bookings stats' });
  }
};

// ==================== LISTINGS ====================

export const getRentalBookings = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;

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

  res.json({
    data: bookings,
    meta: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
};

export const getRentalBookingDetails = async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);

  const booking = await prisma.carRentalBooking.findUnique({
    where: { id },
    include: {
      car: true,
      driver: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        },
      },
    },
  });

  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }

  res.json(booking);
};

// ==================== ACTIONS ====================

export const cancelBooking = async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const { reason } = cancelBookingSchema.parse(req.body);

  await prisma.carRentalBooking.update({
    where: { id },
    data: { 
      status: 'cancelled',
      adjustmentReason: reason 
    },
  });

  res.json({ message: 'Booking cancelled successfully', reason });
};

export const markAsReturned = async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const { returnNotes } = returnBookingSchema.parse(req.body);

  await prisma.carRentalBooking.update({
    where: { id },
    data: { 
      status: 'completed',
      returnNotes: returnNotes || null 
    },
  });

  res.json({ message: 'Booking marked as returned successfully', returnNotes });
};

export const adjustBooking = async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const { newReturnDate, adjustedAmount, reason } = adjustBookingSchema.parse(req.body);

  await prisma.carRentalBooking.update({
    where: { id },
    data: {
      endDate: new Date(newReturnDate),
      totalPrice: adjustedAmount,
      adjustmentReason: reason,
    },
  });

  res.json({ 
    message: 'Booking adjustment applied successfully',
    newReturnDate,
    adjustedAmount,
    reason 
  });
};