import { Request, Response } from 'express';
import * as rideService from './ride-booking.service';
import { z } from 'zod';

export const getFareEstimate = async (req: Request, res: Response) => {
  const data = z.object({
    pickupLat: z.number(),
    pickupLng: z.number(),
    destinationLat: z.number(),
    destinationLng: z.number(),
    rideType: z.enum(['ECONOMY', 'COMFORT', 'LUXURY']).optional(),
  }).parse(req.body);

  const estimate = await rideService.calculateFareEstimate(data);
  res.json(estimate);
};

export const requestRide = async (req: Request, res: Response) => {
  const riderId = (req as any).user?.userId;
  if (!riderId) return res.status(401).json({ message: 'Unauthorized' });

  const data = req.body;
  const trip = await rideService.requestRide(riderId, data);
  res.status(201).json({ message: "Ride requested successfully", trip });
};

export const driverAcceptRide = async (req: Request, res: Response) => {
  const driverId = (req as any).driver?.driverId;
  if (!driverId) return res.status(403).json({ message: 'Driver access required' });

  const { tripId } = z.object({ tripId: z.string().uuid() }).parse(req.body);
  const trip = await rideService.driverAcceptRide(driverId, tripId);
  res.json({ message: "Ride accepted", trip });
};

export const startTrip = async (req: Request, res: Response) => {
  const { tripId } = z.object({ tripId: z.string().uuid() }).parse(req.body);
  const trip = await rideService.startTrip(tripId);
  res.json({ message: "Trip started", trip });
};

export const endTrip = async (req: Request, res: Response) => {
  const { tripId, actualFare } = z.object({
    tripId: z.string().uuid(),
    actualFare: z.number().positive().optional(),
  }).parse(req.body);

  const trip = await rideService.endTrip(tripId, actualFare);
  res.json({ message: "Trip completed", trip });
};