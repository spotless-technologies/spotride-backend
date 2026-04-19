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

  res.status(201).json({ 
    message: "Ride requested successfully", 
    trip 
  });
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

export const createConversation = async (req: Request, res: Response) => {
  const riderId = (req as any).user?.userId;
  const { tripId } = z.object({ tripId: z.string().uuid() }).parse(req.body);

  // Get driverId from trip
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip || !trip.driverId) return res.status(400).json({ message: "Trip not assigned to driver yet" });

  const conversation = await rideService.createConversation(tripId, riderId, trip.driverId);
  res.status(201).json({ message: "Conversation created", conversation });
};

export const sendMessage = async (req: Request, res: Response) => {
  const senderId = (req as any).user?.userId;
  const senderType = (req as any).user?.role === 'RIDER' ? 'RIDER' : 'DRIVER';

  const data = rideDto.sendMessageSchema.parse(req.body);
  const message = await rideService.sendMessage(data.conversationId, senderId, senderType, data);

  res.status(201).json({ message: "Message sent", data: message });
};

export const getConversationMessages = async (req: Request, res: Response) => {
  const { conversationId } = z.object({ conversationId: z.string().uuid() }).parse(req.params);
  const messages = await rideService.getConversationMessages(conversationId);
  res.json(messages);
};

export const markMessageRead = async (req: Request, res: Response) => {
  const { messageId } = rideDto.markMessageReadSchema.parse(req.body);
  await rideService.markMessageRead(messageId);
  res.json({ message: "Message marked as read" });
};

export const getDriverRideRequests = async (req: Request, res: Response) => {
  const driverId = (req as any).driver?.driverId;
  if (!driverId) return res.status(403).json({ message: 'Driver access required' });

  const { lat, lng, radiusKm } = rideDto.driverRideRequestsSchema.parse(req.query);

  const result = await rideService.getDriverRideRequests(lat, lng, radiusKm);
  res.json(result);
};

export const counterBidOnRide = async (req: Request, res: Response) => {
  const driverId = (req as any).driver?.driverId;
  if (!driverId) return res.status(403).json({ message: 'Driver access required' });

  const { tripId } = z.object({ tripId: z.string().uuid() }).parse(req.params);
  const { offeredPrice } = rideDto.counterBidSchema.parse(req.body);

  const updatedTrip = await rideService.counterBidOnRide(driverId, tripId, offeredPrice);

  res.json({ 
    message: "Counter-bid submitted successfully. Rider will be notified.", 
    trip: updatedTrip 
  });
};

export const arrivedAtPickup = async (req: Request, res: Response) => {
  const { tripId } = rideDto.arrivedAtPickupSchema.parse(req.body);
  const trip = await rideService.arrivedAtPickup(tripId);
  res.json({ message: "Arrived at pickup location", trip });
};

export const getTripInfo = async (req: Request, res: Response) => {
  try {
    const { tripId } = rideDto.tripInfoSchema.parse(req.params);   

    const trip = await rideService.getTripInfo(tripId);

    res.json(trip);
  } catch (error: any) {
    if (error.message === "Trip not found") {
      return res.status(404).json({ message: "Trip not found" });
    }
    console.error("Get Trip Info error:", error);
    res.status(500).json({ message: "Failed to fetch trip information" });
  }
};

export const rateDriver = async (req: Request, res: Response) => {
  const { tripId, rating, feedback } = rideDto.rateDriverSchema.parse(req.body);
  await rideService.rateDriver(tripId, rating, feedback);
  res.json({ message: "Thank you for rating the driver" });
};

export const cancelRide = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId || (req as any).driver?.userId;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  const { tripId } = z.object({ tripId: z.string().uuid() }).parse(req.params);
  const { reason } = rideDto.cancelRideSchema.parse(req.body);

  const result = await rideService.cancelRide(tripId, userId, reason);
  res.json({ message: "Ride cancelled successfully", trip: result });
};

export const getVehicleCategories = async (req: Request, res: Response) => {
  try {
    const categories = await rideService.getVehicleCategories();

    if (!categories || categories.length === 0) {
      return res.json({
        success: true,
        message: "No active vehicle categories found",
        categories: [],
        count: 0,
      });
    }

    res.json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error: any) {
    console.error("Error in getVehicleCategories:", error);
    res.status(500).json({ 
      message: "Failed to fetch vehicle categories. Please try again later." 
    });
  }
};

export const cancelScheduledRide = async (req: Request, res: Response) => {
  const riderId = (req as any).user?.userId;
  if (!riderId) return res.status(401).json({ message: 'Unauthorized' });

  const { scheduledRideId } = z.object({ scheduledRideId: z.string().uuid() }).parse(req.params);
  const { reason } = rideDto.cancelScheduledRideSchema.parse(req.body);

  const result = await rideService.cancelScheduledRide(scheduledRideId, riderId, reason);
  res.json({ message: "Scheduled ride cancelled successfully", ride: result });
};

export const editScheduledTrip = async (req: Request, res: Response) => {
  const riderId = (req as any).user?.userId;
  if (!riderId) return res.status(401).json({ message: 'Unauthorized' });

  const { scheduledRideId } = z.object({ scheduledRideId: z.string().uuid() }).parse(req.params);
  const { scheduledTime } = rideDto.editScheduledTripSchema.parse(req.body);

  const result = await rideService.editScheduledTrip(scheduledRideId, riderId, scheduledTime);
  res.json({ message: "Scheduled trip updated successfully", ride: result });
};

// ====================== RIDER MY TRIPS ======================
export const getRiderMyTrips = async (req: Request, res: Response) => {
  try {
    const riderId = (req as any).user?.userId;
    if (!riderId) {
      return res.status(401).json({ message: "Unauthorized - Rider ID not found" });
    }

    const tab = (req.query.tab as string) || 'upcoming';

    // Validate tab parameter
    const validTabs = ['upcoming', 'past', 'scheduled'];
    if (!validTabs.includes(tab as string)) {
      return res.status(400).json({ 
        message: "Invalid tab. Must be one of: upcoming, past, scheduled" 
      });
    }

    const trips = await rideService.getRiderMyTrips(
      riderId, 
      tab as 'upcoming' | 'past' | 'scheduled'
    );

    res.json({
      success: true,
      tab,
      count: trips.length,
      trips,                    
    });
  } catch (error: any) {
    console.error("Error fetching rider my trips:", error);
    res.status(500).json({ 
      message: "Failed to fetch your trips. Please try again later.",
      error: error.message 
    });
  }
};

// ====================== DRIVER MY TRIPS ======================
export const getDriverMyTrips = async (req: Request, res: Response) => {
  try {
    const driverId = (req as any).driver?.driverId;   
    if (!driverId) {
      return res.status(401).json({ message: "Unauthorized - Driver profile not found" });
    }

    const { tab = 'completed' } = req.query;

    // Validate tab parameter
    const validTabs = ['completed', 'scheduled'];
    if (!validTabs.includes(tab as string)) {
      return res.status(400).json({ 
        message: "Invalid tab. Must be one of: completed, scheduled" 
      });
    }

    const trips = await rideService.getDriverMyTrips(
      driverId, 
      tab as 'completed' | 'scheduled'
    );

    res.json({
      success: true,
      tab,
      count: trips.length,
      trips,                    
    });
  } catch (error: any) {
    console.error("Error fetching driver my trips:", error);
    res.status(500).json({ 
      message: "Failed to fetch your trips. Please try again later.",
      error: error.message 
    });
  }
};