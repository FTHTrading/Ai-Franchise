import type { PrismaClient } from '@aaos/db';
import type { OnboardingStep } from '@aaos/types';

// ─────────────────────────────────────────────
// OnboardingService — tracks and advances wizard state per org
// ─────────────────────────────────────────────

const STEP_ORDER: OnboardingStep[] = ['brand', 'channel', 'template', 'client', 'team', 'complete'];

export class OnboardingService {
  constructor(private db: PrismaClient) {}

  async getState(organizationId: string) {
    let state = await this.db.onboardingState.findUnique({
      where: { organizationId },
    });

    if (!state) {
      state = await this.db.onboardingState.create({
        data: {
          organizationId,
          currentStep: 'brand',
          completedSteps: [],
          isComplete: false,
        },
      });
    }

    return state;
  }

  async completeStep(organizationId: string, step: OnboardingStep) {
    const state = await this.getState(organizationId);
    const completed = state.completedSteps as OnboardingStep[];

    if (completed.includes(step)) return state;

    const newCompleted = [...completed, step];
    const nextStep = this.getNextStep(newCompleted);
    const isComplete = nextStep === null;

    return this.db.onboardingState.update({
      where: { organizationId },
      data: {
        completedSteps: newCompleted,
        currentStep: nextStep ?? 'complete',
        isComplete,
        completedAt: isComplete ? new Date() : null,
      },
    });
  }

  async skipStep(organizationId: string, step: OnboardingStep) {
    return this.completeStep(organizationId, step);
  }

  private getNextStep(completed: OnboardingStep[]): OnboardingStep | null {
    for (const step of STEP_ORDER) {
      if (step === 'complete') continue;
      if (!completed.includes(step)) return step;
    }
    return null;
  }

  isComplete(completedSteps: OnboardingStep[]): boolean {
    const required: OnboardingStep[] = ['brand', 'channel', 'template', 'client', 'team'];
    return required.every((s) => completedSteps.includes(s));
  }
}
