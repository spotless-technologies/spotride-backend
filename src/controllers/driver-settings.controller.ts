import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { DriverRequest } from '../middleware/driver';
import { z } from 'zod';
import { UserRole } from '@prisma/client';

const updateSettingsSchema = z.object({
  language: z.string().optional(),
  pushNotifications: z.boolean().optional(),
  navigationPreference: z.string().optional(),
});

const bankAccountSchema = z.object({
  bankName: z.string().min(2),
  accountNumber: z.string().min(8),
  accountName: z.string().min(2),
});

const switchModeSchema = z.object({
  mode: z.enum(['driver', 'rider']),
});

export const getSettings = async (req: DriverRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.driver!.userId },
    select: {
      language: true,
      pushNotifications: true,
      navigationPreference: true,
    },
  });

  res.json(user || {});
};

export const updateSettings = async (req: DriverRequest, res: Response) => {
  const data = updateSettingsSchema.parse(req.body);

  await prisma.user.update({
    where: { id: req.driver!.userId },
    data,
  });

  res.json({ message: 'Settings updated' });
};

export const updateBankAccount = async (req: DriverRequest, res: Response) => {
  const data = bankAccountSchema.parse(req.body);

  await prisma.driver.update({
    where: { id: req.driver!.driverId },
    data: {
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      accountName: data.accountName,
    },
  });

  res.json({ message: 'Bank account updated' });
};

export const switchMode = async (req: DriverRequest, res: Response) => {
  const { mode } = switchModeSchema.parse(req.body);

  let newRole: UserRole;

  switch (mode) {
    case 'driver':
      newRole = UserRole.DRIVER;
      break;
    case 'rider':
      newRole = UserRole.RIDER;
      break;
    default:
      return res.status(400).json({ message: 'Invalid mode. Must be "driver" or "rider"' });
  }

  await prisma.user.update({
    where: { id: req.driver!.userId },
    data: { role: newRole },
  });

  res.json({ message: `Switched to ${mode} mode`, currentMode: newRole });
};

export const getCurrentMode = async (req: DriverRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.driver!.userId },
    select: { role: true },
  });

  res.json({ mode: user?.role.toLowerCase() });
};