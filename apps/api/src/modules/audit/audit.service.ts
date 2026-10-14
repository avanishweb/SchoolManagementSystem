import { AuditLog, AuditLogDocument } from './audit.model.js';
import { logger } from '../../utils/logger.js';

export interface RecordAuditParams {
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetSchoolId?: string;
  targetSchoolName?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  async record(params: RecordAuditParams): Promise<AuditLogDocument> {
    try {
      const log = new AuditLog(params);
      await log.save();
      logger.info(`[AUDIT] ${params.action} by ${params.actorEmail} on target: ${params.targetSchoolId || 'global'}`);
      return log;
    } catch (err) {
      logger.error('Failed to write audit log entry:', err);
      // Suppress audit write errors so business flow is not aborted, but log is emitted
      return new AuditLog(params);
    }
  }

  async listLogs(params: {
    schoolId?: string;
    limit?: number;
    page?: number;
  }): Promise<{ items: AuditLogDocument[]; total: number }> {
    const query: Record<string, unknown> = {};
    if (params.schoolId) {
      query.targetSchoolId = params.schoolId;
    }

    const page = params.page || 1;
    const limit = Math.min(params.limit || 50, 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      AuditLog.countDocuments(query),
    ]);

    return { items, total };
  }
}

export const auditService = new AuditService();
