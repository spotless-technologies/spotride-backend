import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { z } from 'zod';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(10).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'suspended']).optional(),
});

export const listDrivers = async (req: Request, res: Response) => {
  const { page, limit, search, status } = querySchema.parse(req.query);
  const skip = (page - 1) * limit;

  const where: any = status ? { status } : {};
  if (search) {
    where.user = {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        // { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ],
    };
  }

  const [data, total] = await Promise.all([
    prisma.driver.findMany({
      skip,
      take: limit,
      where,
      include: { user: { select: { firstName: true, lastName:true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.driver.count({ where }),
  ]);

  res.json({
    data,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

export const getDriverDetails = async (req: Request, res: Response) => {
  const driver = await prisma.driver.findUnique({
    where: { id: req.params.id as string},
    include: { user: true },
  });

  if (!driver) return res.status(404).json({ message: 'Driver not found' });

  res.json(driver);
};

export const approveDriver = async (req: Request, res: Response) => {
  const driver = await prisma.driver.update({
    where: { id: req.params.id as string},
    data: { status: 'approved', approvedAt: new Date(), documentsVerified: true },
    include: { user: true },
  });

  res.json({ message: 'Driver approved', driver });
};

export const rejectDriver = async (req: Request, res: Response) => {
  const { reason } = req.body;

  const driver = await prisma.driver.update({
    where: { id: req.params.id as string},
    data: { status: 'rejected', rejectionReason: reason },
  });

  res.json({ message: 'Driver rejected', driver });
};

export const suspendDriver = async (req: Request, res: Response) => {
  const driver = await prisma.driver.update({
    where: { id: req.params.id as string},
    data: { status: 'suspended', suspendedAt: new Date() },
  });

  res.json({ message: 'Driver suspended', driver });
};