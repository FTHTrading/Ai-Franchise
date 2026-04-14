import { Worker, type Job } from 'bullmq';
import { redis, QUEUES, type AiReplyJobPayload } from '../queues';
import { prisma } from '@aaos/db';
import { MessageGenerator } from '@aaos/ai';
import { TelnyxService } from '@aaos/integrations';
import { env } from '@aaos/config';
import { MessageDirection } from '@aaos/types';

export function createAiReplyWorker() {
  return new Worker<AiReplyJobPayload>(
    QUEUES.AI_REPLY,
    async (job: Job<AiReplyJobPayload>) => {
      const { conversationId, leadId, organizationId } = job.data;

      console.log(`[ai-reply-worker] Processing job ${job.id} | conversation=${conversationId}`);

      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: { orderBy: { createdAt: 'desc' }, take: 10 },
          lead: true,
          channel: true,
        },
      });

      if (!conversation) {
        console.warn(`[ai-reply-worker] Conversation ${conversationId} not found`);
        return;
      }

      if (!conversation.aiEnabled) {
        console.info(`[ai-reply-worker] AI disabled for conversation ${conversationId}`);
        return;
      }

      const lead = conversation.lead;
      const channel = conversation.channel;

      if (!lead || !channel) {
        console.warn(`[ai-reply-worker] Missing lead or channel for conversation ${conversationId}`);
        return;
      }

      // Build conversation history for AI
      const history = conversation.messages
        .reverse()
        .map((m) => ({
          role: m.direction === 'INBOUND' ? ('user' as const) : ('assistant' as const),
          content: m.content,
        }));

      const generator = new MessageGenerator();
      const reply = await generator.generateReply({
        lead: { firstName: lead.firstName, lastName: lead.lastName, status: lead.status },
        history,
        organizationId,
      });

      if (!reply) {
        console.warn(`[ai-reply-worker] No reply generated for conversation ${conversationId}`);
        return;
      }

      // Send via Telnyx
      const telnyx = new TelnyxService(env.TELNYX_API_KEY);
      await telnyx.sendSms({
        from: channel.phoneNumber,
        to: lead.phone!,
        text: reply,
      });

      // Save outbound message
      await prisma.message.create({
        data: {
          conversationId,
          content: reply,
          direction: MessageDirection.OUTBOUND,
          channel: 'SMS',
          aiGenerated: true,
          read: true,
        },
      });

      // Update conversation lastMessageAt
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      console.log(`[ai-reply-worker] Sent AI reply for conversation ${conversationId}`);
    },
    {
      connection: redis,
      concurrency: 10,
    },
  );
}
