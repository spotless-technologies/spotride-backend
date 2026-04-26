import { Request, Response } from 'express';
import { DriverRequest } from '../../middleware/driver';
import { z } from 'zod';
import * as service from './driver-earnings-and-performance.service';
import { withdrawRequestSchema } from './driver-earnings-and-performance.dto';

export const getTodayPerformance = async (req: DriverRequest, res: Response) => {
  try {
    if (!req.driver || !req.driver.driverId) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    const result = await service.getTodayPerformanceService(req.driver.driverId);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error getting today performance:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch today\'s performance' 
    });
  }
};

export const getPerformanceSummary = async (req: DriverRequest, res: Response) => {
  try {
    if (!req.driver || !req.driver.driverId) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    const result = await service.getPerformanceSummaryService(req.driver.driverId);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error getting performance summary:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch performance summary' 
    });
  }
};

export const getEarningsHistory = async (req: DriverRequest, res: Response) => {
  try {
    if (!req.driver || !req.driver.driverId) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    const result = await service.getEarningsHistoryService(req.driver.driverId);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error getting earnings history:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch earnings history' 
    });
  }
};

export const getEarningsBreakdown = async (req: DriverRequest, res: Response) => {
  try {
    if (!req.driver || !req.driver.driverId) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    const result = await service.getEarningsBreakdownService(req.driver.driverId);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error getting earnings breakdown:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch earnings breakdown' 
    });
  }
};

export const getWallet = async (req: DriverRequest, res: Response) => {
  try {
    if (!req.driver || !req.driver.driverId) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    const result = await service.getWalletService(req.driver.driverId);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error getting wallet:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch wallet information' 
    });
  }
};

export const requestWithdraw = async (req: DriverRequest, res: Response) => {
  try {
    if (!req.driver || !req.driver.driverId) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    const { amount } = withdrawRequestSchema.parse(req.body);
    const result = await service.requestWithdrawService(req.driver.driverId, amount);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed', 
        errors: error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
    }
    
    if (error.message === 'Insufficient balance') {
      return res.status(400).json({ 
        success: false,
        message: error.message 
      });
    }
    
    if (error.message === 'Driver not found') {
      return res.status(404).json({ 
        success: false,
        message: error.message 
      });
    }
    
    console.error('Error requesting withdrawal:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to process withdrawal request' 
    });
  }
};