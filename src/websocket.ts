import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import env from './config/env';
import prisma from './config/prisma';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  driverId?: string;
  role?: string;
}

export const setupSocketIO = (httpServer: HttpServer) => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication Middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error: No token'));

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, role: true },
      });

      if (!user) return next(new Error('User not found'));

      socket.userId = user.id;
      socket.role = user.role;

      // If driver, fetch driver profile
      if (user.role === 'DRIVER') {
        const driver = await prisma.driver.findUnique({
          where: { userId: user.id },
          select: { id: true },
        });
        socket.driverId = driver?.id;
      }

      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`Socket connected - User: ${socket.userId}, Role: ${socket.role}, Driver: ${socket.driverId}`);

    // Real-time location update (Driver only)
    socket.on('location-update', async (data: { lat: number; lng: number }) => {
      if (!socket.driverId) return;
      await prisma.driver.update({
        where: { id: socket.driverId },
        data: { currentLocation: data, lastLocationUpdate: new Date() },
      });
      io.to('admins').emit('driver-location-updated', { driverId: socket.driverId, location: data });
    });

    // === REAL-TIME RIDE MATCHING ENGINE ===
    socket.on('ride:request-matching', async (tripId: string) => {
      if (!socket.userId) return;

      const onlineDrivers = await prisma.driver.findMany({
        where: { isOnline: true, status: 'approved' },
        select: { id: true, userId: true },
      });

      onlineDrivers.forEach((driver) => {
        io.to(`driver-room-${driver.id}`).emit('ride:new-request', {
          tripId,
          timestamp: new Date(),
        });
      });

      await prisma.trip.update({
        where: { id: tripId },
        data: { status: "SEARCHING_DRIVER" },
      });
    });

    socket.on('ride:accept', async ({ tripId }: { tripId: string }) => {
      if (!socket.driverId) return;

      try {
        const trip = await prisma.trip.update({
          where: { id: tripId, status: "SEARCHING_DRIVER" },
          data: { driverId: socket.driverId, status: "DRIVER_ASSIGNED" },
        });

        // Notify rider
        io.to(`rider-room-${trip.riderId}`).emit('ride:driver-accepted', {
          tripId,
          driverId: socket.driverId,
        });

        // Remove request from other drivers
        io.emit('ride:removed', { tripId });
      } catch (err) {
        socket.emit('ride:error', { message: 'Failed to accept ride' });
      }
    });

    // Join personal rooms
    if (socket.driverId) socket.join(`driver-room-${socket.driverId}`);
    if (socket.userId) socket.join(`rider-room-${socket.userId}`);

    // Admin room
    if (socket.role === 'ADMIN') socket.join('admins');

    socket.on('disconnect', () => {
      console.log(`Socket disconnected - User: ${socket.userId}`);
    });
  });

  return io;
};