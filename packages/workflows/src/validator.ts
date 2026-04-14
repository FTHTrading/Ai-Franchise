import { z } from 'zod';
import type { WorkflowDefinition } from '@aaos/types';

const workflowStepSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    'SEND_SMS', 'SEND_EMAIL', 'GENERATE_AI_MESSAGE', 'ASSIGN_LEAD',
    'UPDATE_STAGE', 'ADD_TAG', 'REMOVE_TAG', 'CREATE_TASK', 'CALL_WEBHOOK',
    'WAIT_DELAY', 'NOTIFY_OPERATOR', 'BOOK_APPOINTMENT', 'UPDATE_FIELD', 'BRANCH_CONDITION',
  ]),
  label: z.string(),
  config: z.record(z.unknown()),
  onSuccess: z.string().optional(),
  onFailure: z.string().optional(),
  retries: z.number().int().min(0).max(5).optional(),
  delayMs: z.number().min(0).optional(),
});

const triggerSchema = z.object({
  type: z.enum([
    'NEW_LEAD', 'FORM_SUBMITTED', 'MISSED_CALL', 'INBOUND_SMS',
    'NO_RESPONSE', 'APPOINTMENT_REMINDER', 'STATUS_CHANGED', 'TAG_ADDED',
    'MANUAL', 'SCHEDULED', 'WEBHOOK',
  ]),
  filters: z.record(z.unknown()).optional(),
  delay: z.number().optional(),
  deduplicationKey: z.string().optional(),
});

const workflowDefinitionSchema = z.object({
  trigger: triggerSchema,
  steps: z.array(workflowStepSchema).min(1),
  settings: z.object({
    maxExecutions: z.number().optional(),
    cooldownMs: z.number().optional(),
    activeHours: z.object({
      start: z.string(),
      end: z.string(),
      timezone: z.string(),
    }).optional(),
    stopOnOptOut: z.boolean().optional(),
  }).optional(),
});

export function validateWorkflowDefinition(definition: unknown): {
  valid: boolean;
  errors: string[];
  parsed?: WorkflowDefinition;
} {
  const result = workflowDefinitionSchema.safeParse(definition);

  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join('.')} — ${e.message}`);
    return { valid: false, errors };
  }

  // Validate step graph — detect missing onSuccess targets
  const parsed = result.data as WorkflowDefinition;
  const stepIds = new Set(parsed.steps.map((s) => s.id));
  const graphErrors: string[] = [];

  for (const step of parsed.steps) {
    if (step.onSuccess && !stepIds.has(step.onSuccess)) {
      graphErrors.push(`Step '${step.id}' references unknown onSuccess step '${step.onSuccess}'`);
    }
    if (step.onFailure && !stepIds.has(step.onFailure)) {
      graphErrors.push(`Step '${step.id}' references unknown onFailure step '${step.onFailure}'`);
    }
  }

  if (graphErrors.length > 0) {
    return { valid: false, errors: graphErrors };
  }

  return { valid: true, errors: [], parsed };
}
