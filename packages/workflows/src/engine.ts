import type { WorkflowDefinition, WorkflowStep, WorkflowActionType } from '@aaos/types';

// ─────────────────────────────────────────────
// WorkflowEngine — interprets WorkflowDefinition JSON and executes steps
// Steps are handled by injected handlers (so the engine has no external deps)
// ─────────────────────────────────────────────

export interface StepExecutionContext {
  workflowId: string;
  executionId: string;
  leadId: string;
  organizationId: string;
  clientAccountId: string;
  variables: Record<string, unknown>;
  step: WorkflowStep;
}

export type StepHandler = (ctx: StepExecutionContext) => Promise<{
  success: boolean;
  output?: Record<string, unknown>;
  error?: string;
  skipRemaining?: boolean;
}>;

export interface WorkflowRunOptions {
  workflowId: string;
  executionId: string;
  definition: WorkflowDefinition;
  leadId: string;
  organizationId: string;
  clientAccountId: string;
  initialVariables?: Record<string, unknown>;
}

export interface StepResult {
  stepId: string;
  stepType: WorkflowActionType;
  success: boolean;
  output?: Record<string, unknown>;
  error?: string;
  durationMs: number;
  skipped?: boolean;
}

export interface WorkflowRunResult {
  executionId: string;
  workflowId: string;
  success: boolean;
  stepResults: StepResult[];
  totalDurationMs: number;
  completedAt: Date;
  failureReason?: string;
}

export class WorkflowEngine {
  private handlers = new Map<WorkflowActionType, StepHandler>();

  // Register a handler for a specific action type
  register(type: WorkflowActionType, handler: StepHandler): void {
    this.handlers.set(type, handler);
  }

  // Execute a workflow definition from start to finish
  async run(options: WorkflowRunOptions): Promise<WorkflowRunResult> {
    const startTime = Date.now();
    const stepResults: StepResult[] = [];
    const variables = { ...options.initialVariables };

    const { steps } = options.definition;
    let currentStepId: string | undefined = steps[0]?.id;
    let runSuccess = true;
    let failureReason: string | undefined;

    // Build a step map for fast lookup
    const stepMap = new Map(steps.map((s) => [s.id, s]));

    while (currentStepId) {
      const step = stepMap.get(currentStepId);
      if (!step) break;

      // Handle delay steps without a real handler
      if (step.type === 'WAIT_DELAY') {
        stepResults.push({
          stepId: step.id,
          stepType: step.type,
          success: true,
          output: { delayMs: step.delayMs ?? 0 },
          durationMs: 0,
          skipped: false,
        });
        currentStepId = step.onSuccess;
        continue;
      }

      const handler = this.handlers.get(step.type);
      if (!handler) {
        stepResults.push({
          stepId: step.id,
          stepType: step.type,
          success: false,
          error: `No handler registered for step type: ${step.type}`,
          durationMs: 0,
        });
        // Unregistered handlers are non-fatal — skip to next
        currentStepId = step.onFailure ?? step.onSuccess;
        continue;
      }

      const stepStart = Date.now();
      let result: Awaited<ReturnType<StepHandler>>;

      try {
        result = await handler({
          workflowId: options.workflowId,
          executionId: options.executionId,
          leadId: options.leadId,
          organizationId: options.organizationId,
          clientAccountId: options.clientAccountId,
          variables,
          step,
        });
      } catch (err) {
        result = { success: false, error: String(err) };
      }

      const durationMs = Date.now() - stepStart;

      stepResults.push({
        stepId: step.id,
        stepType: step.type,
        success: result.success,
        output: result.output,
        error: result.error,
        durationMs,
      });

      // Merge step output into variables for subsequent steps
      if (result.output) {
        Object.assign(variables, result.output);
      }

      if (result.skipRemaining) {
        break;
      }

      if (!result.success) {
        runSuccess = false;
        failureReason = result.error;
        if (step.onFailure) {
          currentStepId = step.onFailure;
        } else {
          break;
        }
      } else {
        currentStepId = step.onSuccess;
      }
    }

    return {
      executionId: options.executionId,
      workflowId: options.workflowId,
      success: runSuccess,
      stepResults,
      totalDurationMs: Date.now() - startTime,
      completedAt: new Date(),
      failureReason,
    };
  }
}
