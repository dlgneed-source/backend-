import { prisma } from './prisma';
import { logger } from './logger';

interface AuditLogData {
  action: string;
  entityType: string;
  entityId: string;
  userId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}

export const createAuditLog = async (data: AuditLogData): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        ...data,
        oldValue: data.oldValue ? JSON.stringify(data.oldValue) : null,
        newValue: data.newValue ? JSON.stringify(data.newValue) : null,
      },
    });
  } catch (error) {
    logger.error('Failed to create audit log', { error, data });
  }
};

export const getAuditLogs = async (
  entityType: string,
  entityId: string,
  limit: number = 50
) => {
  return prisma.auditLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
};
