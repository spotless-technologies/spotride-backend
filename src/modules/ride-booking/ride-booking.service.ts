import prisma from '../../config/prisma';
import env from '../../config/env';
import axios from 'axios';
import { Prisma } from '@prisma/client';
import { haversineKm } from '../../utils/distance';

const paystack = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` },
});

export const calculateFareEstimate = async (data: any) => {
  const category = await prisma.vehicleCategory.findUnique({
    where: { id: data.categoryId },
  });

  if (!category) throw new Error("Invalid vehicle category");

  const distanceKm = haversineKm(data.pickupLat, data.pickupLng, data.destinationLat, data.destinationLng);
  const durationMin = Math.round((distanceKm / env.RIDE_AVG_SPEED_KMH) * 60);

  const subtotal = category.baseFare 
    + (distanceKm * category.ratePerKm) 
    + (durationMin * category.waitingCharge);

  const surgeMultiplier = category.surgeMultiplier || 1.0;

  return {
    distanceKm: Number(distanceKm.toFixed(2)),
    durationMin,
    currency: "NGN",
    estimatedFare: Math.round(subtotal * surgeMultiplier),
    surgeMultiplier,
    categoryId: category.id,
    categoryName: category.name,
    baseFare: category.baseFare,
    ratePerKm: category.ratePerKm,
    waitingCharge: category.waitingCharge,
  };
};

export const requestRide = async (riderId: string, data: any) => {
  const estimate = await calculateFareEstimate(data);

  const trip = await prisma.trip.create({
    data: {
      riderId,
      pickupLocation: { 
        lat: data.pickupLat, 
        lng: data.pickupLng,
        address: data.pickupAddress || 'Unknown pickup location'
      },
      dropoffLocation: { 
        lat: data.destinationLat, 
        lng: data.destinationLng,
        address: data.dropoffAddress || 'Unknown destination'
      },
      estimatedFare: data.estimatedFare || estimate.estimatedFare,
      currency: estimate.currency,
      status: "REQUESTED",
      rideType: estimate.categoryName,          
      surgeMultiplier: estimate.surgeMultiplier,
      categoryId: estimate.categoryId,           
      promoCode: data.promoCode,
    },
    include: {
      rider: { select: { firstName: true, lastName: true, profilePicture: true } }
    }
  });

  return trip;
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

// ====================== DRIVER ARRIVING FOR PICKUP SERVICE ======================
export const driverArrivingForPickup = async (driverId: string, tripId: string, driverLat: number, driverLng: number, etaMinutes?: number) => {
  // Verify the trip belongs to this driver
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      rider: {
        select: {
          firstName: true,
          lastName: true,
          profilePicture: true,
          phone: true,
        },
      },
      driver: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  if (trip.driverId !== driverId) {
    throw new Error("You don't have permission for this trip");
  }

  if (trip.status !== "DRIVER_ASSIGNED") {
    throw new Error(`Cannot update arrival. Current status: ${trip.status}`);
  }

  // Update driver's current location
  await prisma.driver.update({
    where: { id: driverId },
    data: {
      currentLocation: { lat: driverLat, lng: driverLng },
      lastLocationUpdate: new Date(),
    },
  });

  // Calculate distance from driver to pickup (for verification)
  const pickup = trip.pickupLocation as any;
  const distanceToPickup = haversineKm(driverLat, driverLng, pickup.lat, pickup.lng);
  const calculatedEta = Math.round((distanceToPickup / 40) * 60); // 40 km/h average

  const arrivalData = {
    tripId: trip.id,
    status: trip.status,
    driver: {
      id: driverId,
      name: `${trip.driver?.user?.firstName} ${trip.driver?.user?.lastName}`.trim() || "Driver",
    },
    rider: {
      name: `${trip.rider.firstName} ${trip.rider.lastName}`.trim(),
      phone: trip.rider.phone,
      photo: trip.rider.profilePicture,
    },
    pickupLocation: {
      address: pickup?.address || "Pickup location",
      lat: pickup?.lat,
      lng: pickup?.lng,
    },
    dropoffLocation: {
      address: (trip.dropoffLocation as any)?.address || "Destination",
    },
    eta: etaMinutes || calculatedEta,
    distanceToPickup: Number(distanceToPickup.toFixed(2)),
    estimatedFare: trip.estimatedFare,
    nearbyStreets: [],
    rideType: trip.rideType,
    cashPaymentOption: true,
    canEmergencySOS: true,
    canCancelTrip: true,
  };

  return arrivalData;
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
    where: { status: "REQUESTED" },
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
    .filter(Boolean)
    .sort((a: any, b: any) => a.distanceKm - b.distanceKm);

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

// ====================== ARRIVED AT PICKUP ======================
export const arrivedAtPickup = async (tripId: string) => {
  return prisma.trip.update({
    where: { id: tripId, status: "DRIVER_ASSIGNED" },
    data: { status: "DRIVER_ARRIVED" },
  });
};

// ====================== GET TRIP INFO (FULL PRODUCTION VERSION) ======================
export const getTripInfo = async (tripId: string) => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      rider: {
        select: {
          firstName: true,
          lastName: true,
          profilePicture: true,
          phone: true,
          email: true,
        },
      },
      driver: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              profilePicture: true,
              phone: true,
            },
          },
        },
      },
    },
  });

  if (!trip) throw new Error("Trip not found");

  const pickup = trip.pickupLocation as any;
  const dropoff = trip.dropoffLocation as any;

  let distanceKm: number | string = "N/A";
  if (pickup?.lat && pickup?.lng && dropoff?.lat && dropoff?.lng) {
    distanceKm = Number(
      haversineKm(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng).toFixed(2)
    );
  }

  let durationMin: number | string = "N/A";
  if (typeof distanceKm === 'number') {
    durationMin = Math.round((distanceKm / env.RIDE_AVG_SPEED_KMH) * 60);
  }

  return {
    tripId: trip.id,
    tripDateTime: trip.endTime || trip.startTime || trip.createdAt,
    status: trip.status.toUpperCase(),

    routeInformation: {
      pickupLocation: {
        address: pickup?.address || `${pickup?.lat?.toFixed(4) || 'N/A'}, ${pickup?.lng?.toFixed(4) || 'N/A'}`,
        lat: pickup?.lat,
        lng: pickup?.lng,
      },
      dropoffLocation: {
        address: dropoff?.address || `${dropoff?.lat?.toFixed(4) || 'N/A'}, ${dropoff?.lng?.toFixed(4) || 'N/A'}`,
        lat: dropoff?.lat,
        lng: dropoff?.lng,
      },
      distance: distanceKm,
      duration: durationMin,
    },

    riderInformation: {
      name: `${trip.rider.firstName} ${trip.rider.lastName}`.trim(),
      rating: trip.riderRating || 0,
      phone: trip.rider.phone,
      email: trip.rider.email,
    },

    paymentInformation: {
      totalFare: trip.actualFare || trip.estimatedFare || 0,
      paymentMethod: trip.paymentMethod || "CASH",
      commission: trip.commissionAmount || Math.round((trip.actualFare || trip.estimatedFare || 0) * 0.20),
      netEarnings: (trip.actualFare || trip.estimatedFare || 0) - (trip.commissionAmount || 0),
    },

    canRate: trip.status === "COMPLETED" && !trip.riderRating,
  };
};

// ====================== RATE DRIVER ======================
export const rateDriver = async (tripId: string, rating: number, feedback?: string) => {
  return prisma.trip.update({
    where: { id: tripId, status: "COMPLETED" },
    data: {
      riderRating: rating,
      riderFeedback: feedback,
    },
  });
};

// ====================== CANCEL RIDE ======================
export const cancelRide = async (tripId: string, userId: string, reason?: string) => {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });

  if (!trip) throw new Error("Trip not found");

  // Rider can cancel only if still in REQUESTED state
  if (trip.riderId === userId && trip.status === "REQUESTED") {
    return prisma.trip.update({
      where: { id: tripId },
      data: { status: "CANCELLED", riderFeedback: reason || "Cancelled by rider" },
    });
  }

  // Driver can cancel only after accepting
  if (trip.driverId === userId && ["DRIVER_ASSIGNED", "DRIVER_ARRIVED"].includes(trip.status)) {
    return prisma.trip.update({
      where: { id: tripId },
      data: { status: "CANCELLED", riderFeedback: reason || "Cancelled by driver" },
    });
  }

  throw new Error("You cannot cancel this ride at this stage");
};

// ====================== GET ALL VEHICLE CATEGORIES ======================
export const getVehicleCategories = async () => {
  return prisma.vehicleCategory.findMany({
    where: { status: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      baseFare: true,
      ratePerKm: true,
      waitingCharge: true,
      surgeMultiplier: true,
      capacity: true,
      features: true,
    },
  });
};

// ====================== CANCEL SCHEDULED RIDE ======================
export const cancelScheduledRide = async (scheduledRideId: string, riderId: string, reason?: string) => {
  // First verify the ride belongs to this rider and is cancellable
  const ride = await prisma.scheduledRide.findUnique({
    where: { 
      id: scheduledRideId,
      riderId,                  
    },
  });

  if (!ride) {
    throw new Error("Scheduled ride not found or you don't have permission to cancel it");
  }

  if (ride.status !== 'pending') {
    throw new Error(`This ride cannot be cancelled. Current status: ${ride.status}`);
  }

  return prisma.scheduledRide.update({
    where: { id: scheduledRideId },
    data: { 
      status: 'cancelled', 
      riderFeedback: reason || 'Cancelled by rider' 
    },
    include: {
      driver: { include: { user: true } },
      rider: true
    }
  });
};

// ====================== EDIT SCHEDULED TRIP ======================
export const editScheduledTrip = async (scheduledRideId: string, riderId: string, scheduledTime: string) => {
  const ride = await prisma.scheduledRide.findUnique({
    where: { 
      id: scheduledRideId,
      riderId 
    },
  });

  if (!ride) {
    throw new Error("Scheduled ride not found or you don't have permission to edit it");
  }

  if (ride.status !== 'pending') {
    throw new Error(`Only pending scheduled rides can be edited. Current status: ${ride.status}`);
  }

  return prisma.scheduledRide.update({
    where: { id: scheduledRideId },
    data: { 
      scheduledTime: new Date(scheduledTime) 
    },
    include: {
      driver: { include: { user: true } }
    }
  });
};

// ====================== RIDER MY TRIPS ======================
export const getRiderMyTrips = async (riderId: string, tab: 'upcoming' | 'past' | 'scheduled') => {
  let where: any = { riderId };

  if (tab === 'upcoming') {
    where.status = { in: ['DRIVER_ASSIGNED', 'DRIVER_ARRIVED', 'IN_PROGRESS'] };
  } else if (tab === 'past') {
    where.status = { in: ['COMPLETED', 'CANCELLED'] };
  } else if (tab === 'scheduled') {
    return prisma.scheduledRide.findMany({
      where: { riderId, status: 'pending' },
      include: { driver: { include: { user: true } } },
      orderBy: { scheduledTime: 'asc' },
    });
  }

  const trips = await prisma.trip.findMany({
    where,
    include: {
      driver: {
        include: {
          user: { select: { firstName: true, lastName: true, profilePicture: true, phone: true } }
        }
      },
      rider: { select: { firstName: true, lastName: true, profilePicture: true, phone: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return trips.map((trip) => {
    const pickup = trip.pickupLocation as any;
    const dropoff = trip.dropoffLocation as any;

    let distanceKm: number | string = "N/A";
    let durationMin: number | string = "N/A";

    if (pickup?.lat && pickup?.lng && dropoff?.lat && dropoff?.lng) {
      distanceKm = Number(haversineKm(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng).toFixed(2));
      const avgSpeedKmh = env.RIDE_AVG_SPEED_KMH || 40;
      durationMin = Math.round((distanceKm as number / avgSpeedKmh) * 60);
    }

    return {
      tripId: trip.id,
      tripDateTime: trip.startTime || trip.createdAt,
      status: trip.status.toUpperCase(),
      routeInformation: {
        pickupLocation: pickup?.address || 'Unknown pickup',
        dropoffLocation: dropoff?.address || 'Unknown dropoff',
        distanceKm,
        durationMin,
      },
      riderInformation: {
        name: `${trip.rider.firstName} ${trip.rider.lastName}`.trim(),
        rating: trip.riderRating || 0,          
        phone: trip.rider.phone,
        email: trip.rider.email,
      },
      driverInformation: trip.driver ? {
        name: `${trip.driver.user.firstName} ${trip.driver.user.lastName}`.trim(),
        photo: trip.driver.user.profilePicture,
        rating: trip.driver.rating || 0,         
        vehicleModel: trip.driver.vehicleModel,
        vehiclePlate: trip.driver.vehiclePlate,
        vehicleColor: trip.driver.vehicleColor,
        vehicleType: trip.driver.vehicleType,
      } : null,
      paymentInformation: {
        totalFare: trip.actualFare || trip.estimatedFare || 0,
        paymentMethod: trip.paymentMethod || "CASH",
        commissionAmount: trip.commissionAmount || 0,
        netEarnings: (trip.actualFare || trip.estimatedFare || 0) - (trip.commissionAmount || 0),
      },
      ratingInformation: {
        riderRating: trip.riderRating,
        riderFeedback: trip.riderFeedback,
        canRate: trip.status === "COMPLETED" && !trip.riderRating,
      },
      canCancel: ['REQUESTED', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVED'].includes(trip.status),
      canViewDetails: true,
    };
  });
};

// ====================== DRIVER MY TRIPS ======================
export const getDriverMyTrips = async (driverId: string, tab: 'completed' | 'scheduled') => {
  let where: any = { driverId };

  if (tab === 'completed') {
    where.status = { in: ['COMPLETED', 'CANCELLED'] };
  } else if (tab === 'scheduled') {
    where.status = { in: ['DRIVER_ASSIGNED', 'DRIVER_ARRIVED', 'IN_PROGRESS'] };
  }

  const trips = await prisma.trip.findMany({
    where,
    include: {
      rider: { 
        select: { 
          firstName: true, 
          lastName: true, 
          profilePicture: true, 
          phone: true, 
          email: true 
        } 
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return trips.map((trip) => {
    const pickup = trip.pickupLocation as any;
    const dropoff = trip.dropoffLocation as any;

    let distanceKm: number | string = "N/A";
    let durationMin: number | string = "N/A";

    if (pickup?.lat && pickup?.lng && dropoff?.lat && dropoff?.lng) {
      distanceKm = Number(haversineKm(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng).toFixed(2));
      const avgSpeedKmh = env.RIDE_AVG_SPEED_KMH || 40;
      durationMin = Math.round((distanceKm as number / avgSpeedKmh) * 60);
    }

    return {
      tripId: trip.id,
      tripDateTime: trip.startTime || trip.createdAt,
      status: trip.status.toUpperCase(),
      routeInformation: {
        pickupLocation: pickup?.address || 'Unknown pickup',
        dropoffLocation: dropoff?.address || 'Unknown dropoff',
        distanceKm,
        durationMin,
      },
      riderInformation: {
        name: `${trip.rider.firstName} ${trip.rider.lastName}`.trim(),
        rating: trip.riderRating || 0,
        phone: trip.rider.phone,
        email: trip.rider.email,
      },
      paymentInformation: {
        totalFare: trip.actualFare || trip.estimatedFare || 0,
        paymentMethod: trip.paymentMethod || "CASH",
        commissionAmount: trip.commissionAmount || 0,
        netEarnings: (trip.actualFare || trip.estimatedFare || 0) - (trip.commissionAmount || 0),
      },
      ratingInformation: {
        driverRating: trip.rating,          
        driverFeedback: trip.driverFeedback,
      },
      canCancel: ['DRIVER_ASSIGNED', 'DRIVER_ARRIVED'].includes(trip.status),
      canViewDetails: true,
    };
  });
};

// ====================== GET RIDE OFFERS (FOR RIDER) ======================
export const getRideOffers = async (tripId: string, riderId: string) => {
  // First, verify the trip belongs to this rider
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      rider: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  if (trip.riderId !== riderId) {
    throw new Error("You don't have permission to view offers for this ride");
  }
  
  // If trip has been started (IN_PROGRESS, COMPLETED), don't show offers
  if (trip.status === "IN_PROGRESS" || trip.status === "COMPLETED") {
    return {
      trip: null,
      currentStatus: trip.status,
      acceptedDriver: null,
      counterBids: [],
      bestOffer: null,
      totalInterestedDrivers: 0,
      hasAcceptedDriver: false,
      canAcceptCounterBid: false,
      message: "This trip has already started or been completed. No new offers available.",
    };
  }
  
  // First, get the main trip info
  const mainTrip = {
    tripId: trip.id,
    status: trip.status,
    estimatedFare: trip.estimatedFare,
    actualFare: trip.actualFare,
    pickupLocation: trip.pickupLocation,
    dropoffLocation: trip.dropoffLocation,
    rideType: trip.rideType,
    surgeMultiplier: trip.surgeMultiplier,
    createdAt: trip.createdAt,
  };

  // Get the driver who accepted the ride (if any)
  let acceptedDriver = null;
  if (trip.driverId && trip.status === "DRIVER_ASSIGNED") {
    const driver = await prisma.driver.findUnique({
      where: { id: trip.driverId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            profilePicture: true,
            phone: true,
          },
        },
      },
    });

    if (driver) {
      acceptedDriver = {
        driverId: driver.id,
        fullName: `${driver.user.firstName} ${driver.user.lastName}`.trim(),
        profilePicture: driver.user.profilePicture,
        phone: driver.user.phone,
        rating: driver.rating,
        vehicleType: driver.vehicleType,
        vehicleModel: driver.vehicleModel,
        vehicleColor: driver.vehicleColor,
        vehiclePlate: driver.vehiclePlate,
        offeredPrice: trip.actualFare || trip.estimatedFare || 0,
        status: "ACCEPTED",
        acceptedAt: trip.updatedAt,
      };
    }
  }
  
  // Limit counter bids to maximum 5 drivers per ride request
  const MAX_DRIVERS_PER_RIDE = 5;
  
  const counterBids = await prisma.counterBid.findMany({
    where: {
      tripId: trip.id,
      status: "PENDING",
      // Exclude the accepted driver if one exists
      ...(trip.driverId ? { driverId: { not: trip.driverId } } : {}),
    },
    include: {
      driver: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              profilePicture: true,
              phone: true,
            },
          },
        },
      },
    },
    orderBy: {
      offeredPrice: 'asc', 
    },
    // Limit to maximum 5 drivers
    take: MAX_DRIVERS_PER_RIDE,
  });

  const formattedCounterBids = counterBids.map(bid => ({
    driverId: bid.driver.id,
    fullName: `${bid.driver.user.firstName} ${bid.driver.user.lastName}`.trim(),
    profilePicture: bid.driver.user.profilePicture,
    phone: bid.driver.user.phone,
    rating: bid.driver.rating,
    vehicleType: bid.driver.vehicleType,
    vehicleModel: bid.driver.vehicleModel,
    vehicleColor: bid.driver.vehicleColor,
    vehiclePlate: bid.driver.vehiclePlate,
    offeredPrice: bid.offeredPrice ?? 0,
    status: "COUNTER_BID",
    bidMessage: bid.message,
    bidExpiresAt: bid.expiresAt,
    createdAt: bid.createdAt,
  }));

  // Calculate best offer (lowest price)
  const allOffers = [
    ...(acceptedDriver ? [acceptedDriver] : []),
    ...formattedCounterBids,
  ];

  const bestOffer = allOffers.length > 0
    ? allOffers.reduce((best, current) => {
        const bestPrice = best.offeredPrice ?? Infinity;
        const currentPrice = current.offeredPrice ?? Infinity;
        return currentPrice < bestPrice ? current : best;
      })
    : null;

  // Count only active pending counter bids (max 5 reflected in count)
  const interestedCount = await prisma.counterBid.count({
    where: {
      tripId: trip.id,
      status: "PENDING",
    },
  });

  // Add warning if more than 5 drivers tried to bid
  const totalBidsExceeded = interestedCount > MAX_DRIVERS_PER_RIDE;
  
  return {
    trip: mainTrip,
    currentStatus: trip.status,
    acceptedDriver,
    counterBids: formattedCounterBids,
    bestOffer,
    totalInterestedDrivers: Math.min(interestedCount + (acceptedDriver ? 1 : 0), MAX_DRIVERS_PER_RIDE + (acceptedDriver ? 1 : 0)),
    hasAcceptedDriver: !!acceptedDriver,
    canAcceptCounterBid: trip.status === "REQUESTED",
    maxDriversLimit: MAX_DRIVERS_PER_RIDE,
    totalBidsExceeded, // Flag if more drivers tried to bid than allowed
    message: trip.status === "DRIVER_ASSIGNED" 
      ? "A driver has accepted your ride request" 
      : trip.status === "DRIVER_COUNTER_BID"
      ? `${formattedCounterBids.length} driver(s) have made counter-offers on your ride`
      : totalBidsExceeded 
        ? `Showing ${MAX_DRIVERS_PER_RIDE} out of ${interestedCount} interested drivers (maximum ${MAX_DRIVERS_PER_RIDE} per ride)`
        : "Waiting for drivers to respond to your ride request",
  };
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