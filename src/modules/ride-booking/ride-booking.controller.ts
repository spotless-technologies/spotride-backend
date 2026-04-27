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
  try {
    const { tripId } = rideDto.startTripSchema.parse(req.body);
    
    // Get trip details before starting
    const existingTrip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        rider: { select: { firstName: true, lastName: true, phone: true } },
        driver: { include: { user: { select: { firstName: true, lastName: true } } } }
      }
    });
    
    if (!existingTrip) {
      return res.status(404).json({ message: "Trip not found" });
    }
    
    if (existingTrip.status !== "DRIVER_ASSIGNED" && existingTrip.status !== "DRIVER_ARRIVED") {
      return res.status(400).json({ 
        message: `Cannot start trip. Current status: ${existingTrip.status}. Trip must be in DRIVER_ASSIGNED or DRIVER_ARRIVED state.` 
      });
    }
    
    // Start the trip
    const trip = await rideService.startTrip(tripId);
    
    // Calculate route info for response
    const pickup = existingTrip.pickupLocation as any;
    const dropoff = existingTrip.dropoffLocation as any;
    
    res.json({ 
      message: "Trip started successfully",
      success: true,
      trip: {
        id: trip.id,
        status: trip.status,
        startTime: trip.startTime,
        routeInformation: {
          pickupLocation: pickup?.address || `${pickup?.lat}, ${pickup?.lng}`,
          dropoffLocation: dropoff?.address || `${dropoff?.lat}, ${dropoff?.lng}`,
        },
        rider: {
          name: `${existingTrip.rider.firstName} ${existingTrip.rider.lastName}`,
          phone: existingTrip.rider.phone,
        },
        driver: existingTrip.driver ? {
          name: `${existingTrip.driver.user.firstName} ${existingTrip.driver.user.lastName}`,
        } : null,
        estimatedFare: existingTrip.estimatedFare,
      }
    });
  } catch (error: any) {
    res.status(500).json({ 
      message: "Failed to start trip", 
      error: error.message 
    });
  }
};

// ====================== DRIVER ARRIVING FOR PICKUP CONTROLLER ======================
export const driverArrivingForPickup = async (req: Request, res: Response) => {
  try {
    const driverId = (req as any).driver?.driverId;
    if (!driverId) {
      return res.status(403).json({ message: 'Driver access required' });
    }

    const { tripId, driverLat, driverLng, etaMinutes } = rideDto.driverArrivingPickupSchema.parse(req.body);

    const arrivalData = await rideService.driverArrivingForPickup(
      driverId, 
      tripId, 
      driverLat, 
      driverLng, 
      etaMinutes
    );

    res.json({
      success: true,
      message: "Driver arrival information updated",
      ...arrivalData,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: error.errors 
      });
    }
    if (error.message === "Trip not found") {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === "You don't have permission for this trip") {
      return res.status(403).json({ message: error.message });
    }
    if (error.message.includes("Cannot update arrival")) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Driver arriving error:", error);
    res.status(500).json({ 
      message: "Failed to update driver arrival", 
      error: error.message 
    });
  }
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



// ====================== CREATE CONVERSATION ======================
export const createConversation = async (req: Request, res: Response) => {
  try {
    // Get user from either rider or driver auth
    const userId = (req as any).user?.userId || (req as any).driver?.userId;
    const userRole = (req as any).user?.role || (req as any).driver?.role;
    
    console.log("=== CREATE CONVERSATION DEBUG ===");
    console.log("userId:", userId);
    console.log("userRole:", userRole);
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized - Please login' });
    }

    const { tripId } = z.object({ tripId: z.string().uuid() }).parse(req.body);

    // Get trip with riderId and driverId 
    const trip = await prisma.trip.findUnique({ 
      where: { id: tripId },
      select: {
        id: true,
        riderId: true,
        driverId: true,
        status: true,
      }
    });
    
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    // Get the User IDs from Rider and Driver tables
    let riderUserId = null;
    let driverUserId = null;
    
    if (trip.riderId) {
      const rider = await prisma.rider.findUnique({
        where: { id: trip.riderId },
        select: { userId: true }  
      });
      riderUserId = rider?.userId;
    }
    
    if (trip.driverId) {
      const driver = await prisma.driver.findUnique({
        where: { id: trip.driverId },
        select: { userId: true }  
      });
      driverUserId = driver?.userId;
    }
    
    console.log("Rider User ID:", riderUserId);
    console.log("Driver User ID:", driverUserId);
    console.log("Authenticated User ID:", userId);

    // Check if the authenticated user is the rider or driver
    const isRider = riderUserId === userId;
    const isDriver = driverUserId === userId;
    
    console.log("isRider:", isRider);
    console.log("isDriver:", isDriver);
    
    if (!isRider && !isDriver) {
      return res.status(403).json({ 
        message: "You don't have permission to chat about this trip. Only the rider or driver of this trip can create a conversation.",
        details: {
          riderUserId: riderUserId,
          driverUserId: driverUserId,
          yourUserId: userId
        }
      });
    }
    
    if (!trip.driverId) {
      return res.status(400).json({ message: "Driver not assigned to this trip yet" });
    }

    const conversation = await rideService.getOrCreateConversation(tripId, riderUserId!, driverUserId!);
    res.status(201).json({ 
      message: "Conversation created successfully", 
      conversation 
    });
  } catch (error: any) {
    console.error("Create conversation error:", error);
    res.status(500).json({ message: error.message || "Failed to create conversation" });
  }
};

// ====================== SEND MESSAGE ======================
export const sendMessage = async (req: Request, res: Response) => {
  try {
    // Get sender from either rider or driver auth
    const senderId = (req as any).user?.userId || (req as any).driver?.userId;
    
    if (!senderId) {
      return res.status(401).json({ message: 'Unauthorized - Please login' });
    }

    // Determine sender type based on which auth was used
    let senderType: 'RIDER' | 'DRIVER' = 'RIDER';
    if ((req as any).driver?.userId) {
      senderType = 'DRIVER';
    } else if ((req as any).user?.role === 'RIDER') {
      senderType = 'RIDER';
    }

    const data = rideDto.sendMessageSchema.parse(req.body);
    
    // Verify permission: Check if sender is participant in conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: data.conversationId },
      select: {
        id: true,
        riderId: true,  
        driverId: true, 
      }
    });
    
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    
    const isRider = conversation.riderId === senderId;
    const isDriver = conversation.driverId === senderId;
    
    if (!isRider && !isDriver) {
      return res.status(403).json({ message: "You don't have permission to send messages in this conversation" });
    }
    
    const message = await rideService.sendMessage(
      data.conversationId, 
      senderId, 
      senderType, 
      data
    );
    
    res.status(201).json({ 
      message: "Message sent successfully", 
      data: message 
    });
  } catch (error: any) {
    if (error.message === "Conversation not found") {
      return res.status(404).json({ message: error.message });
    }
    console.error("Send message error:", error);
    res.status(500).json({ message: error.message || "Failed to send message" });
  }
};


// ====================== GET CONVERSATION MESSAGES ======================
export const getConversationMessages = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).driver?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized - Please login' });
    }

    const { conversationId } = req.params;
    const conversationIdString = Array.isArray(conversationId) ? conversationId[0] : conversationId;
    
    if (!conversationIdString) {
      return res.status(400).json({ message: 'Invalid conversation ID' });
    }
    
    // Get conversation with riderId and driverId
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationIdString },
      select: {
        id: true,
        riderId: true,  
        driverId: true, 
      }
    });
    
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    
    const isRider = conversation.riderId === userId;
    const isDriver = conversation.driverId === userId;
    
    if (!isRider && !isDriver) {
      return res.status(403).json({ 
        message: "You don't have permission to view this conversation",
        details: {
          conversationRiderId: conversation.riderId,
          conversationDriverId: conversation.driverId,
          yourUserId: userId
        }
      });
    }

    const messages = await rideService.getConversationMessages(conversationIdString);
    res.json(messages);
  } catch (error: any) {
    console.error("Get messages error:", error);
    res.status(500).json({ message: error.message || "Failed to get messages" });
  }
};

// ====================== MARK MESSAGE READ ======================
export const markMessageRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).driver?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized - Please login' });
    }

    const { messageId } = rideDto.markMessageReadSchema.parse(req.body);
    
    // First verify permission by getting the message and its conversation
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        conversationId: true,
      }
    });
    
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    
    // Get conversation details
    const conversation = await prisma.conversation.findUnique({
      where: { id: message.conversationId },
      select: {
        id: true,
        riderId: true,  
        driverId: true, 
      }
    });
    
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    
    const isRider = conversation.riderId === userId;
    const isDriver = conversation.driverId === userId;
    
    if (!isRider && !isDriver) {
      return res.status(403).json({ message: "You don't have permission to mark messages in this conversation" });
    }
    
    await rideService.markMessageRead(messageId);
    
    res.json({ message: "Message marked as read" });
  } catch (error: any) {
    if (error.message === "Message not found") {
      return res.status(404).json({ message: error.message });
    }
    console.error("Mark message read error:", error);
    res.status(500).json({ message: error.message || "Failed to mark message as read" });
  }
};

// ====================== CALL CONTROLLERS ======================
export const initiateCall = async (req: Request, res: Response) => {
  try {
    const callerId = (req as any).user?.userId || (req as any).driver?.userId;
    if (!callerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { conversationId, receiverId, callType } = rideDto.initiateCallSchema.parse(req.body);

    // Verify caller has access to this conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        riderId: true,  
        driverId: true, 
      }
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Check if caller is a participant 
    const isCallerParticipant = conversation.riderId === callerId || conversation.driverId === callerId;
    
    if (!isCallerParticipant) {
      return res.status(403).json({ message: "You are not a participant in this conversation" });
    }

    // Verify receiver is the other participant
    const isReceiverValid = conversation.riderId === receiverId || conversation.driverId === receiverId;
    
    if (!isReceiverValid) {
      return res.status(400).json({ message: "Invalid receiver. Receiver must be the other participant in this conversation" });
    }

    const result = await rideService.initiateCall(conversationId, callerId, receiverId, callType);

    res.json({
      success: true,
      message: "Call initiated",
      callId: result.call.id,
      roomId: result.roomId,
      status: result.call.status,
    });
  } catch (error: any) {
    console.error("Initiate call error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateCallStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).driver?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { callId, status, signalingData, duration } = rideDto.updateCallStatusSchema.parse(req.body);

    const updatedCall = await rideService.updateCallStatus(callId, userId, status, signalingData, duration);

    res.json({
      success: true,
      message: `Call ${status.toLowerCase()}`,
      call: updatedCall,
    });
  } catch (error: any) {
    console.error("Update call status error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ====================== GET CALL HISTORY ======================
export const getCallHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || (req as any).driver?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Extract conversationId as string from params
    const { conversationId } = req.params;
    const conversationIdString = Array.isArray(conversationId) ? conversationId[0] : conversationId;
    
    if (!conversationIdString) {
      return res.status(400).json({ message: 'Invalid conversation ID' });
    }
    
    // Verify user has access to conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationIdString },
      select: {
        id: true,
        riderId: true,  
        driverId: true, 
      }
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    
    // Direct comparison because riderId and driverId are User IDs
    const isParticipant = conversation.riderId === userId || conversation.driverId === userId;
    
    if (!isParticipant) {
      return res.status(403).json({ message: "You don't have permission to view call history" });
    }

    const { limit, offset } = rideDto.getCallHistorySchema.parse(req.query);

    const calls = await rideService.getCallHistory(conversationIdString, limit, offset);

    res.json({
      success: true,
      count: calls.length,
      calls,
    });
  } catch (error: any) {
    console.error("Get call history error:", error);
    res.status(500).json({ message: error.message });
  }
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

// ====================== GET RIDE OFFERS (FOR RIDER) ======================
export const getRideOffers = async (req: Request, res: Response) => {
  try {
    const riderId = (req as any).user?.userId;
    if (!riderId) {
      return res.status(401).json({ message: "Unauthorized - Rider ID not found" });
    }

    const { tripId } = rideDto.getRideOffersSchema.parse(req.params);

    const result = await rideService.getRideOffers(tripId, riderId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    if (error.message === "Trip not found") {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === "You don't have permission to view offers for this ride") {
      return res.status(403).json({ message: error.message });
    }
    console.error("Error fetching ride offers:", error);
    res.status(500).json({ 
      message: "Failed to fetch ride offers",
      error: error.message 
    });
  }
};
