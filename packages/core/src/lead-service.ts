import type { PrismaClient } from '@aaos/db';
import type { LeadCreateInput, LeadStatus, PaginatedResponse } from '@aaos/types';

// ─────────────────────────────────────────────
// LeadService — CRUD, stage transitions, activity
// ─────────────────────────────────────────────

export interface LeadFilter {
  status?: LeadStatus;
  stage?: string;
  assignedUserId?: string;
  source?: string;
  search?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}

export class LeadService {
  constructor(private db: PrismaClient) {}

  async create(params: LeadCreateInput & {
    organizationId: string;
    source?: string;
  }) {
    const lead = await this.db.lead.create({
      data: {
        organizationId: params.organizationId,
        clientAccountId: params.clientAccountId,
        firstName: params.firstName,
        lastName: params.lastName,
        email: params.email,
        phone: params.phone,
        source: (params.source as never) ?? 'OTHER',
        sourceDetail: params.sourceDetail,
        value: params.value,
        customFields: params.customFields ?? {},
      },
    });

    // Write audit log
    await this.db.auditLog.create({
      data: {
        organizationId: params.organizationId,
        entityType: 'Lead',
        entityId: lead.id,
        action: 'CREATE',
        changes: { created: true },
      },
    });

    return lead;
  }

  async getById(leadId: string, organizationId: string) {
    return this.db.lead.findFirst({
      where: { id: leadId, organizationId, deletedAt: null },
      include: {
        notes: { orderBy: { createdAt: 'desc' }, take: 20 },
        tags: true,
        appointments: { orderBy: { startAt: 'desc' }, take: 5 },
        conversations: {
          orderBy: { lastMessageAt: 'desc' },
          take: 5,
          include: { messages: { orderBy: { createdAt: 'desc' }, take: 3 } },
        },
        assignedUser: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
  }

  async list(organizationId: string, clientAccountId: string, filter: LeadFilter = {}) {
    const page = filter.page ?? 1;
    const limit = Math.min(filter.limit ?? 25, 100);
    const skip = (page - 1) * limit;

    const where: Parameters<typeof this.db.lead.findMany>[0]['where'] = {
      organizationId,
      clientAccountId,
      deletedAt: null,
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.stage ? { stage: filter.stage } : {}),
      ...(filter.assignedUserId ? { assignedUserId: filter.assignedUserId } : {}),
      ...(filter.search
        ? {
            OR: [
              { firstName: { contains: filter.search, mode: 'insensitive' } },
              { lastName: { contains: filter.search, mode: 'insensitive' } },
              { email: { contains: filter.search, mode: 'insensitive' } },
              { phone: { contains: filter.search } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.db.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tags: true,
          assignedUser: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.db.lead.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      hasMore: skip + data.length < total,
    } satisfies PaginatedResponse<(typeof data)[0]>;
  }

  async updateStage(leadId: string, organizationId: string, stage: string, actorId?: string) {
    const lead = await this.db.lead.findFirst({
      where: { id: leadId, organizationId, deletedAt: null },
    });
    if (!lead) throw new Error('Lead not found');

    const previousStage = lead.stage;

    const updated = await this.db.lead.update({
      where: { id: leadId },
      data: {
        stage,
        status: stageToStatus(stage),
        qualifiedAt: stage === 'Qualified' && !lead.qualifiedAt ? new Date() : lead.qualifiedAt,
        bookedAt: stage === 'Booked' && !lead.bookedAt ? new Date() : lead.bookedAt,
        wonAt: stage === 'Won' && !lead.wonAt ? new Date() : lead.wonAt,
        lostAt: stage === 'Lost' && !lead.lostAt ? new Date() : lead.lostAt,
      },
    });

    await this.db.auditLog.create({
      data: {
        organizationId,
        entityType: 'Lead',
        entityId: leadId,
        actorId,
        action: 'UPDATE',
        changes: { stage: { from: previousStage, to: stage } },
      },
    });

    return updated;
  }

  async addNote(leadId: string, content: string, authorId?: string) {
    return this.db.leadNote.create({
      data: { leadId, content, authorId },
    });
  }

  async addTag(leadId: string, tag: string) {
    return this.db.leadTag.upsert({
      where: { leadId_tag: { leadId, tag } },
      create: { leadId, tag },
      update: {},
    });
  }

  async removeTag(leadId: string, tag: string) {
    return this.db.leadTag.deleteMany({ where: { leadId, tag } });
  }

  async softDelete(leadId: string, organizationId: string, actorId?: string) {
    const updated = await this.db.lead.updateMany({
      where: { id: leadId, organizationId },
      data: { deletedAt: new Date() },
    });

    if (updated.count > 0) {
      await this.db.auditLog.create({
        data: {
          organizationId,
          entityType: 'Lead',
          entityId: leadId,
          actorId,
          action: 'DELETE',
          changes: {},
        },
      });
    }

    return updated.count > 0;
  }

  async markContacted(leadId: string) {
    return this.db.lead.update({
      where: { id: leadId },
      data: { lastContactAt: new Date() },
    });
  }
}

function stageToStatus(stage: string): 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'BOOKED' | 'WON' | 'LOST' | 'UNSUBSCRIBED' {
  switch (stage.toLowerCase()) {
    case 'contacted': return 'CONTACTED';
    case 'qualified': return 'QUALIFIED';
    case 'booked': return 'BOOKED';
    case 'won': return 'WON';
    case 'lost': return 'LOST';
    default: return 'NEW';
  }
}
