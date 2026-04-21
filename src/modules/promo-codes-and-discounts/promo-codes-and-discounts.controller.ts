import { Request, Response } from 'express';
import * as service from './promo-codes-and-discounts.service';
import { createPromoSchema, updatePromoSchema, promoActionSchema, usageReportSchema } from './promo-codes-and-discounts.dto';
import { z } from 'zod';

export const getPromoStats = async (req: Request, res: Response) => {
  try {
    const stats = await service.getPromoStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch promo statistics' });
  }
};

export const getPromoList = async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const promos = await service.getPromoList(status);
    res.json(promos);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch promo list' });
  }
};

export const createPromo = async (req: Request, res: Response) => {
  try {
    const data = createPromoSchema.parse(req.body);
    const promo = await service.createPromo(data);
    res.status(201).json({ message: 'Promo code created successfully', promo });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updatePromo = async (req: Request, res: Response) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const data = updatePromoSchema.parse(req.body);
    const promo = await service.updatePromo(id, data);
    res.json({ message: 'Promo updated successfully', promo });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const togglePromoStatus = async (req: Request, res: Response) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const { action } = promoActionSchema.parse(req.body);
    const promo = await service.togglePromoStatus(id, action);
    res.json({ message: `Promo ${action.toLowerCase()}d successfully`, promo });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getUsageReport = async (req: Request, res: Response) => {
  try {
    const { promoId } = usageReportSchema.parse(req.params);
    const report = await service.getUsageReport(promoId);
    res.json(report);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};