import { Request, Response } from 'express';
import * as vehicleService from './driver-vehicle.service';
import { DriverRequest } from '../../middleware/driver';
import { updateVehicleSchema } from './driver-vehicle.dto';

export const getVehicle = async (req: DriverRequest, res: Response) => {
  try {
    const vehicle = await vehicleService.getVehicle(req.driver!.driverId);
    res.json(vehicle);
  } catch (error: any) {
    res.status(404).json({ message: error.message || 'Vehicle not found' });
  }
};

export const updateVehicle = async (req: DriverRequest, res: Response) => {
  try {
    const data = updateVehicleSchema.parse(req.body);
    const result = await vehicleService.updateVehicle(req.driver!.driverId, data);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Validation failed' });
  }
};

export const uploadVehiclePhotos = async (req: DriverRequest, res: Response) => {
  try {
    // Multer with .fields() puts files under the field name
    const uploadedFiles = (req.files as any)?.photos as Express.Multer.File[] | undefined;

    if (!uploadedFiles || !Array.isArray(uploadedFiles) || uploadedFiles.length === 0) {
      return res.status(400).json({ 
        message: 'No photos uploaded. Please use field name "photos" when uploading files.' 
      });
    }

    const photoUrls = uploadedFiles.map((file: any) => file.location || file.key || file.path);

    const result = await vehicleService.uploadVehiclePhotos(req.driver!.driverId, photoUrls);
    
    res.json(result);
  } catch (error: any) {
    console.error('Upload vehicle photos error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to upload vehicle photos' 
    });
  }
};