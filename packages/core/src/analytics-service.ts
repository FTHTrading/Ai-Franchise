import type { PrismaClient } from '@aaos/db';
import type { AgencyMetrics, ClientMetrics } from '@aaos/types';

// ─────────────────────────────────────────────
// AnalyticsService — metrics for agency and client dashboards
// ─────────────────────────────────────────────

export class AnalyticsService {
  constructor(private db: PrismaClient) {}

  async getAgencyMetrics(organizationId: string): Promise<AgencyMetrics> {
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      activeClients,
      totalLeads,
      newLeadsThisPeriod,
      bookedAppointments,
      messageVolume,
      workflowExecutions,
      failedExecutions,
      subscription,
    ] = await Promise.all([
      this.db.clientAccount.count({ where: { organizationId, isActive: true, deletedAt: null } }),
      this.db.lead.count({ where: { organizationId, deletedAt: null } }),
      this.db.lead.count({ where: { organizationId, createdAt: { gte: since30d }, deletedAt: null } }),
      this.db.appointment.count({
        where: { organizationId, status: { in: ['SCHEDULED', 'CONFIRMED', 'COMPLETED'] }, createdAt: { gte: since30d } },
      }),
      this.db.message.count({
        where: { conversation: { organizationId }, createdAt: { gte: since30d } },
      }),
      this.db.workflowExecution.count({
        where: { organizationId, createdAt: { gte: since30d } },
      }),
      this.db.workflowExecution.count({
        where: { organizationId, status: 'FAILED', createdAt: { gte: since30d } },
      }),
      this.db.subscription.findUnique({ where: { organizationId } }),
    ]);

    // MRR from subscription
    const mrr = subscription?.mrr ?? 0;

    // Conversion rate: Won leads / total leads (last 30d)
    const wonLeads = await this.db.lead.count({
      where: { organizationId, status: 'WON', wonAt: { gte: since30d } },
    });
    const conversionRate = newLeadsThisPeriod > 0 ? wonLeads / newLeadsThisPeriod : 0;

    return {
      mrr,
      activeClients,
      totalLeads,
      newLeadsThisPeriod,
      conversionRate: Math.round(conversionRate * 100) / 100,
      bookedAppointments,
      messageVolume,
      workflowExecutions,
      failedExecutions,
    };
  }

  async getClientMetrics(organizationId: string, clientAccountId: string): Promise<ClientMetrics> {
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      newLeads,
      bookedAppointments,
      activeConversations,
      leadsByStageRaw,
      recentLeads,
    ] = await Promise.all([
      this.db.lead.count({ where: { clientAccountId, createdAt: { gte: since30d }, deletedAt: null } }),
      this.db.appointment.count({
        where: {
          clientAccountId,
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
          startAt: { gte: new Date() },
        },
      }),
      this.db.conversation.count({ where: { clientAccountId, isOpen: true } }),
      this.db.lead.groupBy({
        by: ['stage'],
        where: { clientAccountId, deletedAt: null },
        _count: { stage: true },
      }),
      this.db.lead.findMany({
        where: { clientAccountId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, firstName: true, lastName: true, status: true, stage: true, createdAt: true },
      }),
    ]);

    const leadsByStage: Record<string, number> = {};
    for (const group of leadsByStageRaw) {
      leadsByStage[group.stage] = group._count.stage;
    }

    const recentActivity = recentLeads.map((lead) => ({
      id: lead.id,
      type: 'lead_created',
      description: `${lead.firstName} ${lead.lastName ?? ''} — ${lead.stage}`.trim(),
      entityId: lead.id,
      entityType: 'Lead',
      timestamp: lead.createdAt,
    }));

    return {
      newLeads,
      bookedAppointments,
      activeConversations,
      avgResponseTime: 0,  // calculated from message timestamps — extend if needed
      leadsByStage,
      recentActivity,
    };
  }
}
