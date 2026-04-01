import { Request, Response } from 'express';
import { z } from 'zod';   // ← Added missing import
import * as pricingService from './car-rental-pricing-and-categories-service';
import {
  createCategorySchema,
  updateCategorySchema,
} from './dto';

export const getPricingStats = async (req: Request, res: Response) => {
  try {
    const stats = await pricingService.getPricingStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to load pricing stats' });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await pricingService.getCategories(page, limit, status, search);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to load categories' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const data = createCategorySchema.parse(req.body);
    const category = await pricingService.createCategory(data);
    res.status(201).json({ message: 'Category created successfully', category });
  } catch (error: any) {
    res.status(400).json({ 
      message: error.message || 'Failed to create category',
      errors: error.errors 
    });
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const category = await pricingService.getCategoryById(id);
    res.json(category);
  } catch (error: any) {
    res.status(404).json({ message: error.message || 'Category not found' });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const data = updateCategorySchema.parse(req.body);
    const updated = await pricingService.updateCategory(id, data);
    res.json({ message: 'Category updated successfully', category: updated });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to update category' });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    await pricingService.deleteCategory(id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to delete category' });
  }
};