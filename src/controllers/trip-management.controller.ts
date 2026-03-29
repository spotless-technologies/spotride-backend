import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { z } from 'zod';

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(5).max(100).default(20),
  status: z.enum(['completed', 'ongoing', 'cancelled', 'all']).optional(),
  search: z.string().optional(),
});

// ==================== LIVE TRACKING ====================

export const getLiveTrackingStats = async (req: Request, res: Response) => {
  try {
    const [activeTrips, enRoute, inProgress, alerts] = await Promise.all([
      prisma.trip.count({ where: { status: 'ongoing' } }),
      prisma.trip.count({ where: { status: 'accepted' } }),
      prisma.trip.count({ where: { status: 'arrived' } }),
      prisma.trip.count({ where: { status: 'cancelled' } }),
    ]);

    res.json({
      activeTrips,
      enRoute,
      inProgress,
      alerts,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load live tracking stats' });
  }
};

export const getLiveTrackingMap = async (req: Request, res: Response) => {
  try {
    const liveTrips = await prisma.trip.findMany({
      where: { 
        status: { in: ['ongoing', 'arrived', 'accepted'] } 
      },
      include: {
        driver: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        rider: {
          select: { firstName: true, lastName: true },
        },
      },
      take: 100,
      orderBy: { updatedAt: 'desc' },
    });

    const mapData = liveTrips.map((trip) => ({
      id: trip.id,
      lat: (trip.pickupLocation as any)?.lat || 0,
      lng: (trip.pickupLocation as any)?.lng || 0,
      status: trip.status,
      riderName: trip.rider 
        ? `${trip.rider.firstName} ${trip.rider.lastName}`.trim() 
        : 'Unknown Rider',
      driverName: trip.driver?.user 
        ? `${trip.driver.user.firstName} ${trip.driver.user.lastName}`.trim() 
        : 'Unknown Driver',
      pickupLocation: trip.pickupLocation,
      dropoffLocation: trip.dropoffLocation,
    }));

    res.json(mapData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load live map data' });
  }
};

export const getActiveTrips = async (req: Request, res: Response) => {
  try {
    const activeTrips = await prisma.trip.findMany({
      where: { status: { in: ['ongoing', 'arrived', 'accepted'] } },
      include: {
        driver: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        rider: { select: { firstName: true, lastName: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(activeTrips);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load active trips' });
  }
};

// ==================== TRIP HISTORY ====================

export const getTripHistory = async (req: Request, res: Response) => {
  const { page = 1, limit = 20, status, search } = paginationSchema.parse(req.query);

  const skip = (page - 1) * limit;

  const where: any = {};
  if (status && status !== 'all') where.status = status;

  if (search) {
    where.OR = [
      { id: { contains: search } },
      { rider: { firstName: { contains: search, mode: 'insensitive' } } },
      { rider: { lastName: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [trips, total] = await Promise.all([
    prisma.trip.findMany({
      skip,
      take: limit,
      where,
      include: {
        driver: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        rider: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.trip.count({ where }),
  ]);

  res.json({
    data: trips,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
};

export const getTripDetails = async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      driver: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        },
      },
      rider: { 
        select: { firstName: true, lastName: true, email: true, phone: true } 
      },
    },
  });

  if (!trip) {
    return res.status(404).json({ message: 'Trip not found' });
  }

  res.json(trip);
};