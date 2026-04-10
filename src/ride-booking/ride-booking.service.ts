import prisma from '../config/prisma';
import env from '../config/env';

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const calculateFareEstimate = async (data: any) => {
  const distanceKm = haversineKm(
    data.pickupLat,
    data.pickupLng,
    data.destinationLat,
    data.destinationLng
  );

  const baseFare = env.RIDE_BASE_FARE;
  const ratePerKm = env.RIDE_RATE_PER_KM;
  const ratePerMin = env.RIDE_RATE_PER_MIN;
  const bookingFee = env.RIDE_BOOKING_FEE;
  const avgSpeedKmh = env.RIDE_AVG_SPEED_KMH;

  const durationMin = Math.round((distanceKm / avgSpeedKmh) * 60);

  const distanceCost = distanceKm * ratePerKm;
  const timeCost = durationMin * ratePerMin;
  let subtotal = baseFare + distanceCost + timeCost + bookingFee;

  // TODO: Implement real surge logic with Redis
  const surgeMultiplier = 1.0; 

  const estimatedFare = Math.round(subtotal * surgeMultiplier);

  return {
    distanceKm: Number(distanceKm.toFixed(2)),
    durationMin,
    currency: env.RIDE_DEFAULT_CURRENCY,
    estimatedFare,
    surgeMultiplier,
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
    },
    include: { rider: { select: { firstName: true, lastName: true } } },
  });
};

export const driverAcceptRide = async (driverId: string, tripId: string) => {
  return prisma.trip.update({
    where: { id: tripId, status: "REQUESTED" },
    data: { driverId, status: "DRIVER_ASSIGNED" },
  });
};

export const startTrip = async (tripId: string) => {
  return prisma.trip.update({
    where: { id: tripId, status: "DRIVER_ASSIGNED" },
    data: { status: "IN_PROGRESS", startTime: new Date() },
  });
};

export const endTrip = async (tripId: string, actualFare?: number) => {
  return prisma.trip.update({
    where: { id: tripId, status: "IN_PROGRESS" },
    data: { status: "COMPLETED", endTime: new Date(), actualFare },
  });
};