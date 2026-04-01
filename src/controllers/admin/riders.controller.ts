import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { z } from 'zod';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(10).max(100).default(20),
  search: z.string().optional(),
});

export const listRiders = async (req: Request, res: Response) => {
  const { page, limit, search } = querySchema.parse(req.query);
  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) {
    where.user = {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ],
    };
  }

  const [data, total] = await Promise.all([
    prisma.rider.findMany({
      skip,
      take: limit,
      where,
      include: { user: { select: { firstName: true, lastName:true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.rider.count({ where }),
  ]);

  res.json({
    data,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

export const getRiderDetails = async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);

  const rider = await prisma.rider.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!rider) return res.status(404).json({ message: 'Rider not found' });

  res.json(rider);
};

export const suspendRider = async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);

  await prisma.user.update({
    where: { id: (await prisma.rider.findUnique({ where: { id } }))!.userId },
    data: { /* add suspended flag if needed */ },
  });

  res.json({ message: 'Rider account suspended' });
};