import { Request, Response } from 'express';
import * as disputeService from './disputes-and-complaints.service';
import { disputeFilterSchema, resolveDisputeSchema } from './disputes-and-complaints.dto';
import { z } from 'zod';

export const getDisputesStats = async (req: Request, res: Response) => {
  try {
    const stats = await disputeService.getDisputesStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getDisputes = async (req: Request, res: Response) => {
  try {
    const { page, limit, status, severity, search } = disputeFilterSchema.parse(req.query);
    const result = await disputeService.getDisputes(page, limit, status, severity, search);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getDisputeById = async (req: Request, res: Response) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const dispute = await disputeService.getDisputeById(id);
    res.json(dispute);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const resolveDispute = async (req: Request, res: Response) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const data = resolveDisputeSchema.parse(req.body);
    const result = await disputeService.resolveDispute(id, data);
    res.json({ message: 'Dispute resolved successfully', dispute: result });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};