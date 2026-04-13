import { Request, Response } from 'express';
import * as courierService from './courier-management-operations.service';
import { courierFilterSchema, deliveryFilterSchema } from './courier-management-operations.dto';

export const getCourierStats = async (req: Request, res: Response) => {
  const stats = await courierService.getCourierStats();
  res.json(stats);
};

export const getCourierDrivers = async (req: Request, res: Response) => {
  const { page, limit, status, vehicleType, search } = courierFilterSchema.parse(req.query);
  const result = await courierService.getCourierDrivers(page, limit, status, vehicleType, search);
  res.json(result);
};

export const getActiveDeliveries = async (req: Request, res: Response) => {
  const data = await courierService.getActiveDeliveries();
  res.json(data);
};

export const getDeliveryHistory = async (req: Request, res: Response) => {
  const { page, limit, status, search } = deliveryFilterSchema.parse(req.query);
  const result = await courierService.getDeliveryHistory(page, limit, status, search);
  res.json(result);
};