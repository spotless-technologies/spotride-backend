import prisma from '../../config/prisma';
import env from '../../config/env';
import axios from 'axios';
import { Prisma } from '@prisma/client';
import { PRICING_CONFIG } from '../../utils/pricing';

const paystack = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` },
});

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const calculateFareEstimate = async (data: any) => {
  const country = data.country || env.RIDE_DEFAULT_COUNTRY;
  const config = PRICING_CONFIG[country as keyof typeof PRICING_CONFIG] || PRICING_CONFIG.NG;

  const distanceKm = haversineKm(data.pickupLat, data.pickupLng, data.destinationLat, data.destinationLng);
  const durationMin = Math.round((distanceKm / env.RIDE_AVG_SPEED_KMH) * 60);

  const baseFare = config[data.rideType as keyof typeof config] as number || config.REGULAR;

  const subtotal = baseFare 
    + (distanceKm * config.ratePerKm) 
    + (durationMin * config.ratePerMin) 
    + config.bookingFee;

  // TODO: Implement real surge with Redis later
  const surgeMultiplier = 1.0; 

  return {
    distanceKm: Number(distanceKm.toFixed(2)),
    durationMin,
    currency: config.currency,
    estimatedFare: Math.round(subtotal * surgeMultiplier),
    surgeMultiplier,
    rideType: data.rideType,
    country,
  };
};

export const requestRide = async (riderId: string, data: any) => {
  const estimate = await calculateFareEstimate(data);

  return prisma.trip.create({
    data: {
      riderId,
      pickupLocation: { lat: data.pickupLat, lng: data.pickupLng },
      dropoffLocation: { lat: data.destinationLat, lng: data.destinationLng },
      estimatedFare: data.estimatedFare || estimate.estimatedFare,
      currency: estimate.currency,
      country: estimate.country,
      status: "REQUESTED",
      rideType: data.rideType || "REGULAR",
      surgeMultiplier: estimate.surgeMultiplier,
      promoCode: data.promoCode,
    },
  });
};

export const driverAcceptRide = async (driverId: string, tripId: string, offeredPrice?: number) => {
  return prisma.trip.update({
    where: { id: tripId, status: "REQUESTED" },
    data: { driverId, status: "DRIVER_ASSIGNED", actualFare: offeredPrice },
  });
};

export const startTrip = async (tripId: string) => {
  return prisma.trip.update({
    where: { id: tripId, status: "DRIVER_ASSIGNED" },
    data: { status: "IN_PROGRESS", startTime: new Date() },
  });
};

export const endTrip = async (tripId: string, actualFare?: number) => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { driver: true },
  });
  if (!trip || !trip.driver) throw new Error("Trip or driver not found");

  const finalFare = actualFare || trip.estimatedFare!;
  const commission = Math.round(finalFare * env.RIDE_COMMISSION_RATE);

  await prisma.trip.update({
    where: { id: tripId },
    data: {
      status: "COMPLETED",
      endTime: new Date(),
      actualFare: finalFare,
      commissionAmount: commission,
    },
  });

  // Auto deduct commission for CASH payments
  if (trip.paymentMethod === "CASH") {
    await prisma.wallet.upsert({
      where: { userId: trip.driver.userId },
      update: { balance: { decrement: commission } },
      create: { userId: trip.driver.userId, balance: -commission },
    });
  }

  return { message: "Trip completed", commissionDeducted: commission, finalFare };
};

export const getNearbyDrivers = async (lat: number, lng: number, radiusKm: number = 5) => {
  const drivers = await prisma.driver.findMany({
    where: {
      isOnline: true,
      status: 'approved',
      currentLocation: { not: Prisma.JsonNull }, 
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          profilePicture: true,
        },
      },
    },
  });

  // Calculate distance and filter
  const nearby = drivers
    .map((driver) => {
      if (!driver.currentLocation || typeof driver.currentLocation !== 'object') return null;

      const loc = driver.currentLocation as any;
      const driverLat = loc.lat;
      const driverLng = loc.lng;

      if (typeof driverLat !== 'number' || typeof driverLng !== 'number') return null;

      const distanceKm = haversineKm(lat, lng, driverLat, driverLng);

      if (distanceKm > radiusKm) return null;

      const etaMinutes = Math.round((distanceKm / 40) * 60); // 40 km/h average in city

      return {
        driverId: driver.id,
        fullName: `${driver.user.firstName} ${driver.user.lastName}`.trim() || 'Unknown Driver',
        photo: driver.user.profilePicture,
        rating: Number(driver.rating.toFixed(1)),
        vehicleType: driver.vehicleType,
        vehicleModel: driver.vehicleModel,
        vehicleColor: driver.vehicleColor,
        distanceKm: Number(distanceKm.toFixed(2)),
        etaMinutes,
        lastUpdated: driver.lastLocationUpdate,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => a.distanceKm - b.distanceKm); // closest first

  return {
    count: nearby.length,
    radiusKm,
    drivers: nearby,
  };
};

export const createConversation = async (tripId: string, riderId: string, driverId: string) => {
  return prisma.conversation.create({
    data: {
      tripId,
      riderId,
      driverId,
    },
    include: { messages: true },
  });
};

export const sendMessage = async (conversationId: string, senderId: string, senderType: 'RIDER' | 'DRIVER', data: any) => {
  return prisma.message.create({
    data: {
      conversationId,
      senderId,
      senderType,
      content: data.content,
      voiceNoteUrl: data.voiceNoteUrl,
      type: data.type,
    },
  });
};

export const getConversationMessages = async (conversationId: string) => {
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });
};

export const markMessageRead = async (messageId: string) => {
  return prisma.message.update({
    where: { id: messageId },
    data: { isRead: true },
  });
};

// Driver sees nearby ride requests (with counter-bid capability)
export const getDriverRideRequests = async (driverLat: number, driverLng: number, radiusKm: number = 10) => {
  const requests = await prisma.trip.findMany({
    where: {
      status: "REQUESTED",
      rider: {
        rider: { isNot: null }, // ensure it's a rider trip
      },
    },
    include: {
      rider: {
        select: {
          firstName: true,
          lastName: true,
          profilePicture: true,
        },
      },
    },
  });

  // Filter by distance (using pickup location)
  const nearbyRequests = requests
    .map((trip) => {
      const pickup = trip.pickupLocation as any;
      if (!pickup?.lat || !pickup?.lng) return null;

      const distanceKm = haversineKm(driverLat, driverLng, pickup.lat, pickup.lng);
      if (distanceKm > radiusKm) return null;

      return {
        tripId: trip.id,
        riderName: `${trip.rider.firstName} ${trip.rider.lastName}`.trim(),
        riderPhoto: trip.rider.profilePicture,
        pickupLocation: trip.pickupLocation,
        dropoffLocation: trip.dropoffLocation,
        estimatedFare: trip.estimatedFare,
        rideType: trip.rideType,
        distanceKm: Number(distanceKm.toFixed(2)),
        createdAt: trip.createdAt,
      };
    })
    .filter(Boolean);

  return {
    count: nearbyRequests.length,
    requests: nearbyRequests,
  };
};

export const counterBidOnRide = async (driverId: string, tripId: string, offeredPrice: number) => {
  // Ensure the trip is still in REQUESTED state and not yet assigned
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) throw new Error("Trip not found");
  if (trip.status !== "REQUESTED") throw new Error("Ride request is no longer available for bidding");
  if (trip.driverId) throw new Error("Ride already assigned to another driver");

  // Update the trip with driver's counter offer
  return prisma.trip.update({
    where: { id: tripId },
    data: {
      actualFare: offeredPrice,        
      status: "DRIVER_COUNTER_BID",  
    },
    include: {
      rider: {
        select: { firstName: true, lastName: true },
      },
    },
  });
};

export const initializePaystackPayment = async (tripId: string, amount: number, email: string) => {
  const res = await paystack.post('/transaction/initialize', {
    amount: Math.round(amount * 100),
    email,
    reference: `trip_${tripId}_${Date.now()}`,
    metadata: { tripId },
  });
  return res.data.data;
};