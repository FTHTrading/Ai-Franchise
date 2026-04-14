import { Worker, type Job } from 'bullmq';
import { redis, QUEUES, type WorkflowJobPayload } from '../queues';
import { WorkflowEngine } from '@aaos/workflows';
import { db } from '@aaos/db';

export function createWorkflowWorker() {
  return new Worker<WorkflowJobPayload>(
    QUEUES.WORKFLOW,
    async (job: Job<WorkflowJobPayload>) => {
      const { workflowInstanceId, leadId, organizationId, triggerEvent, triggerData } = job.data;

      console.log(`[workflow-worker] Processing job ${job.id} | workflow=${workflowInstanceId} lead=${leadId}`);

      // Load workflow with its template
      const workflow = await db.workflow.findUnique({
        where: { id: workflowInstanceId },
        include: { template: true },
      });

      if (!workflow) {
        console.warn(`[workflow-worker] Workflow ${workflowInstanceId} not found — skipping`);
        return;
      }

      if (workflow.status !== 'ACTIVE') {
        console.info(`[workflow-worker] Workflow ${workflowInstanceId} is ${workflow.status} — skipping`);
        return;
      }

      const lead = await db.lead.findUnique({ where: { id: leadId } });
      if (!lead) {
        console.warn(`[workflow-worker] Lead ${leadId} not found — skipping`);
        return;
      }

      // Create execution record
      const execution = await db.workflowExecution.create({
        data: {
          workflowId: workflow.id,
          organizationId,
          status: 'RUNNING',
          triggeredBy: triggerEvent ?? 'MANUAL',
          duration: 0,
        },
      });

      const engine = new WorkflowEngine();
      const definition = workflow.template?.steps as unknown as import('@aaos/types').WorkflowDefinition;
      await engine.run({
        workflowId: workflow.id,
        executionId: execution.id,
        definition,
        leadId,
        organizationId,
        clientAccountId: workflow.clientAccountId ?? lead.clientAccountId,
        initialVariables: triggerData as Record<string, unknown> | undefined,
      });

      console.log(`[workflow-worker] Completed job ${job.id}`);
    },
    {
      connection: redis,
      concurrency: 5,
    },
  );
}
