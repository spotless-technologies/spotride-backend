import { Request, Response } from 'express';
import * as service from './hubs-and-cities-management.service';
import * as dto from './hubs-and-cities-management.dto';
import { z } from 'zod';

export const getHubCityStats = async (req: Request, res: Response) => {
  const stats = await service.getHubCityStats();
  res.json(stats);
};

export const getCities = async (req: Request, res: Response) => {
  const cities = await service.getCities();
  res.json(cities);
};

export const createCity = async (req: Request, res: Response) => {
  const data = dto.citySchema.parse(req.body);
  const city = await service.createCity(data);
  res.status(201).json({ message: 'City created successfully', city });
};

export const updateCity = async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const data = dto.citySchema.partial().parse(req.body);
  const city = await service.updateCity(id, data);
  res.json({ message: 'City updated successfully', city });
};

export const getHubs = async (req: Request, res: Response) => {
  const hubs = await service.getHubs();
  res.json(hubs);
};

export const createHub = async (req: Request, res: Response) => {
  const data = dto.hubSchema.parse(req.body);
  const hub = await service.createHub(data);
  res.status(201).json({ message: 'Hub created successfully', hub });
};

export const configureHub = async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const data = dto.configureHubSchema.parse(req.body);
  const hub = await service.configureHub(id, data);
  res.json({ message: 'Hub configured successfully', hub });
};

export const getHubStats = async (req: Request, res: Response) => {
  const stats = await service.getHubStats();
  res.json(stats);
};