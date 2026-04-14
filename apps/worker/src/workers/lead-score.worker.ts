import { Worker, type Job } from 'bullmq';
import { redis, QUEUES, type LeadScoreJobPayload } from '../queues';
import { db } from '@aaos/db';

export function createLeadScoreWorker() {
  return new Worker<LeadScoreJobPayload>(
    QUEUES.LEAD_SCORE,
    async (job: Job<LeadScoreJobPayload>) => {
      const { leadId, organizationId } = job.data;

      console.log(`[lead-score-worker] Scoring lead ${leadId}`);

      const lead = await db.lead.findUnique({
        where: { id: leadId },
        include: {
          conversations: {
            include: { messages: { orderBy: { createdAt: 'desc' }, take: 5 } },
          },
          notes: true,
          tags: true,
        },
      });

      if (!lead) {
        console.warn(`[lead-score-worker] Lead ${leadId} not found`);
        return;
      }

      const messageCount = lead.conversations.reduce(
        (acc, c) => acc + c.messages.length,
        0,
      );
      const hasPhone = !!lead.phone;
      const hasEmail = !!lead.email;
      const noteCount = lead.notes.length;
      const tagCount = lead.tags.length;

      // Simple rule-based scoring (0–100)
      let score = 0;
      if (hasPhone) score += 20;
      if (hasEmail) score += 10;
      score += Math.min(messageCount * 5, 30);
      score += Math.min(noteCount * 3, 15);
      score += Math.min(tagCount * 2, 10);
      if (lead.status === 'QUALIFIED') score += 10;
      if (lead.status === 'BOOKED') score += 15;

      // Lead model has no `score` field — store in customFields
      await db.lead.update({
        where: { id: leadId },
        data: {
          customFields: {
            ...(lead.customFields as Record<string, unknown>),
            leadScore: Math.min(score, 100),
            scoredAt: new Date().toISOString(),
          },
        },
      });

      console.log(`[lead-score-worker] Lead ${leadId} scored: ${score}`);
    },
    {
      connection: redis,
      concurrency: 20,
    },
  );
}
