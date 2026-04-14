import type { PrismaClient } from '@aaos/db';
import type { MessageChannel, MessageDirection } from '@aaos/types';

// ─────────────────────────────────────────────
// ConversationService — unified inbox + message management
// ─────────────────────────────────────────────

export class ConversationService {
  constructor(private db: PrismaClient) {}

  async getOrCreateConversation(params: {
    organizationId: string;
    clientAccountId: string;
    leadId?: string;
    channel: MessageChannel;
    channelId?: string;
  }) {
    // Find open conversation for this lead/channel
    const existing = await this.db.conversation.findFirst({
      where: {
        organizationId: params.organizationId,
        clientAccountId: params.clientAccountId,
        leadId: params.leadId,
        channel: params.channel,
        isOpen: true,
      },
    });

    if (existing) return existing;

    return this.db.conversation.create({
      data: {
        organizationId: params.organizationId,
        clientAccountId: params.clientAccountId,
        leadId: params.leadId,
        channel: params.channel,
        channelId: params.channelId,
        direction: 'INBOUND',
        isOpen: true,
        isRead: false,
        aiEnabled: true,
      },
    });
  }

  async addMessage(params: {
    conversationId: string;
    direction: MessageDirection;
    channel: MessageChannel;
    body: string;
    subject?: string;
    senderId?: string;
    isAiGenerated?: boolean;
    externalId?: string;
    channelId?: string;
    mediaUrls?: string[];
  }) {
    const message = await this.db.message.create({
      data: {
        conversationId: params.conversationId,
        direction: params.direction,
        channel: params.channel,
        body: params.body,
        subject: params.subject,
        senderId: params.senderId,
        isAiGenerated: params.isAiGenerated ?? false,
        externalId: params.externalId,
        channelId: params.channelId,
        mediaUrls: params.mediaUrls ?? [],
        status: 'PENDING',
      },
    });

    // Update conversation last message time
    await this.db.conversation.update({
      where: { id: params.conversationId },
      data: {
        lastMessageAt: new Date(),
        isRead: params.direction === 'OUTBOUND',
      },
    });

    return message;
  }

  async getConversationWithMessages(conversationId: string, organizationId: string) {
    return this.db.conversation.findFirst({
      where: { id: conversationId, organizationId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        lead: {
          include: { tags: true },
        },
      },
    });
  }

  async listOpenConversations(organizationId: string, clientAccountId: string, limit = 50) {
    return this.db.conversation.findMany({
      where: {
        organizationId,
        clientAccountId,
        isOpen: true,
      },
      orderBy: { lastMessageAt: 'desc' },
      take: limit,
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        lead: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    });
  }

  async markRead(conversationId: string) {
    return this.db.conversation.update({
      where: { id: conversationId },
      data: { isRead: true },
    });
  }

  async markDelivered(externalId: string) {
    return this.db.message.updateMany({
      where: { externalId },
      data: { status: 'DELIVERED', deliveredAt: new Date() },
    });
  }

  async markFailed(externalId: string, reason: string) {
    return this.db.message.updateMany({
      where: { externalId },
      data: { status: 'FAILED', failureReason: reason },
    });
  }

  async disableAI(conversationId: string) {
    return this.db.conversation.update({
      where: { id: conversationId },
      data: { aiEnabled: false },
    });
  }

  async resolveConversation(conversationId: string, resolvedBy?: string) {
    return this.db.conversation.update({
      where: { id: conversationId },
      data: { isOpen: false, resolvedAt: new Date(), resolvedBy },
    });
  }
}
