import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  vehicleModel: z.string().optional(),
  vehiclePlate: z.string().optional(),
  vehicleColor: z.string().optional(),
});

export const markReadSchema = z.object({
  id: z.string().uuid(),
});

export const fcmTokenSchema = z.object({
  token: z.string().min(10),
});

export const updateVehicleSchema = z.object({
  vehicleModel: z.string().optional(),
  vehiclePlate: z.string().optional(),
  vehicleColor: z.string().optional(),
  vehicleYear: z.number().int().optional(),
});

export const bookRentalSchema = z.object({
  carId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const updateSettingsSchema = z.object({
  language: z.string().optional(),
  pushNotifications: z.boolean().optional(),
  navigationPreference: z.string().optional(),
});

export const bankAccountSchema = z.object({
  bankName: z.string().min(2),
  accountNumber: z.string().min(8),
  accountName: z.string().min(2),
});

export const switchModeSchema = z.object({
  mode: z.enum(['driver', 'rider']),
});