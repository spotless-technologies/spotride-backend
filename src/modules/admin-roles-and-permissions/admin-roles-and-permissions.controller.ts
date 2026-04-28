import { Request, Response } from 'express';
import * as service from './admin-roles-and-permissions.service';
import * as dto from './admin-roles-and-permissions.dto';
import { z } from 'zod';
import prisma from '../../config/prisma';

// ==================== ADMIN USER CONTROLLERS ====================

export const getAdminUsers = async (req: Request, res: Response) => {
  try {
    const query = dto.adminUserQuerySchema.parse(req.query);
    const result = await service.getAdminUsers(query);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getAdminUserById = async (req: Request, res: Response) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const admin = await service.getAdminUserById(id);
    res.json(admin);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const createAdminUser = async (req: Request, res: Response) => {
  try {
    const data = dto.createAdminUserSchema.parse(req.body);
    
    // Get the current admin's AdminUser record
    const currentAdminUser = await prisma.adminUser.findFirst({
      where: { userId: (req as any).user?.userId }
    });
    
    const admin = await service.createAdminUser({
      ...data,
      createdBy: currentAdminUser?.id,
    });
    res.status(201).json({ 
      message: 'Admin user created successfully',
      data: admin,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateAdminUser = async (req: Request, res: Response) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const data = dto.updateAdminUserSchema.parse(req.body);
    const admin = await service.updateAdminUser(id, data);
    
    // Get the current admin's AdminUser record
    const currentAdminUser = await prisma.adminUser.findFirst({
      where: { userId: (req as any).user?.userId }
    });
    
    // Only log if we have a valid admin ID
    if (currentAdminUser?.id) {
      await service.logAdminActivity({
        adminId: currentAdminUser.id,
        action: 'EDIT',
        module: 'ADMIN_USER',
        targetId: admin.id,
        targetName: admin.email,
        changes: data,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }
    
    res.json({ message: 'Admin user updated successfully', data: admin });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateAdminStatus = async (req: Request, res: Response) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const { action, reason } = dto.adminUserActionSchema.parse(req.body);
    const admin = await service.updateAdminStatus(id, action, reason);
    
    // Get the current admin's AdminUser record
    const currentAdminUser = await prisma.adminUser.findFirst({
      where: { userId: (req as any).user?.userId }
    });
    
    // Only log if we have a valid admin ID
    if (currentAdminUser?.id) {
      await service.logAdminActivity({
        adminId: currentAdminUser.id,
        action: action,
        module: 'ADMIN_USER',
        targetId: admin.id,
        targetName: admin.email,
        changes: { status: admin.status, reason },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }
    
    res.json({ message: `Admin user ${action.toLowerCase()}d successfully`, data: admin });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const toggleTwoFactorAuth = async (req: Request, res: Response) => {
  try {
    const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
    const { enabled } = dto.toggleTwoFactorSchema.parse(req.body);
    const admin = await service.toggleTwoFactorAuth(id, enabled);
    res.json({ message: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'} successfully`, data: admin });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ==================== ROLE & PERMISSION CONTROLLERS ====================

export const getAllRoles = async (req: Request, res: Response) => {
  try {
    const { includePermissions } = dto.roleQuerySchema.parse(req.query);
    const roles = await service.getAllRoles(includePermissions);
    res.json(roles);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getRoleByName = async (req: Request, res: Response) => {
  try {
    const { roleName } = z.object({ roleName: z.string() }).parse(req.params);
    const role = await service.getRoleByName(roleName as any);
    res.json(role);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const updateRolePermissions = async (req: Request, res: Response) => {
  try {
    const { roleName } = z.object({ roleName: z.string() }).parse(req.params);
    const { permissions } = dto.updateRolePermissionsSchema.parse(req.body);
    const role = await service.updateRolePermissions(roleName as any, permissions);
    
    // Get the current admin's AdminUser record
    const currentAdminUser = await prisma.adminUser.findFirst({
      where: { userId: (req as any).user?.userId }
    });
    
    // Only log if we have a valid admin ID
    if (currentAdminUser?.id) {
      await service.logAdminActivity({
        adminId: currentAdminUser.id,
        action: 'EDIT',
        module: 'ROLE',
        targetId: roleName,
        targetName: roleName,
        changes: { permissions },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }
    
    res.json({ message: 'Role permissions updated successfully', data: role });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ==================== ACTIVITY LOG CONTROLLERS ====================

export const getActivityLogs = async (req: Request, res: Response) => {
  try {
    const query = dto.activityLogQuerySchema.parse(req.query);
    const logs = await service.getActivityLogs(query);
    res.json(logs);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// ==================== STATS CONTROLLERS ====================

export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const stats = await service.getAdminStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};