import prisma from '../../config/prisma';
import { VehicleType } from '@prisma/client';

export const getDriverProfile = async (driverId: string, userId: string) => {
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          profilePicture: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!driver) throw new Error('Driver profile not found');

  return {
    id: driver.id,
    userId: driver.userId,
    email: driver.user.email,
    phone: driver.user.phone,
    firstName: driver.user.firstName,
    lastName: driver.user.lastName,
    fullName: `${driver.user.firstName || ''} ${driver.user.lastName || ''}`.trim() || 'Unknown Driver',
    profilePicture: driver.user.profilePicture,
    rating: driver.rating,
    totalTrips: driver.totalTrips,
    totalEarnings: driver.totalEarnings,
    status: driver.status,
    rejectionReason: driver.rejectionReason,
    isOnline: driver.isOnline,
    vehicleModel: driver.vehicleModel,
    vehiclePlate: driver.vehiclePlate,
    vehicleColor: driver.vehicleColor,
    vehicleType: driver.vehicleType,
    bankName: driver.bankName,
    accountNumber: driver.accountNumber,
    accountName: driver.accountName,
    documentsVerified: driver.documentsVerified,
    licenseNumber: driver.licenseNumber,
    licenseExpiry: driver.licenseExpiry,
    insuranceExpiry: driver.insuranceExpiry,
    registrationExpiry: driver.registrationExpiry,
    inspectionExpiry: driver.inspectionExpiry,
    vehicleFeatures: driver.vehicleFeatures,
    vehiclePhotos: driver.vehiclePhotos,
    createdAt: driver.createdAt,
    updatedAt: driver.updatedAt,
  };
};

export const updateDriverProfile = async (driverId: string, userId: string, data: any) => {
  // Validate driver exists first
  const existingDriver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: { user: true },
  });

  if (!existingDriver) {
    throw new Error('Driver profile not found');
  }

  const driverUpdate: any = {};
  const userUpdate: any = {};

  // User fields
  if (data.firstName !== undefined) {
    userUpdate.firstName = data.firstName;
  }
  if (data.lastName !== undefined) {
    userUpdate.lastName = data.lastName;
  }
  
  // Driver fields - ALL fields including bank info
  if (data.vehicleModel !== undefined) {
    driverUpdate.vehicleModel = data.vehicleModel;
  }
  if (data.vehicleColor !== undefined) {
    driverUpdate.vehicleColor = data.vehicleColor;
  }
  if (data.vehicleType !== undefined) {
    driverUpdate.vehicleType = data.vehicleType as VehicleType;
  }
  if (data.bankName !== undefined) {
    driverUpdate.bankName = data.bankName;
  }
  if (data.accountNumber !== undefined) {
    driverUpdate.accountNumber = data.accountNumber;
  }
  if (data.accountName !== undefined) {
    driverUpdate.accountName = data.accountName;
  }
  
  // Handle vehicle plate with uniqueness check
  if (data.vehiclePlate !== undefined) {
    const plateExists = await prisma.driver.findFirst({
      where: {
        vehiclePlate: data.vehiclePlate,
        id: { not: driverId },
      },
    });
    if (plateExists) {
      throw new Error(`Vehicle plate number "${data.vehiclePlate}" has already been registered by another driver.`);
    }
    driverUpdate.vehiclePlate = data.vehiclePlate;
  }

  // Update User fields if any
  if (Object.keys(userUpdate).length > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: userUpdate,
    });
  }

  // Update Driver fields if any
  if (Object.keys(driverUpdate).length > 0) {
    await prisma.driver.update({
      where: { id: driverId },
      data: driverUpdate,
    });
  }

  // Fetch fresh driver data
  const freshDriver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: { user: true },
  });

  if (!freshDriver) {
    throw new Error('Failed to fetch updated driver profile');
  }

  // Return COMPLETE updated driver data
  return {
    success: true,
    message: 'Profile updated successfully',
    data: {
      driver: {
        id: freshDriver.id,
        userId: freshDriver.userId,
        email: freshDriver.user.email,
        phone: freshDriver.user.phone,
        firstName: freshDriver.user.firstName,
        lastName: freshDriver.user.lastName,
        fullName: `${freshDriver.user.firstName || ''} ${freshDriver.user.lastName || ''}`.trim(),
        profilePicture: freshDriver.user.profilePicture,
        rating: freshDriver.rating,
        totalTrips: freshDriver.totalTrips,
        totalEarnings: freshDriver.totalEarnings,
        status: freshDriver.status,
        isOnline: freshDriver.isOnline,
        vehicleModel: freshDriver.vehicleModel,
        vehiclePlate: freshDriver.vehiclePlate,
        vehicleColor: freshDriver.vehicleColor,
        vehicleType: freshDriver.vehicleType,
        bankName: freshDriver.bankName,
        accountNumber: freshDriver.accountNumber,
        accountName: freshDriver.accountName,
        documentsVerified: freshDriver.documentsVerified,
        createdAt: freshDriver.createdAt,
        updatedAt: freshDriver.updatedAt,
      },
    },
  };
};

export const uploadProfilePhoto = async (userId: string, photoUrl: string) => {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { profilePicture: photoUrl },
  });

  const driver = await prisma.driver.findUnique({
    where: { userId: userId },
    include: { user: true },
  });

  if (!driver) {
    throw new Error('Driver profile not found');
  }

  return {
    message: 'Profile photo uploaded successfully',
    url: photoUrl,
    driver: {
      id: driver.id,
      userId: driver.userId,
      email: driver.user.email,
      phone: driver.user.phone,
      firstName: driver.user.firstName,
      lastName: driver.user.lastName,
      fullName: `${driver.user.firstName || ''} ${driver.user.lastName || ''}`.trim(),
      profilePicture: driver.user.profilePicture,
      rating: driver.rating,
      totalTrips: driver.totalTrips,
      totalEarnings: driver.totalEarnings,
      status: driver.status,
      isOnline: driver.isOnline,
      vehicleModel: driver.vehicleModel,
      vehiclePlate: driver.vehiclePlate,
      vehicleColor: driver.vehicleColor,
      vehicleType: driver.vehicleType,
    },
  };
};

export const getRatingSummary = async (driverId: string) => {
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    select: { 
      rating: true, 
      totalTrips: true,
      totalEarnings: true,
    },
  });

  if (!driver) {
    throw new Error('Driver not found');
  }

  return {
    averageRating: driver.rating || 0,
    totalReviews: driver.totalTrips || 0,
    totalTrips: driver.totalTrips || 0,
    totalEarnings: driver.totalEarnings || 0,
  };
};