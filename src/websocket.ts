import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import env from './config/env';
import prisma from './config/prisma';

interface AuthenticatedSocket extends Socket {
  driverId?: string;
  userId?: string;
}

export const setupSocketIO = (httpServer: HttpServer) => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Socket authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, role: true },
      });

      if (!user) return next(new Error('User not found'));

      if (user.role !== 'DRIVER' && user.role !== 'ADMIN') {
        return next(new Error('Driver or Admin required'));
      }

      const driver = await prisma.driver.findFirst({
        where: { userId: user.id },
        select: { id: true },
      });

      socket.userId = user.id;
      socket.driverId = driver?.id;

      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`Driver connected: ${socket.driverId || 'unknown'}`);

    // Real-time location streaming
    socket.on('location-update', async (data: { lat: number; lng: number }) => {
      if (!socket.driverId) return;

      await prisma.driver.update({
        where: { id: socket.driverId },
        data: {
          currentLocation: data,
          lastLocationUpdate: new Date(),
        },
      });

      io.to('admins').emit('driver-location-updated', {
        driverId: socket.driverId,
        location: data,
        timestamp: new Date(),
      });
    });

    // Check if admin and join room
    (async () => {
      if (socket.userId) {
        const user = await prisma.user.findUnique({
          where: { id: socket.userId },
          select: { role: true },
        });

        if (user?.role === 'ADMIN') {
          socket.join('admins');
          console.log(`Admin ${socket.userId} joined admins room`);
        }
      }
    })();

     // === REAL-TIME RIDE MATCHING ENGINE ===

    // Rider requests matching (call after successful /rides/request)
    socket.on('ride:request-matching', async (tripId: string) => {
      if (!socket.userId) return;

      const onlineDrivers = await prisma.driver.findMany({
        where: { isOnline: true, status: 'approved' },
        select: { id: true },
      });

      onlineDrivers.forEach((driver) => {
        io.to(`driver-room-${driver.id}`).emit('ride:new-request', {
          tripId,
          timestamp: new Date()
        });
      });

      await prisma.trip.update({
        where: { id: tripId },
        data: { status: "SEARCHING_DRIVER" },
      });
    });

    // Driver accepts ride
    socket.on('ride:accept', async ({ tripId }: { tripId: string }) => {
      if (!socket.driverId) return;

      try {
        const trip = await prisma.trip.update({
          where: { id: tripId, status: "SEARCHING_DRIVER" },
          data: {
            driverId: socket.driverId,
            status: "DRIVER_ASSIGNED"
          },
        });

        io.to(`rider-room-${trip.riderId}`).emit('ride:driver-accepted', {
          tripId,
          driverId: socket.driverId,
        });

        io.emit('ride:removed', { tripId });
      } catch (err) {
        socket.emit('ride:error', { message: 'Failed to accept ride' });
      }
    });

    // Join personal rooms
    if (socket.driverId) socket.join(`driver-room-${socket.driverId}`);
    if (socket.userId) socket.join(`rider-room-${socket.userId}`);

    socket.on('disconnect', () => {
      console.log(`Driver disconnected: ${socket.driverId || 'unknown'}`);
    });
  });

  return io;
};