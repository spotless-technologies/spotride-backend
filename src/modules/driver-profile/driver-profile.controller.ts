import { Request, Response } from 'express';
import * as driverProfileService from './driver-profile.service';
import { DriverRequest } from '../../middleware/driver';
import { updateProfileSchema } from './dto';
import { z } from 'zod';

export const getProfile = async (req: DriverRequest, res: Response) => {
  try {
    if (!req.driver || !req.driver.driverId || !req.driver.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const profile = await driverProfileService.getDriverProfile(
      req.driver.driverId, 
      req.driver.userId
    );
    res.status(200).json(profile);
  } catch (error: any) {
    if (error.message === 'Driver profile not found') {
      return res.status(404).json({ message: error.message });
    }
    console.error('Error getting driver profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProfile = async (req: DriverRequest, res: Response) => {
  try {
    if (!req.driver || !req.driver.driverId || !req.driver.userId) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    const data = updateProfileSchema.parse(req.body);

    const result = await driverProfileService.updateDriverProfile(
      req.driver.driverId, 
      req.driver.userId, 
      data
    );
    
    res.status(200).json(result);
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
    
    if (error.message === 'Driver profile not found') {
      return res.status(404).json({ 
        success: false,
        message: error.message 
      });
    }
    
    if (error.message && error.message.includes('already been registered')) {
      return res.status(409).json({ 
        success: false,
        message: error.message 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: error.message || 'Internal server error' 
    });
  }
};

export const uploadProfilePhoto = async (req: DriverRequest, res: Response) => {
  try {
    if (!req.driver || !req.driver.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No photo uploaded' });
    }

    const photoUrl = (req.file as any).location;
    if (!photoUrl) {
      return res.status(500).json({ message: 'Failed to upload photo to storage' });
    }

    const result = await driverProfileService.uploadProfilePhoto(
      req.driver.userId, 
      photoUrl
    );
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'Driver profile not found') {
      return res.status(404).json({ message: error.message });
    }
    console.error('Error uploading profile photo:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getRatingSummary = async (req: DriverRequest, res: Response) => {
  try {
    if (!req.driver || !req.driver.driverId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const result = await driverProfileService.getRatingSummary(req.driver.driverId);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === 'Driver not found') {
      return res.status(404).json({ message: error.message });
    }
    console.error('Error getting rating summary:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};