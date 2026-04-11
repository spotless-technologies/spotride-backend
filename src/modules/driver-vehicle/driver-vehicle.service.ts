import prisma from '../../config/prisma';

export const getVehicle = async (driverId: string) => {
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    select: {
      vehicleModel: true,
      vehiclePlate: true,
      vehicleColor: true,
      vehicleYear: true,
      vehicleType: true,
      vehicleFeatures: true,
      vehiclePhotos: true,
      vehicleRegUrl: true,
      insuranceUrl: true,
      registrationExpiry: true,
      insuranceExpiry: true,
    },
  });

  if (!driver) throw new Error('Vehicle information not found');

  return {
    vehicleModel: driver.vehicleModel,
    vehiclePlate: driver.vehiclePlate,
    vehicleColor: driver.vehicleColor,
    vehicleYear: driver.vehicleYear,
    vehicleType: driver.vehicleType,
    vehicleFeatures: driver.vehicleFeatures || [],
    vehiclePhotos: driver.vehiclePhotos || [],
    vehicleRegUrl: driver.vehicleRegUrl,
    insuranceUrl: driver.insuranceUrl,
    registrationExpiry: driver.registrationExpiry,
    insuranceExpiry: driver.insuranceExpiry,
  };
};

export const updateVehicle = async (driverId: string, data: any) => {
  const updated = await prisma.driver.update({
    where: { id: driverId },
    data: {
      vehicleModel: data.vehicleModel,
      vehiclePlate: data.vehiclePlate,
      vehicleColor: data.vehicleColor,
      vehicleYear: data.vehicleYear,
      vehicleType: data.vehicleType,
      vehicleFeatures: data.vehicleFeatures,
    },
  });

  return { 
    message: 'Vehicle information updated successfully', 
    vehicle: updated 
  };
};

export const uploadVehiclePhotos = async (driverId: string, photoUrls: string[]) => {
  if (!Array.isArray(photoUrls) || photoUrls.length === 0) {
    throw new Error('No photo URLs provided');
  }

  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    select: { vehiclePhotos: true },
  });

  const currentPhotos = Array.isArray(driver?.vehiclePhotos) ? driver.vehiclePhotos : [];
  const updatedPhotos = [...currentPhotos, ...photoUrls];

  await prisma.driver.update({
    where: { id: driverId },
    data: { vehiclePhotos: updatedPhotos },
  });

  return { 
    message: 'Vehicle photos uploaded successfully',
    count: photoUrls.length,
    totalPhotos: updatedPhotos.length,
    photos: photoUrls 
  };
};