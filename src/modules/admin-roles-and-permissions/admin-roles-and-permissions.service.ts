import prisma from '../../config/prisma';
import bcrypt from 'bcryptjs';
import { AdminRole, ModulePermission, AdminStatus } from '@prisma/client';

// ==================== ADMIN USER SERVICES ====================

export const getAdminUsers = async (filters: {
  page: number;
  limit: number;
  search?: string;
  role?: AdminRole;
  status?: AdminStatus;
}) => {
  const { page, limit, search, role, status } = filters;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.user = {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  if (role) where.role = role;
  if (status) where.status = status;

  const [admins, total] = await Promise.all([
    prisma.adminUser.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profilePicture: true,
            verified: true,
          },
        },
      },
    }),
    prisma.adminUser.count({ where }),
  ]);

  // Get permissions for each admin based on role
  const adminsWithPermissions = await Promise.all(
    admins.map(async (admin) => {
      const permissions = await prisma.rolePermission.findMany({
        where: { role: admin.role },
        select: { module: true, canView: true, canCreate: true, canEdit: true, canDelete: true },
      });
      
      return {
        id: admin.id,
        userId: admin.userId,
        fullName: `${admin.user.firstName} ${admin.user.lastName}`.trim(),
        email: admin.user.email || '',
        phone: admin.user.phone,
        profilePicture: admin.user.profilePicture,
        role: admin.role,
        status: admin.status,
        twoFactorEnabled: admin.twoFactorEnabled,
        lastLoginAt: admin.lastLoginAt,
        lastLoginIp: admin.lastLoginIp,
        lastLoginDevice: admin.lastLoginDevice,
        createdAt: admin.createdAt,
        permissions: permissions.length > 0 ? permissions : getDefaultPermissionsForRole(admin.role),
      };
    })
  );

  return {
    data: adminsWithPermissions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getAdminUserById = async (id: string) => {
  const admin = await prisma.adminUser.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          profilePicture: true,
          verified: true,
        },
      },
    },
  });

  if (!admin) throw new Error("Admin user not found");

  const permissions = await prisma.rolePermission.findMany({
    where: { role: admin.role },
    select: { module: true, canView: true, canCreate: true, canEdit: true, canDelete: true },
  });

  return {
    id: admin.id,
    userId: admin.userId,
    fullName: `${admin.user.firstName} ${admin.user.lastName}`.trim(),
    email: admin.user.email || '',
    phone: admin.user.phone,
    profilePicture: admin.user.profilePicture,
    role: admin.role,
    status: admin.status,
    twoFactorEnabled: admin.twoFactorEnabled,
    lastLoginAt: admin.lastLoginAt,
    lastLoginIp: admin.lastLoginIp,
    lastLoginDevice: admin.lastLoginDevice,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
    permissions: permissions.length > 0 ? permissions : getDefaultPermissionsForRole(admin.role),
  };
};

export const createAdminUser = async (data: {
  fullName: string;
  email: string;
  role: AdminRole;
  status?: AdminStatus;
  enableTwoFactor?: boolean;
  createdBy?: string;
}) => {
  // Generate temporary password
  const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  // Split full name into first and last name
  const nameParts = data.fullName.trim().split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || '';

  // Check if user exists
  let user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    // Create new user with ADMIN role
    user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: data.email,
        password: hashedPassword,
        role: 'ADMIN',
        verified: true,
      },
    });
  } else {
    // Check if user is already an admin
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { userId: user.id },
    });

    if (existingAdmin) {
      throw new Error("Admin user already exists for this user");
    }

    // Update existing user to ADMIN role if not already
    if (user.role !== 'ADMIN') {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { 
          role: 'ADMIN',
          password: user.password || hashedPassword,
        },
      });
    }
  }

  // Create admin user linked to the user
  const admin = await prisma.adminUser.create({
    data: {
      userId: user.id,
      role: data.role,
      status: data.status || 'ACTIVE',
      twoFactorEnabled: data.enableTwoFactor || false,
      createdBy: data.createdBy,
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  // Log activity
  if (data.createdBy) {
    await logAdminActivity({
      adminId: data.createdBy,
      action: 'CREATE',
      module: 'ADMIN_USER',
      targetId: admin.id,
      targetName: admin.user.email || undefined,
      changes: { fullName: data.fullName, role: data.role },
      ipAddress: undefined,
      userAgent: undefined,
    });
  }

  return {
    id: admin.id,
    userId: admin.userId,
    fullName: `${admin.user.firstName} ${admin.user.lastName}`.trim(),
    email: admin.user.email || '',
    role: admin.role,
    status: admin.status,
    twoFactorEnabled: admin.twoFactorEnabled,
    temporaryPassword: tempPassword,
  };
};

export const updateAdminUser = async (
  id: string,
  data: {
    fullName?: string;
    email?: string;
    role?: AdminRole;
    status?: AdminStatus;
    enableTwoFactor?: boolean;
    password?: string;
  }
) => {
  // First get the admin to get userId
  const admin = await prisma.adminUser.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!admin) throw new Error("Admin user not found");

  // Update User table
  const userUpdateData: any = {};
  if (data.fullName) {
    const nameParts = data.fullName.trim().split(' ');
    userUpdateData.firstName = nameParts[0];
    userUpdateData.lastName = nameParts.slice(1).join(' ') || '';
  }
  if (data.email) userUpdateData.email = data.email;
  if (data.password) userUpdateData.password = await bcrypt.hash(data.password, 10);

  if (Object.keys(userUpdateData).length > 0) {
    await prisma.user.update({
      where: { id: admin.userId },
      data: userUpdateData,
    });
  }

  // Update AdminUser table
  const adminUpdateData: any = {};
  if (data.role) adminUpdateData.role = data.role;
  if (data.status) adminUpdateData.status = data.status;
  if (data.enableTwoFactor !== undefined) adminUpdateData.twoFactorEnabled = data.enableTwoFactor;

  const updatedAdmin = await prisma.adminUser.update({
    where: { id },
    data: adminUpdateData,
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return {
    id: updatedAdmin.id,
    userId: updatedAdmin.userId,
    fullName: `${updatedAdmin.user.firstName} ${updatedAdmin.user.lastName}`.trim(),
    email: updatedAdmin.user.email || '',
    role: updatedAdmin.role,
    status: updatedAdmin.status,
    twoFactorEnabled: updatedAdmin.twoFactorEnabled,
    updatedAt: updatedAdmin.updatedAt,
  };
};

export const updateAdminStatus = async (id: string, action: 'ACTIVATE' | 'SUSPEND' | 'DEACTIVATE', reason?: string) => {
  let status: AdminStatus;
  
  switch (action) {
    case 'ACTIVATE':
      status = 'ACTIVE';
      break;
    case 'SUSPEND':
      status = 'SUSPENDED';
      break;
    case 'DEACTIVATE':
      status = 'INACTIVE';
      break;
  }

  const admin = await prisma.adminUser.update({
    where: { id },
    data: { status },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return {
    id: admin.id,
    fullName: `${admin.user.firstName} ${admin.user.lastName}`.trim(),
    email: admin.user.email || '',
    status: admin.status,
  };
};

export const toggleTwoFactorAuth = async (id: string, enabled: boolean) => {
  const admin = await prisma.adminUser.update({
    where: { id },
    data: { twoFactorEnabled: enabled },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return {
    id: admin.id,
    fullName: `${admin.user.firstName} ${admin.user.lastName}`.trim(),
    email: admin.user.email || '',
    twoFactorEnabled: admin.twoFactorEnabled,
  };
};

// ==================== ROLE & PERMISSION SERVICES ====================

export const getAllRoles = async (includePermissions: boolean = true) => {
  const roles = Object.values(AdminRole);
  
  if (!includePermissions) {
    // Get user counts for all roles in parallel
    const rolesWithCounts = await Promise.all(
      roles.map(async (role) => {
        const userCount = await prisma.adminUser.count({ where: { role } });
        return {
          roleName: role,
          description: getRoleDescription(role),
          userCount,
        };
      })
    );
    
    return rolesWithCounts;
  }

  const rolesWithPermissions = await Promise.all(
    roles.map(async (role) => {
      const permissions = await prisma.rolePermission.findMany({
        where: { role },
        select: { module: true, canView: true, canCreate: true, canEdit: true, canDelete: true },
      });
      
      const userCount = await prisma.adminUser.count({ where: { role } });
      
      return {
        roleName: role,
        description: getRoleDescription(role),
        userCount,
        permissions: permissions.length > 0 ? permissions : getDefaultPermissionsForRole(role),
      };
    })
  );

  return rolesWithPermissions;
};

export const getRoleByName = async (roleName: AdminRole) => {
  const permissions = await prisma.rolePermission.findMany({
    where: { role: roleName },
    select: { module: true, canView: true, canCreate: true, canEdit: true, canDelete: true },
  });

  const userCount = await prisma.adminUser.count({ where: { role: roleName } });

  return {
    roleName,
    description: getRoleDescription(roleName),
    userCount,
    permissions: permissions.length > 0 ? permissions : getDefaultPermissionsForRole(roleName),
  };
};

export const updateRolePermissions = async (roleName: AdminRole, permissions: any[]) => {
  // Use transaction to update all permissions
  await prisma.$transaction(
    permissions.map(perm =>
      prisma.rolePermission.upsert({
        where: {
          role_module: {
            role: roleName,
            module: perm.module,
          },
        },
        update: {
          canView: perm.canView,
          canCreate: perm.canCreate,
          canEdit: perm.canEdit,
          canDelete: perm.canDelete,
        },
        create: {
          role: roleName,
          module: perm.module,
          canView: perm.canView,
          canCreate: perm.canCreate,
          canEdit: perm.canEdit,
          canDelete: perm.canDelete,
        },
      })
    )
  );

  return getRoleByName(roleName);
};

// Helper function to get role description
const getRoleDescription = (role: AdminRole): string => {
  const descriptions: Record<AdminRole, string> = {
    SUPER_ADMIN: "Full system access with all permissions",
    FINANCE_ADMIN: "Manages payments, commissions, and financial reports",
    SUPPORT_ADMIN: "Handles customer support and safety issues",
    OPERATIONS_ADMIN: "Manages vehicles, drivers, and operational tasks",
    ANALYTICS_ADMIN: "View-only access to reports and analytics",
  };
  return descriptions[role];
};

// Helper function to get default permissions for a role
const getDefaultPermissionsForRole = (role: AdminRole): any[] => {
  const allModules = Object.values(ModulePermission);
  
  const defaultPermissions: Record<AdminRole, Record<ModulePermission, any>> = {
    SUPER_ADMIN: allModules.reduce((acc, module) => ({
      ...acc,
      [module]: { module, canView: true, canCreate: true, canEdit: true, canDelete: true }
    }), {} as any),
    
    FINANCE_ADMIN: {
      DASHBOARD: { module: "DASHBOARD", canView: true, canCreate: false, canEdit: false, canDelete: false },
      FINANCIALS: { module: "FINANCIALS", canView: true, canCreate: false, canEdit: true, canDelete: false },
      PROMOTIONS: { module: "PROMOTIONS", canView: true, canCreate: true, canEdit: true, canDelete: false },
    } as any,
    
    SUPPORT_ADMIN: {
      USER_MANAGEMENT: { module: "USER_MANAGEMENT", canView: true, canCreate: false, canEdit: true, canDelete: false },
      TRIP_MANAGEMENT: { module: "TRIP_MANAGEMENT", canView: true, canCreate: false, canEdit: true, canDelete: false },
      EMERGENCY_SAFETY: { module: "EMERGENCY_SAFETY", canView: true, canCreate: true, canEdit: true, canDelete: false },
    } as any,
    
    OPERATIONS_ADMIN: {
      CAR_RENTAL_MANAGEMENT: { module: "CAR_RENTAL_MANAGEMENT", canView: true, canCreate: true, canEdit: true, canDelete: false },
      VEHICLE_PRICING: { module: "VEHICLE_PRICING", canView: true, canCreate: true, canEdit: true, canDelete: false },
      USER_MANAGEMENT: { module: "USER_MANAGEMENT", canView: true, canCreate: false, canEdit: true, canDelete: false },
    } as any,
    
    ANALYTICS_ADMIN: {
      DASHBOARD: { module: "DASHBOARD", canView: true, canCreate: false, canEdit: false, canDelete: false },
    } as any,
  };
  
  const rolePermissions = defaultPermissions[role];
  return allModules.map(module => rolePermissions[module] || { module, canView: false, canCreate: false, canEdit: false, canDelete: false });
};

// ==================== ACTIVITY LOG SERVICES ====================

export const getActivityLogs = async (filters: {
  page: number;
  limit: number;
  adminId?: string;
  module?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const { page, limit, adminId, module, action, startDate, endDate } = filters;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (adminId) where.adminId = adminId;
  if (module) where.module = module;
  if (action) where.action = action;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [logs, total] = await Promise.all([
    prisma.adminActivityLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        admin: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    }),
    prisma.adminActivityLog.count({ where }),
  ]);

  // Format logs with admin names
  const formattedLogs = logs.map(log => ({
    ...log,
    admin: {
      fullName: `${log.admin.user.firstName} ${log.admin.user.lastName}`.trim(),
      email: log.admin.user.email || '',
    },
  }));

  return {
    data: formattedLogs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const logAdminActivity = async (data: {
  adminId?: string;  
  action: string;
  module: string;
  targetId?: string;
  targetName?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
}) => {
  if (!data.adminId) {
    console.log('Skipping activity log - no adminId provided');
    return null;
  }

  return prisma.adminActivityLog.create({
    data: {
      adminId: data.adminId,
      action: data.action,
      module: data.module,
      targetId: data.targetId,
      targetName: data.targetName,
      changes: data.changes,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    },
  });
};

// ==================== STATS SERVICES ====================

export const getAdminStats = async () => {
  const [totalAdmins, activeAdmins, byRole, recentLogins] = await Promise.all([
    prisma.adminUser.count(),
    prisma.adminUser.count({ where: { status: 'ACTIVE' } }),
    prisma.adminUser.groupBy({
      by: ['role'],
      _count: true,
    }),
    prisma.adminUser.findMany({
      where: {
        lastLoginAt: {
          not: null,
        },
      },
      orderBy: { lastLoginAt: 'desc' },
      take: 5,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }),
  ]);

  const roleStats = byRole.reduce((acc, curr) => {
    acc[curr.role] = curr._count;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalAdmins,
    activeAdmins,
    byRole: roleStats,
    recentLogins: recentLogins.map(admin => ({
      fullName: `${admin.user.firstName} ${admin.user.lastName}`.trim(),
      email: admin.user.email || '',
      role: admin.role,
      lastLoginAt: admin.lastLoginAt,
      lastLoginIp: admin.lastLoginIp,
      lastLoginDevice: admin.lastLoginDevice,
    })),
  };
};

// ==================== SESSION SERVICES ====================

export const updateAdminLogin = async (id: string, ipAddress: string, userAgent: string) => {
  return prisma.adminUser.update({
    where: { id },
    data: {
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
      lastLoginDevice: userAgent,
    },
  });
};

// ==================== MIGRATION HELPER ====================
export const migrateExistingAdminUsers = async () => {
  // Get all users with ADMIN role that don't have an AdminUser record
  const usersWithAdminRole = await prisma.user.findMany({
    where: {
      role: 'ADMIN',
      adminUser: null,
    },
  });

  console.log(`Found ${usersWithAdminRole.length} users with ADMIN role to migrate`);

  const results = [];
  for (const user of usersWithAdminRole) {
    try {
      const adminUser = await prisma.adminUser.create({
        data: {
          userId: user.id,
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
          twoFactorEnabled: false,
        },
        include: {
          user: true,
        },
      });
      results.push({ email: user.email, success: true, adminId: adminUser.id });
      console.log(`Migrated: ${user.email}`);
    } catch (error) {
      console.error(`Failed to migrate ${user.email}:`, error);
      results.push({ email: user.email, success: false, error });
    }
  }

  return {
    total: usersWithAdminRole.length,
    migrated: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results,
  };
};