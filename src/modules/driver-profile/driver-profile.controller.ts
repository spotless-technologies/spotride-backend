import { Request, Response } from 'express';
import * as driverProfileService from './driver-profile.service';
import { DriverRequest } from '../../middleware/driver';
import { updateProfileSchema } from '../../schemas/driver.schema';
import { z } from 'zod';

export const getProfile = async (req: DriverRequest, res: Response) => {
  try {
    const profile = await driverProfileService.getDriverProfile(req.driver!.driverId, req.driver!.userId);
    res.json(profile);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const updateProfile = async (req: DriverRequest, res: Response) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const result = await driverProfileService.updateDriverProfile(
      req.driver!.driverId, 
      req.driver!.userId, 
      data
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const uploadProfilePhoto = async (req: DriverRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ message: 'No photo uploaded' });

  const photoUrl = (req.file as any).location;
  const result = await driverProfileService.uploadProfilePhoto(req.driver!.userId, photoUrl);

  res.json(result);
};

export const getRatingSummary = async (req: DriverRequest, res: Response) => {
  const result = await driverProfileService.getRatingSummary(req.driver!.driverId);
  res.json(result);
};

// export const uploadDocuments = async (req: DriverRequest, res: Response) => {
//   const files = req.files as { [key: string]: Express.Multer.File[] } | undefined;
//   if (!files) return res.status(400).json({ message: 'No files uploaded' });

//   const result = await driverProfileService.uploadDocuments(req.driver!.driverId, files);
//   res.json(result);
// };

// export const getDocuments = async (req: DriverRequest, res: Response) => {
//   const documents = await driverProfileService.getDocuments(req.driver!.driverId);
//   res.json(documents);
// };