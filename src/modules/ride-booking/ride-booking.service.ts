import prisma from '../../config/prisma';
import env from '../../config/env';
import axios from 'axios';

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

// Base prices per ride type (as requested)
const BASE_PRICES = {
  REGULAR: 800,
  STANDARD: 1200,
  PREMIUM: 2000,
} as const;

export const calculateFareEstimate = async (data: any) => {
  const distanceKm = haversineKm(data.pickupLat, data.pickupLng, data.destinationLat, data.destinationLng);
  const durationMin = Math.round((distanceKm / env.RIDE_AVG_SPEED_KMH) * 60);

  const baseFare = BASE_PRICES[data.rideType as keyof typeof BASE_PRICES] || BASE_PRICES.REGULAR;

  const subtotal = baseFare 
    + (distanceKm * env.RIDE_RATE_PER_KM) 
    + (durationMin * env.RIDE_RATE_PER_MIN) 
    + env.RIDE_BOOKING_FEE;

  const surgeMultiplier = 1.0; // TODO: Implement real surge with Redis later

  return {
    distanceKm: Number(distanceKm.toFixed(2)),
    durationMin,
    currency: env.RIDE_DEFAULT_CURRENCY,
    estimatedFare: Math.round(subtotal * surgeMultiplier),
    surgeMultiplier,
    rideType: data.rideType,
  };
};

export const requestRide = async (riderId: string, data: any) => {
  const estimate = await calculateFareEstimate(data);

  return prisma.trip.create({
    data: {
      riderId,
      pickupLocation: { lat: data.pickupLat, lng: data.pickupLng },
      dropoffLocation: { lat: data.destinationLat, lng: data.destinationLng },
      estimatedFare: estimate.estimatedFare,
      currency: estimate.currency,
      status: "REQUESTED",
      rideType: data.rideType,
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

export const initializePaystackPayment = async (tripId: string, amount: number, email: string) => {
  const res = await paystack.post('/transaction/initialize', {
    amount: Math.round(amount * 100),
    email,
    reference: `trip_${tripId}_${Date.now()}`,
    metadata: { tripId },
  });
  return res.data.data;
};