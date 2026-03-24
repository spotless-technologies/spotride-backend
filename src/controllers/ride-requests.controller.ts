import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { DriverRequest } from '../middleware/driver';
import { z } from 'zod';

export const acceptRide = async (req: DriverRequest, res: Response) => {
  const { rideId } = z.object({ rideId: z.string().uuid() }).parse(req.params);

  const ride = await prisma.trip.update({
    where: { id: rideId },
    data: { driverId: req.driver!.driverId, status: 'accepted' },
  });

  res.json({ message: 'Ride accepted', ride });
};

export const declineRide = async (req: DriverRequest, res: Response) => {
  const { rideId } = z.object({ rideId: z.string().uuid() }).parse(req.params);

  await prisma.trip.update({
    where: { id: rideId },
    data: { status: 'declined' },
  });

  res.json({ message: 'Ride declined' });
};

export const getActiveRide = async (req: DriverRequest, res: Response) => {
  const ride = await prisma.trip.findFirst({
    where: {
      driverId: req.driver!.driverId,
      status: { in: ['accepted', 'arrived', 'ongoing'] },
    },
    include: { rider: true },
  });

  res.json(ride || null);
};

export const markArrived = async (req: DriverRequest, res: Response) => {
  const { rideId } = z.object({ rideId: z.string().uuid() }).parse(req.params);

  const ride = await prisma.trip.update({
    where: { id: rideId },
    data: { status: 'arrived' },
  });

  res.json({ message: 'Marked as arrived', ride });
};

export const startTrip = async (req: DriverRequest, res: Response) => {
  const { rideId } = z.object({ rideId: z.string().uuid() }).parse(req.params);

  const ride = await prisma.trip.update({
    where: { id: rideId },
    data: { status: 'ongoing' },
  });

  res.json({ message: 'Trip started', ride });
};

export const completeTrip = async (req: DriverRequest, res: Response) => {
  const { rideId } = z.object({ rideId: z.string().uuid() }).parse(req.params);

  const ride = await prisma.trip.update({
    where: { id: rideId },
    data: { status: 'completed' },
  });

  res.json({ message: 'Trip completed', ride });
};

export const cancelRide = async (req: DriverRequest, res: Response) => {
  const { rideId } = z.object({ rideId: z.string().uuid() }).parse(req.params);
  const { reason } = z.object({ reason: z.string() }).parse(req.body);

  const ride = await prisma.trip.update({
    where: { id: rideId },
    data: { status: 'cancelled' },
  });

  res.json({ message: 'Ride cancelled', reason, ride });
};

export const getRideDetails = async (req: DriverRequest, res: Response) => {
  const { rideId } = z.object({ rideId: z.string().uuid() }).parse(req.params);

  const ride = await prisma.trip.findUnique({
    where: { id: rideId },
    include: { rider: true },
  });

  if (!ride) return res.status(404).json({ message: 'Ride not found' });

  res.json(ride);
};