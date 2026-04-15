import prisma from '../../config/prisma';

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
    include: { hubs: true },
    orderBy: { name: 'asc' },
  });
};

export const createCity = async (data: any) => {
  const serviceZones = data.serviceZones 
    ? data.serviceZones.split(',').map((z: string) => z.trim()).filter(Boolean)
    : [];

  return prisma.city.create({
    data: {
      name: data.name,
      state: data.state,
      country: data.country,
      latitude: data.latitude,
      longitude: data.longitude,
      serviceZones,
      pricingLevel: data.pricingLevel,
    },
  });
};

export const updateCity = async (id: string, data: any) => {
  const serviceZones = data.serviceZones 
    ? data.serviceZones.split(',').map((z: string) => z.trim()).filter(Boolean)
    : undefined;

  return prisma.city.update({
    where: { id },
    data: {
      name: data.name,
      state: data.state,
      latitude: data.latitude,
      longitude: data.longitude,
      serviceZones,
      pricingLevel: data.pricingLevel,
    },
  });
};

export const getHubs = async () => {
  return prisma.hub.findMany({
    include: { city: true },
    orderBy: { name: 'asc' },
  });
};

export const createHub = async (data: any) => {
  return prisma.hub.create({
    data: {
      name: data.name,
      address: data.address,
      cityId: data.cityId,
      latitude: data.latitude,
      longitude: data.longitude,
      operatingHours: data.operatingHours,
      capacity: data.capacity,
      zonesCovered: data.zonesCovered || [],
      pricingTier: data.pricingTier,
      baseAdjustment: data.baseAdjustment,
      distanceMultiplier: data.distanceMultiplier,
      isActive: true,
    },
  });
};

export const configureHub = async (id: string, data: any) => {
  return prisma.hub.update({
    where: { id },
    data: {
      zonesCovered: data.zonesCovered,
      pricingTier: data.pricingTier,
      baseAdjustment: data.baseAdjustment,
      distanceMultiplier: data.distanceMultiplier,
    },
  });
};

export const getHubStats = async () => {
  const [totalHubs, activeHubs] = await Promise.all([
    prisma.hub.count(),
    prisma.hub.count({ where: { isActive: true } }),
  ]);

  return { totalHubs, activeHubs };
};