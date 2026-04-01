import { Request, Response } from 'express';
import prisma from '../../config/prisma';
import { z } from 'zod';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(10).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
});

export const listCarOwners = async (req: Request, res: Response) => {
  const { page, limit, search, status } = querySchema.parse(req.query);
  const skip = (page - 1) * limit;

  const where: any = status ? { status } : {};
  if (search) {
    where.user = {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  const [data, total] = await Promise.all([
    prisma.carOwner.findMany({
      skip,
      take: limit,
      where,
      include: { user: { select: { firstName: true, lastName:true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.carOwner.count({ where }),
  ]);

  res.json({
    data,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

export const getCarOwnerDetails = async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);

  const owner = await prisma.carOwner.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!owner) return res.status(404).json({ message: 'Car owner not found' });

  res.json(owner);
};

export const approveCarOwner = async (req: Request, res: Response) => {
 const { id } = z.object({ id: z.string().uuid() }).parse(req.params);

  const owner = await prisma.carOwner.update({
    where: { id },
    data: { status: 'approved', approvedAt: new Date() },
    include: { user: true },
  });

  res.json({ message: 'Car owner approved', owner });
};

export const rejectCarOwner = async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);

  const { reason } = z.object({ reason: z.string() }).parse(req.body);

  const owner = await prisma.carOwner.update({
    where: { id },
    data: { status: 'rejected', rejectionReason: reason },
  });

  res.json({ message: 'Car owner rejected', owner });
};