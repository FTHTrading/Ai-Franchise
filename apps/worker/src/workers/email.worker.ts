import { Worker, type Job } from 'bullmq';
import { redis, QUEUES, type EmailJobPayload } from '../queues';
import { ResendService } from '@aaos/integrations';
import { getServerEnv } from '@aaos/config';

const env = getServerEnv();

export function createEmailWorker() {
  return new Worker<EmailJobPayload>(
    QUEUES.EMAIL_SEND,
    async (job: Job<EmailJobPayload>) => {
      const { to, subject, html, from, organizationId } = job.data;

      console.log(`[email-worker] Sending email to ${to} | subject="${subject}"`);

      const resend = new ResendService({ apiKey: env.RESEND_API_KEY });
      await resend.sendEmail({
        from: from ?? 'noreply@agencyos.app',
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
