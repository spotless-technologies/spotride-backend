import prisma from '../config/prisma';

export const getHubCityStats = async () => {
  const [totalCities, activeZones, totalHubs, activeHubs] = await Promise.all([
    prisma.city.count(),
    prisma.city.count({ where: { isActive: true } }),
    prisma.hub.count(),
    prisma.hub.count({ where: { isActive: true } }),
  ]);

  return {
    totalCities,
    activeZones,
    totalHubs,
    activeHubs,
  };
};

export const getCities = async () => {
  return prisma.city.findMany({
    include: {
      hubs: true,
    },
    orderBy: { name: 'asc' },
  });
};

export const createCity = async (data: any) => {
  const serviceZonesArray = data.serviceZones
    ? data.serviceZones.split(',').map((z: string) => z.trim()).filter(Boolean)
    : [];

  return prisma.city.create({
    data: {
      name: data.name,
      state: data.state,
      country: data.country,
      latitude: data.latitude,
      longitude: data.longitude,
      serviceZones: serviceZonesArray,
      isActive: true,
    },
  });
};

export const updateCity = async (id: string, data: any) => {
  const serviceZonesArray = data.serviceZones
    ? data.serviceZones.split(',').map((z: string) => z.trim()).filter(Boolean)
    : undefined;

  return prisma.city.update({
    where: { id },
    data: {
      name: data.name,
      state: data.state,
      latitude: data.latitude,
      longitude: data.longitude,
      serviceZones: serviceZonesArray,
      isActive: data.isActive,
    },
  });
};

export const getHubs = async () => {
  return prisma.hub.findMany({
    include: {
      city: true,
    },
    orderBy: { name: 'asc' },
  });
};

export const createHub = async (data: any) => {
  const cityExists = await prisma.city.findUnique({
    where: { id: data.cityId }
  });

  if (!cityExists) {
    throw new Error('City with the provided cityId does not exist');
  }

  return prisma.hub.create({
    data: {
      name: data.name,
      address: data.address,
      cityId: data.cityId,
      latitude: data.latitude,
      longitude: data.longitude,
      capacity: data.capacity,
      operatingHours: data.operatingHours,
      assignedDrivers: data.assignedDrivers,
      isActive: true,
    },
  });
};

export const updateHub = async (id: string, data: any) => {
  return prisma.hub.update({
    where: { id },
    data: {
      name: data.name,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      capacity: data.capacity,
      operatingHours: data.operatingHours,
      assignedDrivers: data.assignedDrivers,
      isActive: data.isActive,
    },
  });
};

export const updateHubStatus = async (id: string, isActive: boolean) => {
  return prisma.hub.update({
    where: { id },
    data: { isActive },
  });
};