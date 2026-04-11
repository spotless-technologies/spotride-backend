import { Request, Response } from 'express';
import * as documentService from './driver-documents.service';
import { DriverRequest } from '../../middleware/driver';

export const uploadDocuments = async (req: DriverRequest, res: Response) => {
  try {
    const files = req.files as { [key: string]: Express.Multer.File[] } | undefined;

    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const result = await documentService.uploadDocuments(req.driver!.driverId, files);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to upload documents' });
  }
};

export const getDocuments = async (req: DriverRequest, res: Response) => {
  try {
    const documents = await documentService.getDocuments(req.driver!.driverId);
    res.json(documents);
  } catch (error: any) {
    res.status(404).json({ message: error.message || 'Documents not found' });
  }
};