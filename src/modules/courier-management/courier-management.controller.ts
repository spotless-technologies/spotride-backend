import { Request, Response } from 'express';
import * as service from './courier-management.service';
import { z } from 'zod';
import { basePricingSchema, bulkPayoutActionSchema, disputeActionSchema, disputeFilterSchema, payoutFilterSchema } from './courier-management.dto';

export const getSurcharges = async (_req: Request, res: Response) => {
  const data = await service.getSurcharges();
  res.json(data);
};

export const createSurcharge = async (req: Request, res: Response) => {
  try {
    const surcharge = await service.createSurcharge(req.body);
    res.status(201).json({ 
      message: 'Surcharge created successfully', 
      data: surcharge 
    });
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      res.status(409).json({ message: error.message });
    } else {
      res.status(400).json({ message: error.message || 'Failed to create surcharge' });
    }
  }
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

export const updateGeographicZone = async (req: Request, res: Response) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const zone = await service.updateGeographicZone(id, req.body);
    res.json({ message: 'Geographic zone updated successfully', zone });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to update zone' });
  }
};

export const deleteGeographicZone = async (req: Request, res: Response) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    await service.deleteGeographicZone(id);
    res.json({ message: 'Geographic zone deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to delete zone' });
  }
};

export const getAllCourierCategories = async (_req: Request, res: Response) => {
  const data = await service.getAllCourierCategories();
  res.json(data);
};

export const getCourierCategoryById = async (req: Request, res: Response) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const category = await service.getCourierCategoryById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to get category' });
  }
};

export const getCourierCategories = async (_req: Request, res: Response) => {
  const data = await service.getCourierCategories();
  res.json(data);
};

export const createCourierCategory = async (req: Request, res: Response) => {
  try {
    const category = await service.createCourierCategory(req.body);
    res.status(201).json({ 
      message: 'Category created successfully', 
      category 
    });
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      res.status(409).json({ 
        message: error.message,
        suggestion: 'Use a different category name or update the existing category'
      });
    } else {
      res.status(400).json({ 
        message: error.message || 'Failed to create category' 
      });
    }
  }
};

export const updateCourierCategory = async (req: Request, res: Response) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const category = await service.updateCourierCategory(id, req.body);
    res.json({ message: 'Category updated successfully', category });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to update category' });
  }
};

export const deleteCourierCategory = async (req: Request, res: Response) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    await service.deleteCourierCategory(id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to delete category' });
  }
};

export const getCategoryStats = async (_req: Request, res: Response) => {
  try {
    const stats = await service.getCategoryStats();
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to get category stats' });
  }
};

export const getDisputeStats = async (_req: Request, res: Response) => {
  const stats = await service.getDisputeStats();
  res.json(stats);
};

export const getDisputes = async (req: Request, res: Response) => {
  try {
    const filters = disputeFilterSchema.parse(req.query);
    const disputes = await service.getDisputes(filters);
    res.json(disputes);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to get disputes' });
  }
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

export const getDisputeById = async (req: Request, res: Response) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const dispute = await service.getDisputeById(id);
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }
    res.json(dispute);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to get dispute' });
  }
};

export const processDisputeAction = async (req: Request, res: Response) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const { action, amount, notes } = disputeActionSchema.parse(req.body);
    const dispute = await service.processDisputeAction(id, action, amount, notes);
    res.json({ message: `Action ${action} processed successfully`, dispute });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to process dispute action' });
  }
};

export const getPayouts = async (req: Request, res: Response) => {
  try {
    const filters = payoutFilterSchema.parse(req.query);
    const result = await service.getPayouts(filters);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to get payouts' });
  }
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

export const getPayoutSummaryStats = async (_req: Request, res: Response) => {
  try {
    const stats = await service.getPayoutSummaryStats();
    res.json(stats);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to get payout stats' });
  }
};

export const bulkUpdatePayoutStatus = async (req: Request, res: Response) => {
  try {
    const { payoutIds, status } = bulkPayoutActionSchema.parse(req.body);
    const result = await service.bulkUpdatePayoutStatus(payoutIds, status);
    res.json({ message: `${result.count} payouts updated to ${status}`, count: result.count });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to bulk update payout status' });
  }
};

export const getBasePricing = async (_req: Request, res: Response) => {
  try {
    const pricing = await service.getBasePricing();
    res.json(pricing);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to get base pricing' });
  }
};

export const getBasePricingById = async (req: Request, res: Response) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const pricing = await service.getBasePricingById(id);
    if (!pricing) {
      return res.status(404).json({ message: 'Base pricing not found' });
    }
    res.json(pricing);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to get base pricing' });
  }
};

export const createBasePricing = async (req: Request, res: Response) => {
  try {
    const validatedData = basePricingSchema.parse(req.body);
    const pricing = await service.createBasePricing(validatedData);
    res.status(201).json({ message: 'Base pricing created successfully', pricing });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to create base pricing' });
  }
};

export const updateBasePricing = async (req: Request, res: Response) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const pricing = await service.updateBasePricing(id, req.body);
    res.json({ message: 'Base pricing updated successfully', pricing });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to update base pricing' });
  }
};

export const deleteBasePricing = async (req: Request, res: Response) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    await service.deleteBasePricing(id);
    res.json({ message: 'Base pricing deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to delete base pricing' });
  }
};
