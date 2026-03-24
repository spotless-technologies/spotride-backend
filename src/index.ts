import "dotenv/config";
import express from 'express';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import driversRoutes from './routes/drivers.routes';
import ridersRoutes from './routes/riders.routes';
import carOwnersRoutes from './routes/car-owners.routes';
import scheduledRidesRoutes from './routes/scheduled-rides.routes';

import driverProfileRoutes from './routes/driver-profile.routes';
import driverStatusRoutes from './routes/driver-status.routes';
import rideRequestsRoutes from './routes/ride-requests.routes';
import driverTripsRoutes from './routes/driver-trips.routes';
import driverEarningsRoutes from './routes/driver-earnings.routes';
import driverMapRoutes from './routes/driver-map.routes';
import driverNotificationsRoutes from './routes/driver-notifications.routes';
import driverVehicleRoutes from './routes/driver-vehicle.routes';
import driverSettingsRoutes from './routes/driver-settings.routes';

import prisma from './config/prisma';
import cors from 'cors';
import type { OpenAPIV3 } from 'openapi-types';

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
      title: 'SpotRide Auth API',
      version: '1.0.0',
      description: 'Authentication API – email/phone/social + OTP verification + password reset',
    },
servers: [
  {
    url: 'https://spotride-backend.onrender.com',
    description: 'Production',
  },
  {
    url: 'http://localhost:5000',
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
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
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
app.use('/dashboard', dashboardRoutes); 
app.use('/drivers', driversRoutes);
app.use('/riders', ridersRoutes);
app.use('/car-owners', carOwnersRoutes);
app.use('/scheduled-rides', scheduledRidesRoutes);

app.use('/driver', driverProfileRoutes);
app.use('/driver', driverStatusRoutes);
app.use('/driver', rideRequestsRoutes);
app.use('/driver', driverTripsRoutes);
app.use('/driver', driverEarningsRoutes);
app.use('/driver', driverMapRoutes);
app.use('/driver', driverNotificationsRoutes);
app.use('/driver', driverVehicleRoutes);
app.use('/driver', driverSettingsRoutes);

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