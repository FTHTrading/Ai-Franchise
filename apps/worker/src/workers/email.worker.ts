import { Worker, type Job } from 'bullmq';
import { redis, QUEUES, type EmailJobPayload } from '../queues';
import { ResendService } from '@aaos/integrations';
import { env } from '@aaos/config';

export function createEmailWorker() {
  return new Worker<EmailJobPayload>(
    QUEUES.EMAIL_SEND,
    async (job: Job<EmailJobPayload>) => {
      const { to, subject, html, from, organizationId } = job.data;

      console.log(`[email-worker] Sending email to ${to} | subject="${subject}"`);

      const resend = new ResendService(env.RESEND_API_KEY);
      await resend.sendEmail({
        from: from ?? env.EMAIL_FROM ?? 'noreply@agencyos.app',
        to,
        subject,
        html,
      });

      console.log(`[email-worker] Email sent to ${to}`);
    },
    {
      connection: redis,
      concurrency: 10,
    },
  );
}
