import { Request, Response } from 'express';
import * as hubService from './hub-and-city-management.service';
import { citySchema, hubSchema, statusUpdateSchema } from './hub-and-city-management.dto';
import { z } from 'zod';

export const getHubCityStats = async (req: Request, res: Response) => {
  const stats = await hubService.getHubCityStats();
  res.json(stats);
};

export const getCities = async (req: Request, res: Response) => {
  const cities = await hubService.getCities();
  res.json(cities);
};

export const createCity = async (req: Request, res: Response) => {
  const data = citySchema.parse(req.body);
  const city = await hubService.createCity(data);
  res.status(201).json({ message: 'City created successfully', city });
};

export const updateCity = async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const data = citySchema.partial().parse(req.body);
  const city = await hubService.updateCity(id, data);
  res.json({ message: 'City updated successfully', city });
};

export const getHubs = async (req: Request, res: Response) => {
  const hubs = await hubService.getHubs();
  res.json(hubs);
};

export const createHub = async (req: Request, res: Response) => {
  try {
    const data = hubSchema.parse(req.body);
    const hub = await hubService.createHub(data);
    res.status(201).json({ message: 'Hub created successfully', hub });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        message: 'Validation failed',
        errors: error.errors.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    } else {
      res.status(400).json({ message: error.message || 'Failed to create hub' });
    }
  }
};

export const updateHub = async (req: Request, res: Response) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const data = hubSchema.partial().parse(req.body);
    const hub = await hubService.updateHub(id, data);
    res.json({ message: 'Hub updated successfully', hub });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        message: 'Validation failed',
        errors: error.errors.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    } else {
      res.status(400).json({ message: error.message || 'Failed to update hub' });
    }
  }
};

export const updateHubStatus = async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const { status } = statusUpdateSchema.parse(req.body);
  const hub = await hubService.updateHubStatus(id, status === 'Active');
  res.json({ message: 'Hub status updated', hub });
};