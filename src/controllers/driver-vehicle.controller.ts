import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { DriverRequest } from '../middleware/driver';
import { z } from 'zod';

const updateVehicleSchema = z.object({
  vehicleModel: z.string().optional(),
  vehiclePlate: z.string().optional(),
  vehicleColor: z.string().optional(),
  vehicleYear: z.number().int().optional(),
});

const bookRentalSchema = z.object({
  carId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const getVehicle = async (req: DriverRequest, res: Response) => {
  const driver = await prisma.driver.findUnique({
    where: { id: req.driver!.driverId },
    select: {
      vehicleModel: true,
      vehiclePlate: true,
      vehicleColor: true,
      vehicleYear: true,
    },
  });

  if (!driver) return res.status(404).json({ message: 'Vehicle not found' });

  res.json(driver);
};

export const updateVehicle = async (req: DriverRequest, res: Response) => {
  const data = updateVehicleSchema.parse(req.body);

  const updated = await prisma.driver.update({
    where: { id: req.driver!.driverId },
    data,
  });

  res.json({ message: 'Vehicle information updated', vehicle: updated });
};

export const listRentalCars = async (req: Request, res: Response) => {
  const { page = 1, limit = 20, type } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const where: any = type ? { vehicleType: type } : {};

  const [cars, total] = await Promise.all([
    prisma.carRental.findMany({
      skip,
      take: Number(limit),
      where,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.carRental.count({ where }),
  ]);

  res.json({
    data: cars,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
};

export const bookRental = async (req: DriverRequest, res: Response) => {
  const { carId, startDate, endDate } = bookRentalSchema.parse(req.body);

  // TODO: check availability, calculate price, create booking record
  const booking = await prisma.carRentalBooking.create({
    data: {
      driverId: req.driver!.driverId,
      carId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'pending',
    },
  });

  res.status(201).json({ message: 'Rental booked', booking });
};

export const getMyRentals = async (req: DriverRequest, res: Response) => {
  const { page = 1, limit = 20 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const [rentals, total] = await Promise.all([
    prisma.carRentalBooking.findMany({
      skip,
      take: Number(limit),
      where: { driverId: req.driver!.driverId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.carRentalBooking.count({ where: { driverId: req.driver!.driverId } }),
  ]);

  res.json({
    data: rentals,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
};