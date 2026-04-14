import { createWorkflowWorker } from './workers/workflow.worker';
import { createAiReplyWorker } from './workers/ai-reply.worker';
import { createLeadScoreWorker } from './workers/lead-score.worker';
import { createAppointmentReminderWorker } from './workers/appointment-reminder.worker';
import { createEmailWorker } from './workers/email.worker';
import { redis } from './queues';

async function main() {
  console.log('🚀 AgencyOS Worker starting...');

  const workers = [
    createWorkflowWorker(),
    createAiReplyWorker(),
    createLeadScoreWorker(),
    createAppointmentReminderWorker(),
    createEmailWorker(),
  ];

  // Graceful shutdown
  async function shutdown(signal: string) {
    console.log(`\n${signal} received — shutting down workers gracefully...`);
    await Promise.all(workers.map((w) => w.close()));
    await redis.quit();
    console.log('Workers stopped. Goodbye.');
    process.exit(0);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Log worker events
  for (const worker of workers) {
    worker.on('completed', (job) => {
      console.log(`✓ [${worker.name}] Job ${job.id} completed`);
    });
    worker.on('failed', (job, err) => {
      console.error(`✗ [${worker.name}] Job ${job?.id} failed:`, err.message);
    });
    worker.on('error', (err) => {
      console.error(`[${worker.name}] Worker error:`, err);
    });
  }

  console.log(`✅ ${workers.length} workers running and waiting for jobs...`);
  console.log('   Workers: workflow, ai-reply, lead-score, appointment-reminder, email');
}

main().catch((err) => {
  console.error('Failed to start worker process:', err);
  process.exit(1);
});
