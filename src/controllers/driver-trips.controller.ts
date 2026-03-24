import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { DriverRequest } from '../middleware/driver';
import { z } from 'zod';

export const getAllTrips = async (req: DriverRequest, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [trips, total] = await Promise.all([
    prisma.trip.findMany({
      skip,
      take: limit,
      where: { driverId: req.driver!.driverId },
      include: {
        rider: {
          select: {
            firstName: true,
            lastName: true,
            email: true,   
            phone: true,   
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.trip.count({ where: { driverId: req.driver!.driverId } }),
  ]);

  res.json({
    data: trips,
    meta: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
};

export const getTodayTrips = async (req: DriverRequest, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const trips = await prisma.trip.findMany({
    where: {
      driverId: req.driver!.driverId,
      createdAt: { gte: today },
    },
    include: {
      rider: {
        select: {
          firstName: true,
          lastName: true,
          email: true, 
          phone: true,  
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ trips, count: trips.length });
};

export const getTripDetails = async (req: DriverRequest, res: Response) => {
  const { tripId } = z.object({ tripId: z.string().uuid() }).parse(req.params);

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      rider: {
        select: {
          firstName: true,
          lastName: true,
          email: true,  
          phone: true,   
        },
      },
    },
  });

  if (!trip) {
    return res.status(404).json({ message: 'Trip not found' });
  }

  res.json(trip);
};