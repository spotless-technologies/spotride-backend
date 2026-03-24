import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { DriverRequest } from '../middleware/driver';
import { z } from 'zod';

export const getNotifications = async (req: DriverRequest, res: Response) => {
  const { page = 1, limit = 20 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: req.driver!.userId },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where: { userId: req.driver!.userId } }),
  ]);

  res.json({
    data: notifications,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
};

export const markNotificationRead = async (req: DriverRequest, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);

  await prisma.notification.update({
    where: { id },
    data: { read: true },
  });

  res.json({ message: 'Notification marked as read' });
};

export const markAllNotificationsRead = async (req: DriverRequest, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.driver!.userId },
    data: { read: true },
  });

  res.json({ message: 'All notifications marked as read' });
};

export const registerFcmToken = async (req: DriverRequest, res: Response) => {
  const { token } = z.object({ token: z.string().min(10) }).parse(req.body);

  await prisma.user.update({
    where: { id: req.driver!.userId },
    data: { fcmToken: token },
  });

  res.json({ message: 'FCM token registered/updated' });
};