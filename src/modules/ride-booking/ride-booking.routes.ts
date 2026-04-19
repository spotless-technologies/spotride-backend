import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { riderAuth } from '../../middleware/rider';
import { driverAuth } from '../../middleware/driver';
import {
  getFareEstimate,
  requestRide,
  driverAcceptRide,
  startTrip,
  endTrip,
  initializePayment,
  rateTrip,
  getNearbyDrivers,
  sendMessage,
  getConversationMessages,
  getDriverRideRequests,
  createConversation,
  counterBidOnRide,
  arrivedAtPickup,
  getTripInfo,
  cancelRide,
  getVehicleCategories,
  cancelScheduledRide,
  editScheduledTrip,
  getRiderMyTrips,
  getDriverMyTrips,
} from './ride-booking.controller';

import {
  rideEstimateSchema,
  requestRideSchema,
  driverAcceptSchema,
  rateTripSchema,
  nearbyDriversSchema,
  sendMessageSchema,
  driverRideRequestsSchema,
  counterBidSchema,
  arrivedAtPickupSchema,
  endTripSchema,
  startTripSchema,
  cancelRideSchema,
  cancelScheduledRideSchema,
  editScheduledTripSchema,
} from './ride-booking.dto';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Ride Booking
 *   description: |
 *     Complete ride hailing system.
 *     Flow: Estimate → Request Ride → Driver Offers → Accept → Start → End → Payment → Rating.
 *     Supports Cash & Card (Paystack) payments with automatic commission deduction for cash rides.
 */

// ==================== VEHICLE CATEGORIES ====================
/**
 * @swagger
 * /api/rides/categories:
 *   get:
 *     summary: Get all available vehicle categories for ride booking
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns all active categories created by admin (Regular, Standard, Premium, etc.).
 *       Used by rider when requesting a ride to choose ride type.
 *     responses:
 *       200:
 *         description: List of available categories
 *         content:
 *           application/json:
 *             example:
 *               categories:
 *                 - id: "cat-uuid"
 *                   name: "Premium"
 *                   description: "Premium rides with luxury vehicles"
 *                   baseFare: 800
 *                   ratePerKm: 120
 *                   waitingCharge: 20
 *                   surgeMultiplier: 1.5
 *                   capacity: 4
 *                   features: ["Economy", "AC", "Music"]
 */
router.get('/rides/categories', riderAuth, getVehicleCategories);

// ==================== RIDER MY TRIPS ====================
/**
 * @swagger
 * /api/rides/my-trips:
 *   get:
 *     summary: Rider gets their trips (Upcoming, Past, Scheduled)
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns rich trip data matching the "Trips" screen in your screenshots.
 *       Includes route info, rider details, payment breakdown, and action buttons visibility.
 *     parameters:
 *       - in: query
 *         name: tab
 *         schema: { type: string, enum: ["upcoming", "past", "scheduled"], default: "upcoming" }
 *     responses:
 *       200:
 *         description: Rider's trips with full details
 *         content:
 *           application/json:
 *             example:
 *               tab: "upcoming"
 *               trips:
 *                 - tripId: "trip-uuid"
 *                   tripDateTime: "2025-08-26T10:30:00Z"
 *                   status: "DRIVER_ASSIGNED"
 *                   routeInformation:
 *                     pickupLocation: "Lekki Phase 1"
 *                     dropoffLocation: "Murtala Mohammed Airport"
 *                   riderInformation:
 *                     name: "Joshua .T"
 *                     rating: 4.8
 *                     phone: "+2348012345678"
 *                   paymentInformation:
 *                     totalFare: 4200
 *                     paymentMethod: "CARD"
 *                     commission: 840
 *                     netEarnings: 3360
 *                   canRate: false
 *                   canCancel: true
 */
router.get('/rides/my-trips', riderAuth, getRiderMyTrips);

// ==================== DRIVER MY TRIPS ====================
/**
 * @swagger
 * /api/drivers/trips:
 *   get:
 *     summary: Driver gets their trips (Completed, Scheduled)
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns rich trip data for driver "Trips" screen (Completed & Scheduled tabs).
 *       Includes full route, rider info, payment breakdown, and action visibility.
 *     parameters:
 *       - in: query
 *         name: tab
 *         schema: { type: string, enum: ["completed", "scheduled"], default: "completed" }
 *     responses:
 *       200:
 *         description: Driver's trips with full details
 *         content:
 *           application/json:
 *             example:
 *               tab: "completed"
 *               trips:
 *                 - tripId: "trip-uuid"
 *                   tripDateTime: "2025-08-26T10:30:00Z"
 *                   status: "COMPLETED"
 *                   routeInformation:
 *                     pickupLocation: "Lekki Phase 1"
 *                     dropoffLocation: "Murtala Mohammed Airport"
 *                   riderInformation:
 *                     name: "Joshua .T"
 *                     rating: 4.8
 *                     phone: "+2348012345678"
 *                   paymentInformation:
 *                     totalFare: 4200
 *                     paymentMethod: "CARD"
 *                     commission: 840
 *                     netEarnings: 3360
 *                   canCancel: false
 */
router.get('/drivers/trips', driverAuth, getDriverMyTrips);


// ==================== FARE ESTIMATE ====================
/**
 * @swagger
 * /api/rides/estimate:
 *   post:
 *     summary: Calculate ride fare estimate using admin-defined category
 *     tags: [Ride Booking]
 *     description: |
 *       Now uses real pricing from `VehicleCategory` created by admin.
 *       Send `categoryId` instead of hardcoded rideType.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pickupLat, pickupLng, destinationLat, destinationLng, categoryId]
 *             properties:
 *               pickupLat: { type: number, example: 6.5244 }
 *               pickupLng: { type: number, example: 3.3792 }
 *               destinationLat: { type: number, example: 6.6018 }
 *               destinationLng: { type: number, example: 3.3515 }
 *               categoryId: { type: string, format: uuid, example: "cat-uuid-here" }
 *               country: { type: string, example: "NG" }
 *     responses:
 *       200:
 *         description: Fare estimate returned from real category pricing
 *         content:
 *           application/json:
 *             example:
 *               distanceKm: 12.34
 *               durationMin: 25
 *               currency: "NGN"
 *               estimatedFare: 6200
 *               surgeMultiplier: 1.5
 *               categoryName: "Premium"
 *               baseFare: 800
 *               ratePerKm: 120
 */
router.post('/rides/estimate', validate(rideEstimateSchema), getFareEstimate);

// ==================== REQUEST RIDE ====================
/**
 * @swagger
 * /api/rides/request:
 *   post:
 *     summary: Rider requests a new ride using admin category
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Uses `categoryId` from VehicleCategory.
 *       First call `/rides/estimate` to get pricing, then rider can adjust `estimatedFare`.
 *       Pickup and dropoff addresses are stored for driver visibility.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pickupLat, pickupLng, destinationLat, destinationLng, categoryId, estimatedFare]
 *             properties:
 *               pickupLat: { type: number, example: 6.5244 }
 *               pickupLng: { type: number, example: 3.3792 }
 *               destinationLat: { type: number, example: 6.6018 }
 *               destinationLng: { type: number, example: 3.3515 }
 *               categoryId: { type: string, format: uuid, example: "cat-uuid-here" }
 *               estimatedFare: { type: number, example: 2500 }
 *               promoCode: { type: string, example: "FIRSTRIDE20" }
 *               pickupAddress: { type: string, example: "Lekki Phase 1, Lagos" }
 *               dropoffAddress: { type: string, example: "Murtala Mohammed Airport" }
 *     responses:
 *       201:
 *         description: Ride requested successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Ride requested successfully"
 *               trip:
 *                 id: "trip-uuid-here"
 *                 status: "REQUESTED"
 *                 estimatedFare: 2500
 *                 rideType: "Premium"           
 *                 categoryId: "cat-uuid-here"
 *                 surgeMultiplier: 1.5
 */
router.post('/rides/request', riderAuth, validate(requestRideSchema), requestRide);

/**
 * @swagger
 * /api/rides/nearby-drivers:
 *   get:
 *     summary: Get available drivers near the rider (real-time)
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns online, approved drivers within the specified radius (default 5km).
 *       Uses the driver's latest `currentLocation` updated via WebSocket `location-update`.
 *       Results are sorted by distance (closest first).
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema: { type: number }
 *         example: 6.5244
 *       - in: query
 *         name: lng
 *         required: true
 *         schema: { type: number }
 *         example: 3.3792
 *       - in: query
 *         name: radiusKm
 *         schema: { type: number, default: 5, maximum: 50 }
 *         example: 5
 *     responses:
 *       200:
 *         description: List of nearby available drivers
 *         content:
 *           application/json:
 *             example:
 *               count: 3
 *               radiusKm: 5
 *               drivers:
 *                 - driverId: "driver-uuid"
 *                   fullName: "Emeka Okafor"
 *                   photo: "https://..."
 *                   rating: 4.8
 *                   vehicleType: "SEDAN"
 *                   vehicleModel: "Toyota Camry"
 *                   vehicleColor: "Black"
 *                   distanceKm: 1.23
 *                   etaMinutes: 4
 *                   lastUpdated: "2026-04-13T15:42:00Z"
 */
router.get(
  '/rides/nearby-drivers', 
  riderAuth, 
  validate(nearbyDriversSchema, 'query'), 
  getNearbyDrivers
);

// ==================== DRIVER RIDE REQUESTS ====================
/**
 * @swagger
 * /api/drivers/ride-requests:
 *   get:
 *     summary: Driver views incoming ride requests near pickup location
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Only drivers within the specified radius of the rider's **pickup location** will see the request.
 *       Shows full pickup and dropoff names/addresses. rideType now comes from admin VehicleCategory.
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema: { type: number }
 *       - in: query
 *         name: lng
 *         required: true
 *         schema: { type: number }
 *       - in: query
 *         name: radiusKm
 *         schema: { type: number, default: 10 }
 *     responses:
 *       200:
 *         description: List of nearby ride requests
 *         content:
 *           application/json:
 *             example:
 *               count: 2
 *               requests:
 *                 - tripId: "trip-uuid"
 *                   riderName: "Joshua .T"
 *                   pickupLocation: { "address": "Lekki Phase 1" }
 *                   dropoffLocation: { "address": "Murtala Mohammed Airport" }
 *                   estimatedFare: 4200
 *                   rideType: "Premium"
 *                   distanceKm: 3.8
 */
router.get('/drivers/ride-requests', driverAuth, validate(driverRideRequestsSchema, 'query'), getDriverRideRequests);

// ==================== PAYMENT ====================
/**
 * @swagger
 * /api/rides/payment/initialize:
 *   post:
 *     summary: Initialize Paystack payment for CARD payments
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tripId, paymentMethod]
 *             properties:
 *               tripId: { type: string, format: uuid }
 *               paymentMethod: { type: string, enum: ["CASH", "CARD", "WALLET"] }
 *     responses:
 *       200:
 *         description: Payment initialized (for CARD) or confirmed (for CASH)
 */
router.post('/rides/payment/initialize', riderAuth, initializePayment);

/**
 * @swagger
 * /api/drivers/arrived:
 *   post:
 *     summary: Driver marks "Arrived at Pickup"
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tripId]
 *             properties:
 *               tripId: { type: string, format: uuid }
 */
router.post('/drivers/arrived', driverAuth, validate(arrivedAtPickupSchema), arrivedAtPickup);

// ==================== DRIVER ACCEPT ====================
/**
 * @swagger
 * /api/drivers/accept:
 *   post:
 *     summary: Driver accepts a ride (with optional price offer)
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tripId]
 *             properties:
 *               tripId: { type: string, format: uuid }
 *               offeredPrice: { type: number, example: 6500 }
 *     responses:
 *       200:
 *         description: Ride accepted - notifies rider via WebSocket
 */
router.post('/drivers/accept', driverAuth, validate(driverAcceptSchema), driverAcceptRide);

// ==================== START & END TRIP ====================
/**
 * @swagger
 * /api/rides/start:
 *   post:
 *     summary: Driver starts the trip after passenger boards
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 */
router.post('/rides/start', driverAuth, validate(startTripSchema), startTrip);

/**
 * @swagger
 * /api/rides/end:
 *   post:
 *     summary: Driver ends the trip (shows full fare summary with commission)
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tripId]
 *             properties:
 *               tripId: { type: string, format: uuid }
 *               actualFare: { type: number }
 */
router.post('/rides/end', driverAuth, validate(endTripSchema), endTrip);


// ==================== RATE TRIP ====================
/**
 * @swagger
 * /api/rides/rate:
 *   post:
 *     summary: Rider rates the driver after trip completion
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tripId, rating]
 *             properties:
 *               tripId: { type: string, format: uuid }
 *               rating: { type: number, minimum: 1, maximum: 5, example: 4.5 }
 *               feedback: { type: string, example: "Great driver, very professional" }
 *     responses:
 *       200:
 *         description: Rating submitted successfully
 */
router.post('/rides/rate', riderAuth, validate(rateTripSchema), rateTrip);

/**
 * @swagger
 * /api/rides/{tripId}/cancel:
 *   post:
 *     summary: Cancel a ride request (rider or driver)
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string, example: "Change of plans" }
 *     responses:
 *       200:
 *         description: Ride cancelled successfully
 */
router.post('/rides/:tripId/cancel', riderAuth, validate(cancelRideSchema), cancelRide);

/**
 * @swagger
 * /api/drivers/ride-requests/{tripId}/counter-bid:
 *   post:
 *     summary: Driver submits a counter-bid on a ride request
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       After viewing nearby ride requests via `/drivers/ride-requests`, 
 *       the driver can submit a counter-offer (higher or lower than the rider's estimatedFare).
 *       This changes the trip status to "DRIVER_COUNTER_BID" and notifies the rider via WebSocket.
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [offeredPrice]
 *             properties:
 *               offeredPrice:
 *                 type: number
 *                 example: 2800
 *                 description: Driver's proposed fare (can be higher or lower than original estimate)
 *     responses:
 *       200:
 *         description: Counter-bid submitted successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Counter-bid submitted successfully. Rider will be notified."
 *               trip:
 *                 id: "trip-uuid"
 *                 status: "DRIVER_COUNTER_BID"
 *                 actualFare: 2800
 *                 rideType: "PREMIUM"
 *       400:
 *         description: Invalid bid or ride no longer available
 *       403:
 *         description: Driver access required
 */
router.post(
  '/drivers/ride-requests/:tripId/counter-bid', 
  driverAuth, 
  validate(counterBidSchema), 
  counterBidOnRide
);

// ==================== CANCEL SCHEDULED RIDE ====================
/**
 * @swagger
 * /api/rides/scheduled/{scheduledRideId}/cancel:
 *   post:
 *     summary: Cancel a scheduled ride (Rider only)
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Matches the "Cancel Scheduled Ride" confirmation modal in the screenshots.
 *       Rider can cancel only if the ride is still in "pending" status.
 *     parameters:
 *       - in: path
 *         name: scheduledRideId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string, example: "Change of plans" }
 *     responses:
 *       200:
 *         description: Scheduled ride cancelled successfully
 */
router.post('/rides/scheduled/:scheduledRideId/cancel', riderAuth, validate(cancelScheduledRideSchema), cancelScheduledRide);

// ==================== EDIT SCHEDULED TRIP ====================
/**
 * @swagger
 * /api/rides/scheduled/{scheduledRideId}/edit:
 *   put:
 *     summary: Edit scheduled trip date and time
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Matches the "Edit Scheduled Trip" modal. Rider can update the scheduled date/time.
 *     parameters:
 *       - in: path
 *         name: scheduledRideId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [scheduledTime]
 *             properties:
 *               scheduledTime: { type: string, format: date-time, example: "2025-08-26T10:30:00Z" }
 *     responses:
 *       200:
 *         description: Scheduled trip updated successfully
 */
router.put('/rides/scheduled/:scheduledRideId/edit', riderAuth, validate(editScheduledTripSchema), editScheduledTrip);

/**
 * @swagger
 * /api/rides/{tripId}:
 *   get:
 *     summary: Get full trip information (Trip Details view)
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns comprehensive trip details as shown in your screenshots:
 *       - Trip Date & Time
 *       - Trip Status
 *       - Route Information with real calculated distance and duration
 *       - Rider Information (Name, Rating, Phone, Email)
 *       - Payment Information (Total Fare, Payment Method, Commission, Net Earnings)
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Full trip details with real calculations
 *         content:
 *           application/json:
 *             example:
 *               tripId: "trip-uuid"
 *               tripDateTime: "2025-08-26T10:30:00Z"
 *               status: "COMPLETED"
 *               routeInformation:
 *                 pickupLocation: { "address": "123 Cyber Street, Neo City" }
 *                 dropoffLocation: { "address": "456 Tech Avenue, Matrix Plaza" }
 *                 distance: 12.5
 *                 duration: 28
 *               riderInformation:
 *                 name: "Joshua .T"
 *                 rating: 4.8
 *                 phone: "+2348012345678"
 *                 email: "joshua@email.com"
 *               paymentInformation:
 *                 totalFare: 4200
 *                 paymentMethod: "CARD"
 *                 commission: 840
 *                 netEarnings: 3360
 *               canRate: true
 */
router.get('/rides/:tripId', riderAuth, getTripInfo);

// ==================== CONVERSATION & MESSAGING ====================
/**
 * @swagger
 * /api/rides/conversations:
 *   post:
 *     summary: Create conversation between rider and driver for a trip
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tripId]
 *             properties:
 *               tripId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Conversation created
 */
router.post('/rides/conversations', riderAuth, createConversation);

/**
 * @swagger
 * /api/rides/conversations/{conversationId}/messages:
 *   post:
 *     summary: Send message or voice note in conversation
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               conversationId: { type: string, format: uuid }
 *               content: { type: string }
 *               voiceNoteUrl: { type: string }
 *               type: { type: string, enum: ["TEXT", "VOICE_NOTE"] }
 *     responses:
 *       201:
 *         description: Message sent
 */
router.post('/rides/conversations/:conversationId/messages', riderAuth, validate(sendMessageSchema), sendMessage);

/**
 * @swagger
 * /api/rides/conversations/{conversationId}/messages:
 *   get:
 *     summary: Get all messages in a conversation
 *     tags: [Ride Booking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of messages
 */
router.get('/rides/conversations/:conversationId/messages', riderAuth, getConversationMessages);

export default router;