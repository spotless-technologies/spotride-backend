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

    socket.on('disconnect', () => {
      console.log(`Driver disconnected: ${socket.driverId || 'unknown'}`);
    });
  });

  return io;
};