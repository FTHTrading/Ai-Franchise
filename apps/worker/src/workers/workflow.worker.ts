import { Worker, type Job } from 'bullmq';
import { redis, QUEUES, type WorkflowJobPayload } from '../queues';
import { WorkflowEngine } from '@aaos/workflows';
import { prisma } from '@aaos/db';

export function createWorkflowWorker() {
  return new Worker<WorkflowJobPayload>(
    QUEUES.WORKFLOW,
    async (job: Job<WorkflowJobPayload>) => {
      const { workflowInstanceId, leadId, organizationId, triggerEvent, triggerData } = job.data;

      console.log(`[workflow-worker] Processing job ${job.id} | workflow=${workflowInstanceId} lead=${leadId}`);

      // Load workflow instance with its template
      const instance = await prisma.workflowInstance.findUnique({
        where: { id: workflowInstanceId },
        include: { template: true },
      });

      if (!instance) {
        console.warn(`[workflow-worker] Workflow instance ${workflowInstanceId} not found — skipping`);
        return;
      }

      if (instance.status !== 'ACTIVE') {
        console.info(`[workflow-worker] Workflow ${workflowInstanceId} is ${instance.status} — skipping`);
        return;
      }

      const lead = await prisma.lead.findUnique({ where: { id: leadId } });
      if (!lead) {
        console.warn(`[workflow-worker] Lead ${leadId} not found — skipping`);
        return;
      }

      const engine = new WorkflowEngine();
      await engine.execute({
        workflowInstance: instance,
        lead,
        organizationId,
        triggerEvent,
        triggerData,
      });

      console.log(`[workflow-worker] Completed job ${job.id}`);
    },
    {
      connection: redis,
      concurrency: 5,
    },
  );
}
