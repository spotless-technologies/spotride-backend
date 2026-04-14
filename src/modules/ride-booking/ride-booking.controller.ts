import { Request, Response } from 'express';
import * as rideService from './ride-booking.service';
import * as rideDto from './ride-booking.dto';
import prisma from '../../config/prisma';
import z from 'zod';

export const getFareEstimate = async (req: Request, res: Response) => {
  const data = rideDto.rideEstimateSchema.parse(req.body);
  const estimate = await rideService.calculateFareEstimate(data);
  res.json(estimate);
};

export const requestRide = async (req: Request, res: Response) => {
  const riderId = (req as any).user?.userId;
  if (!riderId) return res.status(401).json({ message: 'Unauthorized' });

  const data = rideDto.requestRideSchema.parse(req.body);
  const trip = await rideService.requestRide(riderId, data);
  res.status(201).json({ message: "Ride requested successfully", trip });
};

export const driverAcceptRide = async (req: Request, res: Response) => {
  const driverId = (req as any).driver?.driverId;
  if (!driverId) return res.status(403).json({ message: 'Driver access required' });

  const { tripId, offeredPrice } = rideDto.driverAcceptSchema.parse(req.body);
  const trip = await rideService.driverAcceptRide(driverId, tripId, offeredPrice);
  res.json({ message: "Ride accepted", trip });
};

export const startTrip = async (req: Request, res: Response) => {
  const { tripId } = rideDto.startTripSchema.parse(req.body);
  const trip = await rideService.startTrip(tripId);
  res.json({ message: "Trip started", trip });
};

export const endTrip = async (req: Request, res: Response) => {
  const { tripId, actualFare } = rideDto.endTripSchema.parse(req.body);
  const result = await rideService.endTrip(tripId, actualFare);
  res.json(result);
};

export const initializePayment = async (req: Request, res: Response) => {
  const { tripId, paymentMethod } = rideDto.confirmPaymentSchema.parse(req.body);
   if (paymentMethod === 'CARD') {
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    const paystackData = await rideService.initializePaystackPayment(tripId, trip!.estimatedFare!, (req as any).user.email);
    return res.json({ paymentMethod: 'CARD', authorization_url: paystackData.authorization_url, reference: paystackData.reference });
  }
  res.json({ message: `Payment method ${paymentMethod} confirmed` });
};

export const rateTrip = async (req: Request, res: Response) => {
  const { tripId, rating, feedback } = rideDto.rateTripSchema.parse(req.body);
  await prisma.trip.update({
    where: { id: tripId },
    data: { riderRating: rating, riderFeedback: feedback },
  });
  res.json({ message: "Rating submitted successfully" });
};

export const getNearbyDrivers = async (req: Request, res: Response) => {
  try {
    const { lat, lng, radiusKm } = rideDto.nearbyDriversSchema.parse(req.query);

    const result = await rideService.getNearbyDrivers(lat, lng, radiusKm);

    res.json(result);
  } catch (error: any) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        message: "Validation error",
        errors: (error as any).errors?.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        })) || [],
      });
    }
    res.status(500).json({ 
      message: error.message || "Failed to fetch nearby drivers" 
    });
  }
};