import type { PrismaClient } from '@aaos/db';
import type { WorkflowDefinition } from '@aaos/types';
import { validateWorkflowDefinition } from '@aaos/workflows';
import { WORKFLOW_TEMPLATES, type WorkflowTemplateKey } from '@aaos/workflows';

// ─────────────────────────────────────────────
// WorkflowService — DB management, install templates, trigger registration
// ─────────────────────────────────────────────

export class WorkflowService {
  constructor(private db: PrismaClient) {}

  async installTemplate(params: {
    organizationId: string;
    clientAccountId?: string;
    templateKey: WorkflowTemplateKey;
    customName?: string;
  }) {
    const template = WORKFLOW_TEMPLATES[params.templateKey];
    if (!template) throw new Error(`Unknown template: ${params.templateKey}`);

    // Find or create the template record
    let templateRecord = await this.db.template.findFirst({
      where: { organizationId: params.organizationId, key: params.templateKey },
    });

    if (!templateRecord) {
      templateRecord = await this.db.template.create({
        data: {
          organizationId: params.organizationId,
          key: params.templateKey,
          title: template.title,
          description: template.description,
          category: template.category as never,
          workflowDefinition: template.definition as never,
          variableDefaults: template.variableDefaults,
          isBuiltIn: true,
        },
      });
    }

    // Create the workflow instance
    const workflow = await this.db.workflow.create({
      data: {
        organizationId: params.organizationId,
        clientAccountId: params.clientAccountId,
        templateId: templateRecord.id,
        name: params.customName ?? template.title,
        description: template.description,
        triggerType: template.definition.trigger.type,
        triggerConfig: template.definition.trigger as never,
        steps: template.definition.steps as never,
        settings: (template.definition.settings ?? {}) as never,
        status: 'ACTIVE',
        publishedAt: new Date(),
      },
    });

    if (params.clientAccountId) {
      await this.db.workflowAssignment.create({
        data: {
          workflowId: workflow.id,
          clientAccountId: params.clientAccountId,
        },
      });
    }

    return workflow;
  }

  async createCustomWorkflow(params: {
    organizationId: string;
    clientAccountId?: string;
    name: string;
    description?: string;
    definition: WorkflowDefinition;
  }) {
    const { valid, errors } = validateWorkflowDefinition(params.definition);
    if (!valid) {
      throw new Error(`Invalid workflow definition: ${errors.join('; ')}`);
    }

    return this.db.workflow.create({
      data: {
        organizationId: params.organizationId,
        clientAccountId: params.clientAccountId,
        name: params.name,
        description: params.description,
        triggerType: params.definition.trigger.type,
        triggerConfig: params.definition.trigger as never,
        steps: params.definition.steps as never,
        settings: (params.definition.settings ?? {}) as never,
        status: 'DRAFT',
      },
    });
  }

  async activate(workflowId: string, organizationId: string) {
    return this.db.workflow.updateMany({
      where: { id: workflowId, organizationId },
      data: { status: 'ACTIVE', publishedAt: new Date() },
    });
  }

  async pause(workflowId: string, organizationId: string) {
    return this.db.workflow.updateMany({
      where: { id: workflowId, organizationId },
      data: { status: 'PAUSED' },
    });
  }

  async recordExecution(params: {
    workflowId: string;
    leadId: string;
    organizationId: string;
    clientAccountId: string;
    status: 'COMPLETED' | 'FAILED' | 'CANCELLED';
    stepResults: unknown[];
    durationMs: number;
    failureReason?: string;
  }) {
    return this.db.workflowExecution.create({
      data: {
        workflowId: params.workflowId,
        leadId: params.leadId,
        organizationId: params.organizationId,
        clientAccountId: params.clientAccountId,
        status: params.status,
        stepResults: params.stepResults as never,
        durationMs: params.durationMs,
        failureReason: params.failureReason,
        completedAt: new Date(),
      },
    });
  }

  async getActiveWorkflowsForTrigger(organizationId: string, clientAccountId: string, triggerType: string) {
    return this.db.workflow.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
        triggerType: triggerType as never,
        deletedAt: null,
        OR: [
          { clientAccountId },
          { clientAccountId: null },
        ],
      },
    });
  }

  async listForOrganization(organizationId: string) {
    return this.db.workflow.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        template: { select: { title: true, category: true } },
        _count: { select: { executions: true } },
      },
    });
  }
}
