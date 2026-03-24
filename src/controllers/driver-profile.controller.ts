import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { DriverRequest } from '../middleware/driver';
import { z } from 'zod';

const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  vehicleModel: z.string().optional(),
  vehiclePlate: z.string().optional(),
  vehicleColor: z.string().optional(),
});

export const getProfile = async (req: DriverRequest, res: Response) => {
  const driver = await prisma.driver.findUnique({
    where: { id: req.driver!.driverId },
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

  if (!driver) {
    return res.status(404).json({ message: 'Driver profile not found' });
  }

  const fullName = `${driver.user.firstName || ''} ${driver.user.lastName || ''}`.trim() || 'Unknown Driver';

  res.json({
    id: driver.id,
    fullName,
    photo: driver.user.profilePicture || null,
    rating: driver.rating,
    vehicleModel: driver.vehicleModel,
    isOnline: driver.isOnline,
  });
};

export const updateProfile = async (req: DriverRequest, res: Response) => {
  const data = updateProfileSchema.parse(req.body);

  const driverUpdateData: any = {};
  if (data.vehicleModel !== undefined) driverUpdateData.vehicleModel = data.vehicleModel;
  if (data.vehiclePlate !== undefined) driverUpdateData.vehiclePlate = data.vehiclePlate;
  if (data.vehicleColor !== undefined) driverUpdateData.vehicleColor = data.vehicleColor;

  const userUpdateData: any = {};
  if (data.firstName !== undefined) userUpdateData.firstName = data.firstName;
  if (data.lastName !== undefined) userUpdateData.lastName = data.lastName;

  // Update driver fields if any
  let updatedDriver = null;
  if (Object.keys(driverUpdateData).length > 0) {
    updatedDriver = await prisma.driver.update({
      where: { id: req.driver!.driverId },
      data: driverUpdateData,
      include: { user: true },
    });
  }

  // Update user fields if any
  if (Object.keys(userUpdateData).length > 0) {
    await prisma.user.update({
      where: { id: req.driver!.userId },
      data: userUpdateData,
    });
  }

  // Refetch driver to ensure latest data
  const finalDriver = await prisma.driver.findUnique({
    where: { id: req.driver!.driverId },
    include: { user: true },
  });

  res.json({
    message: 'Profile updated successfully',
    driver: finalDriver,
  });
};

export const uploadProfilePhoto = async (req: DriverRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No photo file uploaded' });
  }

  // multer-s3 adds .location property with the S3 URL
  const photoUrl = (req.file as any).location;

  if (!photoUrl) {
    return res.status(500).json({ message: 'Failed to get S3 URL from upload' });
  }

  await prisma.user.update({
    where: { id: req.driver!.userId },
    data: { profilePicture: photoUrl },
  });

  res.json({
    message: 'Profile photo uploaded successfully',
    url: photoUrl,
  });
};

export const getRatingSummary = async (req: DriverRequest, res: Response) => {
  const driver = await prisma.driver.findUnique({
    where: { id: req.driver!.driverId },
    select: {
      rating: true,
      totalTrips: true,
    },
  });

  if (!driver) {
    return res.status(404).json({ message: 'Driver not found' });
  }

  res.json({
    averageRating: driver.rating || 0,
    totalReviews: driver.totalTrips || 0,
  });
};

export const uploadDocuments = async (req: DriverRequest, res: Response) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

  if (!files || Object.keys(files).length === 0) {
    return res.status(400).json({ message: 'No document files uploaded' });
  }

  const updates: any = {};

  if (files.license?.[0]) {
    updates.licenseUrl = (files.license[0] as any).location;
  }
  if (files.vehicleReg?.[0]) {
    updates.vehicleRegUrl = (files.vehicleReg[0] as any).location;
  }
  if (files.insurance?.[0]) {
    updates.insuranceUrl = (files.insurance[0] as any).location;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'No valid documents processed' });
  }

  await prisma.driver.update({
    where: { id: req.driver!.driverId },
    data: updates,
  });

  res.json({
    message: 'Documents successfully uploaded to S3',
    uploaded: Object.keys(updates),
  });
};

export const getDocuments = async (req: DriverRequest, res: Response) => {
  const driver = await prisma.driver.findUnique({
    where: { id: req.driver!.driverId },
    select: {
      licenseUrl: true,
      vehicleRegUrl: true,
      insuranceUrl: true,
      documentsVerified: true,
    },
  });

  if (!driver) {
    return res.status(404).json({ message: 'Driver not found' });
  }

  res.json(driver);
};