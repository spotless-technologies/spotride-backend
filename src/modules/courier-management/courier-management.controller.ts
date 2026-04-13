import { Request, Response } from 'express';
import * as service from './courier-management.service';
import { z } from 'zod';

export const getSurcharges = async (_req: Request, res: Response) => {
  const data = await service.getSurcharges();
  res.json(data);
};

export const updateSurcharge = async (req: Request, res: Response) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const result = await service.updateSurcharge(id, req.body);
    res.json({ message: 'Surcharge updated successfully', data: result });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to update surcharge' });
  }
};

export const getGeographicZones = async (_req: Request, res: Response) => {
  const data = await service.getGeographicZones();
  res.json(data);
};

export const createGeographicZone = async (req: Request, res: Response) => {
  try {
    const zone = await service.createGeographicZone(req.body);
    res.status(201).json({ message: 'Geographic zone created successfully', zone });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to create zone' });
  }
};

export const getCourierCategories = async (_req: Request, res: Response) => {
  const data = await service.getCourierCategories();
  res.json(data);
};

export const createCourierCategory = async (req: Request, res: Response) => {
  try {
    const category = await service.createCourierCategory(req.body);
    res.status(201).json({ message: 'Category created successfully', category });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to create category' });
  }
};

export const getDisputeStats = async (_req: Request, res: Response) => {
  const stats = await service.getDisputeStats();
  res.json(stats);
};

export const getDisputes = async (_req: Request, res: Response) => {
  const disputes = await service.getDisputes();
  res.json(disputes);
};

export const updateDispute = async (req: Request, res: Response) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const dispute = await service.updateDispute(id, req.body);
    res.json({ message: 'Dispute updated successfully', dispute });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to update dispute' });
  }
};

export const getPayouts = async (_req: Request, res: Response) => {
  const payouts = await service.getPayouts();
  res.json(payouts);
};

export const updatePayoutStatus = async (req: Request, res: Response) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const { status } = req.body;
    const payout = await service.updatePayoutStatus(id, status);
    res.json({ message: `Payout status updated to ${status}`, payout });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to update payout status' });
  }
};