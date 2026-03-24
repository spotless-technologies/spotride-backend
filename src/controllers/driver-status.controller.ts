import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { DriverRequest } from '../middleware/driver';
import { z } from 'zod';

export const toggleOnlineStatus = async (req: DriverRequest, res: Response) => {
  const { isOnline } = z.object({ isOnline: z.boolean() }).parse(req.body);

  const driver = await prisma.driver.update({
    where: { id: req.driver!.driverId },
    data: { isOnline },
  });

  res.json({ message: `Driver is now ${isOnline ? 'online' : 'offline'}`, isOnline: driver.isOnline });
};

export const getStatus = async (req: DriverRequest, res: Response) => {
  const driver = await prisma.driver.findUnique({
    where: { id: req.driver!.driverId },
    select: { isOnline: true, lastLocationUpdate: true },
  });

  res.json(driver);
};

export const updateLocation = async (req: DriverRequest, res: Response) => {
  const { lat, lng } = z.object({
    lat: z.number(),
    lng: z.number(),
  }).parse(req.body);

  await prisma.driver.update({
    where: { id: req.driver!.driverId },
    data: {
      currentLocation: { lat, lng, updatedAt: new Date() },
      lastLocationUpdate: new Date(),
    },
  });

  res.json({ message: 'Location updated' });
};