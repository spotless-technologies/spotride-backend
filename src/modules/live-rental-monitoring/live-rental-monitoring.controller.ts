import { Request, Response } from 'express';
import * as liveService from './live-rental-monitoring.service';
import { liveRentalFilterSchema } from './live-rental-monitoring.dto';

export const getLiveRentalStats = async (req: Request, res: Response) => {
  try {
    const stats = await liveService.getLiveRentalStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getActiveRentals = async (req: Request, res: Response) => {
  try {
    const { page, limit, status, search } = liveRentalFilterSchema.parse(req.query);
    const result = await liveService.getActiveRentals(page, limit, status, search);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getLiveMapData = async (req: Request, res: Response) => {
  try {
    const mapData = await liveService.getLiveMapData();
    res.json(mapData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};