import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { z } from 'zod';

const rejectCarSchema = z.object({
  reason: z.string().min(5, "Rejection reason must be at least 5 characters"),
});

export const getCarListingsStats = async (req: Request, res: Response) => {
  try {
    const [pending, approved, underReview, rejected] = await Promise.all([
      prisma.carRental.count({ where: { status: 'pending' } }),
      prisma.carRental.count({ where: { status: 'approved' } }),
      prisma.carRental.count({ where: { status: 'under_review' } }),
      prisma.carRental.count({ where: { status: 'rejected' } }),
    ]);

    res.json({
      pendingReview: pending,
      approved,
      underReview,
      rejected,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load car listings stats' });
  }
};

export const getCarListings = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;

  const skip = (page - 1) * limit;

  const where: any = {};
  if (status && status !== 'all') where.status = status;

  if (search) {
    where.OR = [
      { vehicleModel: { contains: search, mode: 'insensitive' } },
      { vehiclePlate: { contains: search, mode: 'insensitive' } },
      { owner: { user: { firstName: { contains: search, mode: 'insensitive' } } } },
    ];
  }

  const [cars, total] = await Promise.all([
    prisma.carRental.findMany({
      skip,
      take: limit,
      where,
      include: {
        owner: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    }),
    prisma.carRental.count({ where }),
  ]);

  res.json({
    data: cars,
    meta: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
};

export const getCarDetails = async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);

  const car = await prisma.carRental.findUnique({
    where: { id },
    include: {
      owner: {
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        },
      },
    },
  });

  if (!car) return res.status(404).json({ message: 'Car not found' });

  res.json(car);
};

export const approveCar = async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);

  await prisma.carRental.update({
    where: { id },
    data: {
      status: 'approved',
      verificationPercentage: 100,
      rejectionReason: null, 
    },
  });

  res.json({ message: 'Car listing approved successfully' });
};

export const rejectCar = async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const { reason } = rejectCarSchema.parse(req.body);

  await prisma.carRental.update({
    where: { id },
    data: {
      status: 'rejected',
      rejectionReason: reason,   
    },
  });

  res.json({ 
    message: 'Car listing rejected successfully',
    reason 
  });
};