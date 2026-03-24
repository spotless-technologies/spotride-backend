import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getHeatmap = async (req: Request, res: Response) => {
  try {
    // TODO: query from a materialized view or cache
    const points = [
      { lat: 6.5244, lng: 3.3792, intensity: 85 }, // Ikeja
      { lat: 6.6018, lng: 3.3515, intensity: 92 }, // Lekki
      { lat: 6.4654, lng: 3.4064, intensity: 78 }, // Victoria Island
      { lat: 6.4540, lng: 3.3941, intensity: 65 }, // Lagos Island
      { lat: 6.5965, lng: 3.3464, intensity: 55 }, // Surulere
    ];

    res.json(points);
  } catch (error) {
    console.error('Heatmap error:', error);
    res.status(500).json({ message: 'Failed to load heatmap data' });
  }
};

export const getHeatmapByTime = async (req: Request, res: Response) => {
  const { time = 'all' } = req.query;

  try {
    // TODO: different data sets or queries based on time
    let points = [
      { lat: 6.5244, lng: 3.3792, intensity: 85 },
      { lat: 6.6018, lng: 3.3515, intensity: 92 },
    ];

    if (time === 'peak') {
      points = points.map(p => ({ ...p, intensity: p.intensity * 1.5 }));
    } else if (time === 'morning') {
      points = points.map(p => ({ ...p, intensity: p.intensity * 0.8 }));
    }

    res.json({ time, points });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load filtered heatmap' });
  }
};

export const getSurgeZones = async (req: Request, res: Response) => {
  try {
    // TODO: fetch from dynamic pricing service / cache
    const zones = [
      {
        zoneName: 'Ikeja',
        multiplier: 1.8,
        boundaries: [[6.53, 3.34], [6.52, 3.38]],
      },
      {
        zoneName: 'Lekki Phase 1',
        multiplier: 2.3,
        boundaries: [[6.60, 3.35], [6.58, 3.39]],
      },
      {
        zoneName: 'Victoria Island',
        multiplier: 2.0,
        boundaries: [[6.46, 3.40], [6.43, 3.42]],
      },
    ];

    res.json(zones);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load surge zones' });
  }
};