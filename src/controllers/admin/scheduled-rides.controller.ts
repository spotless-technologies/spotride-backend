import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { z } from 'zod';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(10).max(100).default(20),
  status: z.string().optional(),
  search: z.string().optional(),
});

export const listScheduledRides = async (req: Request, res: Response) => {
  const { page, limit, status, search } = querySchema.parse(req.query);
  const skip = (page - 1) * limit;

  const where: any = status ? { status } : {};
  if (search) {
    where.OR = [
      { rider: { name: { contains: search, mode: 'insensitive' } } },
      { rider: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.scheduledRide.findMany({
      skip,
      take: limit,
      where,
      include: {
        rider: { select: { firstName: true, lastName:true, email: true, phone: true } },
        driver: { include: { user: { select: { firstName: true, lastName:true, } } } },
      },
      orderBy: { scheduledTime: 'desc' },
    }),
    prisma.scheduledRide.count({ where }),
  ]);

  res.json({
    data,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

export const getScheduledRideDetails = async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);

  const ride = await prisma.scheduledRide.findUnique({
    where: { id },
    include: {
      rider: { select: { firstName: true, lastName:true, email: true, phone: true } },
      driver: { include: { user: true } },
    },
  });

  if (!ride) return res.status(404).json({ message: 'Scheduled ride not found' });

  res.json(ride);
};

export const updateScheduledRideStatus = async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);

  const { status } = z.object({ status: z.string() }).parse(req.body);

  const ride = await prisma.scheduledRide.update({
    where: { id },
    data: { status },
  });

  res.json({ message: 'Status updated', ride });
};

export const assignDriverToRide = async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);

  const { driverId } = z.object({ driverId: z.string().uuid() }).parse(req.body);

  const ride = await prisma.scheduledRide.update({
    where: { id },
    data: { driverId, status: 'confirmed' },
    include: { driver: true },
  });

  res.json({ message: 'Driver assigned', ride });
};