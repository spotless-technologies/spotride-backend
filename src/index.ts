import "dotenv/config";
import express from 'express';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import authRoutes from './modules/auth/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import driversRoutes from './routes/drivers.routes';
import ridersRoutes from './routes/riders.routes';
import carOwnersRoutes from './routes/car-owners.routes';
import scheduledRidesRoutes from './routes/scheduled-rides.routes';
import tripManagementRoutes from './routes/trip-management.routes';
import carRentalListingsRoutes from './routes/car-rental-listings.routes';
import carRentalBookingsRoutes from './modules/car-rental-bookings/car-rental-bookings.routes';
import carRentalPricingAndCategoriesRoutes from './modules/car-rental-pricing-and-categories/car-rental-pricing-and-categories.routes';
import disputesRoutes from './modules/disputes-and-complaints/disputes-and-complaints.routes';
import liveRentalMonitoringRoutes from './modules/live-rental-monitoring/live-rental-monitoring.routes';
import supportAnalyticsRoutes from './modules/support-and-analytics/support-and-analytics.routes';
import hubsAndCitiesManagementRoutes from './modules/hubs-and-cities-management/hubs-and-cities-management.routes';
import courierManagementRoutes from './modules/courier-management/courier-management.routes';
import courierManagementOperationsRoutes from './modules/courier-management-operations/courier-management-operations.routes';
import courierGrowthManagementRoutes from './modules/courier-growth-management/courier-growth-management.routes';
import driverEarningsWalletRoutes from './modules/driver-earnings-and-wallet/driver-earnings-and-wallet.routes';
import carOwnerEarningsRoutes from './modules/car-owner-earnings-and-payouts/car-owner-earnings-and-payouts.routes';
import transactionHistoryRoutes from './modules/transaction-history-and-revenue-reports/transaction-history-and-revenue-reports.routes';
import promoCodesRoutes from './modules/promo-codes-and-discounts/promo-codes-and-discounts.routes';
// import adminRolesAndPermissionsRoutes from './modules/admin-roles-and-permissions/admin-roles-and-permissions.routes';

import driverProfileRoutes from './modules/driver-profile/driver-profile.routes';
import driverStatusRoutes from './routes/driver-status.routes';
import rideRequestsRoutes from './routes/ride-requests.routes';
import driverTripsRoutes from './routes/driver-trips.routes';
import driverEarningsRoutes from './routes/driver-earnings.routes';
import driverMapRoutes from './routes/driver-map.routes';
import driverNotificationsRoutes from './routes/driver-notifications.routes';
import driverSettingsRoutes from './routes/driver-settings.routes';
import driverVehicleRoutes from './modules/driver-vehicle/driver-vehicle.routes';
import driverDocumentsRoutes from './modules/driver-documents/driver-documents.routes';


import rideBookingRoutes from './modules/ride-booking/ride-booking.routes';

import prisma from './config/prisma';
import cors from 'cors';
import type { OpenAPIV3 } from 'openapi-types';
import { errorHandler } from "./middleware/error-handler";

const app = express();

app.set("trust proxy", 1);

app.use(cors({
  origin: true,     
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 204,
  exposedHeaders: ['Set-Cookie']
}));

app.options(/.*/, cors());

app.use(express.json());
app.use(cookieParser());

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SpotRide API',
      version: '1.0.0',
      description: '**SpotRide** - Complete Ride-Hailing, Car Rental & Courier Platform Backend API',
    },
servers: [
  {
    url: 'https://spotride-backend.onrender.com',
    description: 'Production',
  },
  {
    url: 'http://localhost:5001',
    description: 'Development',
  },
],
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints',
      },
    ],
    components: {
      securitySchemes: {
         bearerAuth: {           
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'refreshToken',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts', './src/car-rental-bookings/*.ts', './src/**/*.routes.ts',],
};

const spec = swaggerJsdoc(swaggerOptions) as OpenAPIV3.Document;

app.get('/api-docs.json', (req, res) => {
  const protocol =
    process.env.NODE_ENV === "production" ? "https" : req.protocol;

  spec.servers = [
    {
      url: `${protocol}://${req.get("host")}`,
      description: "Current server (auto-detected)",
    },
  ];

  res.json(spec);
});

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(null, {                       
    swaggerOptions: {
      url: '/api-docs.json',                    
      persistAuthorization: true,
    },
    explorer: true,
  })
);

// Routes
app.use('/api/auth', authRoutes);

app.use('/api/admin', dashboardRoutes); 
app.use('/api/admin', driversRoutes);
app.use('/api/admin', ridersRoutes);
app.use('/api/admin', carOwnersRoutes);
app.use('/api/admin', scheduledRidesRoutes);
app.use('/api/admin', tripManagementRoutes);
app.use('/api/admin', carRentalListingsRoutes);
app.use('/api/admin', carRentalBookingsRoutes);
app.use('/api/admin', carRentalPricingAndCategoriesRoutes);
app.use('/api/admin', disputesRoutes);
app.use('/api/admin', liveRentalMonitoringRoutes);
app.use('/api/admin', supportAnalyticsRoutes);
app.use('/api/admin', hubsAndCitiesManagementRoutes);
app.use('/api/admin', courierManagementRoutes);
app.use('/api/admin', courierManagementOperationsRoutes);
app.use('/api/admin', courierGrowthManagementRoutes);
app.use('/api/admin', driverEarningsWalletRoutes);
app.use('/api/admin', carOwnerEarningsRoutes);
app.use('/api/admin', transactionHistoryRoutes);
app.use('/api/admin', promoCodesRoutes);
// app.use('/api/admin', adminRolesAndPermissionsRoutes);

app.use('/api/driver', driverProfileRoutes);
app.use('/driver', driverStatusRoutes);
app.use('/driver', rideRequestsRoutes);
app.use('/driver', driverTripsRoutes);
app.use('/driver', driverEarningsRoutes);
app.use('/driver', driverMapRoutes);
app.use('/driver', driverNotificationsRoutes);
app.use('/driver', driverVehicleRoutes);
app.use('/api/driver', driverDocumentsRoutes);
app.use('/driver', driverSettingsRoutes);

app.use('/api', rideBookingRoutes);

app.use(errorHandler);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: "Welcome to SpotRide Auth API",
    docs: "/api-docs",
  });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 5001;

app.listen(PORT, '0.0.0.0', async () => {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = process.env.RENDER_EXTERNAL_HOSTNAME || `localhost:${PORT}`;

  console.log(`Server running on ${protocol}://${host}`);
  console.log(`Swagger UI:   ${protocol}://${host}/api-docs`);
});

process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await prisma.$disconnect();
  process.exit(0);
});