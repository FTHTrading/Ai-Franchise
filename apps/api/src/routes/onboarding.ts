import { type FastifyInstance, type FastifyRequest } from 'fastify';
import { OnboardingService } from '@aaos/core';
import { db } from '@aaos/db';
import { authenticate } from '../middleware/auth';

export async function onboardingRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  const onboarding = new OnboardingService(db);

  // GET /onboarding
  app.get('/onboarding', async (request, reply) => {
    const { organizationId } = request.authContext;
    if (!organizationId) return reply.code(403).send({ error: 'No org context' });
    const state = await onboarding.getState(organizationId);
    return reply.send({ state });
  });

  // POST /onboarding/:step/complete
  app.post('/onboarding/:step/complete', async (request, reply) => {
    const { organizationId } = request.authContext;
    if (!organizationId) return reply.code(403).send({ error: 'No org context' });
    const { step } = request.params as { step: string };
    const state = await onboarding.completeStep(organizationId, step as never);
    return reply.send({ state });
  });

  // POST /onboarding/:step/skip
  app.post('/onboarding/:step/skip', async (request, reply) => {
    const { organizationId } = request.authContext;
    if (!organizationId) return reply.code(403).send({ error: 'No org context' });
    const { step } = request.params as { step: string };
    const state = await onboarding.skipStep(organizationId, step as never);
    return reply.send({ state });
  });
}
