import { Worker, type Job } from 'bullmq';
import { redis, QUEUES, type AiReplyJobPayload } from '../queues';
import { db } from '@aaos/db';
import { AIProvider, MessageGenerator } from '@aaos/ai';
import { TelnyxService } from '@aaos/integrations';
import { getServerEnv } from '@aaos/config';

const env = getServerEnv();

export function createAiReplyWorker() {
  return new Worker<AiReplyJobPayload>(
    QUEUES.AI_REPLY,
    async (job: Job<AiReplyJobPayload>) => {
      const { conversationId, leadId, organizationId } = job.data;

      console.log(`[ai-reply-worker] Processing job ${job.id} | conversation=${conversationId}`);

      const conversation = await db.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: { orderBy: { createdAt: 'desc' }, take: 10 },
          lead: true,
          channel_record: true,
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
      const channelRecord = conversation.channel_record;

      if (!lead || !channelRecord) {
        console.warn(`[ai-reply-worker] Missing lead or channel for conversation ${conversationId}`);
        return;
      }

      // Build conversation history for AI
      const history = conversation.messages
        .reverse()
        .map((m) => ({
          role: m.direction === 'INBOUND' ? ('user' as const) : ('assistant' as const),
          content: m.body,
        }));

      // Fetch org name for context
      const org = await db.organization.findUnique({ where: { id: organizationId } });

      const provider = new AIProvider({ openaiApiKey: env.OPENAI_API_KEY });
      const generator = new MessageGenerator({ provider });
      const reply = await generator.suggestReply({
        businessName: org?.name ?? 'Our Business',
        operatorName: 'Operator',
        leadName: `${lead.firstName ?? ''} ${lead.lastName ?? ''}`.trim() || 'there',
        conversationHistory: history.map((h) => `${h.role}: ${h.content}`).join('\n'),
        latestMessage: history[history.length - 1]?.content ?? '',
      });

      if (!reply) {
        console.warn(`[ai-reply-worker] No reply generated for conversation ${conversationId}`);
        return;
      }

      // Send via Telnyx
      const telnyx = new TelnyxService({ apiKey: env.TELNYX_API_KEY });
      await telnyx.sendSms({
        from: channelRecord.identifier,
        to: lead.phone!,
        body: reply.text,
      });

      // Save outbound message
      await db.message.create({
        data: {
          conversationId,
          body: reply.text,
          direction: 'OUTBOUND',
          channel: 'SMS',
          isAiGenerated: true,
          status: 'SENT',
        },
      });

      // Update conversation lastMessageAt
      await db.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      });

      console.log(`[ai-reply-worker] Sent AI reply for conversation ${conversationId}`);
    },
    {
      connection: redis,
      concurrency: 10,
    },
  );
}
