import { Request, Response } from 'express';
import * as service from './courier-growth-management.service';
import { z } from 'zod';

export const getPromoStats = async (_req: Request, res: Response) => {
  const stats = await service.getPromoStats();
  res.json(stats);
};

export const getPromotionalCampaigns = async (_req: Request, res: Response) => {
  const campaigns = await service.getPromotionalCampaigns();
  res.json(campaigns);
};

export const createPromoCode = async (req: Request, res: Response) => {
  try {
    const promo = await service.createPromoCode(req.body);
    res.status(201).json({ message: 'Promo code created successfully', promo });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to create promo code' });
  }
};

export const updatePromoCode = async (req: Request, res: Response) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const promo = await service.updatePromoCode(id, req.body);
    res.json({ message: 'Promo code updated successfully', promo });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to update promo code' });
  }
};

export const togglePromoStatus = async (req: Request, res: Response) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const promo = await service.togglePromoStatus(id);
    res.json({ message: 'Promo status toggled successfully', promo });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to toggle promo status' });
  }
};

export const getAlerts = async (_req: Request, res: Response) => {
  try {
    const alerts = await service.getAlerts();
    res.json(alerts);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch alerts' });
  }
};