import { SupportSession, SupportSessionDocument } from './support.model.js';
import { auditService } from '../audit/audit.service.js';

export class SupportService {
  /**
   * Verifies if an active, non-expired support session exists for this user and school
   */
  async hasActiveSupportAccess(userId: string, schoolId: string): Promise<boolean> {
    const session = await SupportSession.findOne({
      schoolId,
      requestedBy: userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });
    return !!session;
  }

  async createSupportSession(params: {
    schoolId: string;
    schoolName?: string;
    requestedBy: string;
    authorizedBy: string;
    actorEmail: string;
    actorRole: string;
    reason: string;
    ticketReference: string;
    durationHours?: number;
    ipAddress?: string;
  }): Promise<SupportSessionDocument> {
    const durationHours = params.durationHours || 24;
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

    const session = new SupportSession({
      schoolId: params.schoolId,
      requestedBy: params.requestedBy,
      authorizedBy: params.authorizedBy,
      reason: params.reason,
      ticketReference: params.ticketReference,
      expiresAt,
      isActive: true,
    });

    await session.save();

    await auditService.record({
      actorId: params.requestedBy,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: 'support.session_granted',
      targetSchoolId: params.schoolId,
      targetSchoolName: params.schoolName,
      details: {
        ticketReference: params.ticketReference,
        reason: params.reason,
        expiresAt,
        durationHours,
      },
      ipAddress: params.ipAddress,
    });

    return session;
  }

  async revokeSupportSession(
    sessionId: string,
    actorId: string,
    actorEmail: string,
    actorRole: string
  ): Promise<SupportSessionDocument | null> {
    const session = await SupportSession.findById(sessionId);
    if (!session) return null;

    session.isActive = false;
    await session.save();

    await auditService.record({
      actorId,
      actorEmail,
      actorRole,
      action: 'support.session_revoked',
      targetSchoolId: session.schoolId,
      details: { sessionId: session.id, ticketReference: session.ticketReference },
    });

    return session;
  }

  async listSessions(schoolId?: string): Promise<SupportSessionDocument[]> {
    const query: Record<string, unknown> = {};
    if (schoolId) query.schoolId = schoolId;
    return SupportSession.find(query).sort({ createdAt: -1 });
  }
}

export const supportService = new SupportService();
