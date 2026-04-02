import prisma from '../config/prisma';

export const getDriverProfile = async (driverId: string, userId: string) => {
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
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

  if (!driver) throw new Error('Driver profile not found');

  return {
    id: driver.id,
    fullName: `${driver.user.firstName || ''} ${driver.user.lastName || ''}`.trim() || 'Unknown Driver',
    photo: driver.user.profilePicture,
    rating: driver.rating,
    vehicleModel: driver.vehicleModel,
    vehicleType: driver.vehicleType,
    isOnline: driver.isOnline,
  };
};

export const updateDriverProfile = async (driverId: string, userId: string, data: any) => {
  const driverUpdate: any = {};
  const userUpdate: any = {};

  if (data.firstName !== undefined) userUpdate.firstName = data.firstName;
  if (data.lastName !== undefined) userUpdate.lastName = data.lastName;
  if (data.vehicleModel !== undefined) driverUpdate.vehicleModel = data.vehicleModel;
  if (data.vehiclePlate !== undefined) driverUpdate.vehiclePlate = data.vehiclePlate;
  if (data.vehicleColor !== undefined) driverUpdate.vehicleColor = data.vehicleColor;
  if (data.vehicleType !== undefined) driverUpdate.vehicleType = data.vehicleType;

  if (Object.keys(userUpdate).length > 0) {
    await prisma.user.update({ where: { id: userId }, data: userUpdate });
  }

  if (Object.keys(driverUpdate).length > 0) {
    await prisma.driver.update({ where: { id: driverId }, data: driverUpdate });
  }

  return { message: 'Profile updated successfully' };
};

export const uploadProfilePhoto = async (userId: string, photoUrl: string) => {
  await prisma.user.update({
    where: { id: userId },
    data: { profilePicture: photoUrl },
  });
  return { message: 'Profile photo uploaded', url: photoUrl };
};

export const getRatingSummary = async (driverId: string) => {
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    select: { rating: true, totalTrips: true },
  });

  return {
    averageRating: driver?.rating || 0,
    totalReviews: driver?.totalTrips || 0,
  };
};

export const uploadDocuments = async (driverId: string, files: any) => {
  const updates: any = {};

  if (files.license?.length) updates.licenseUrls = files.license.map((f: any) => f.location);
  if (files.governmentId?.length) updates.governmentIdUrls = files.governmentId.map((f: any) => f.location);
  if (files.vehicleDocuments?.length) updates.vehicleDocumentUrls = files.vehicleDocuments.map((f: any) => f.location);

  await prisma.driver.update({
    where: { id: driverId },
    data: updates,
  });

  return { message: 'Documents uploaded successfully', uploaded: Object.keys(updates) };
};

export const getDocuments = async (driverId: string) => {
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    select: {
      licenseUrls: true,
      governmentIdUrls: true,
      vehicleDocumentUrls: true,
      licenseUrl: true,       
      vehicleRegUrl: true,
      insuranceUrl: true,
      documentsVerified: true,
    },
  });

  return driver || {};
};