import { type FastifyInstance, type FastifyRequest } from 'fastify';
import { type AuthContext } from '@aaos/types';
import { OnboardingService } from '@aaos/core';
import { db } from '@aaos/db';
import { authenticate } from '../middleware/auth';

type AuthReq = FastifyRequest & { authContext: AuthContext };

export async function onboardingRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  const onboarding = new OnboardingService(db);

  // GET /onboarding
  app.get('/onboarding', async (request: AuthReq, reply) => {
    const { organizationId } = request.authContext;
    if (!organizationId) return reply.code(403).send({ error: 'No org context' });
    const state = await onboarding.getState(organizationId);
    return reply.send({ state });
  });

  // POST /onboarding/:step/complete
  app.post('/onboarding/:step/complete', async (request: AuthReq, reply) => {
    const { organizationId } = request.authContext;
    if (!organizationId) return reply.code(403).send({ error: 'No org context' });
    const { step } = request.params as { step: string };
    const data = (request.body ?? {}) as Record<string, unknown>;
    const state = await onboarding.completeStep(organizationId, step as never, data);
    return reply.send({ state });
  });

  // POST /onboarding/:step/skip
  app.post('/onboarding/:step/skip', async (request: AuthReq, reply) => {
    const { organizationId } = request.authContext;
    if (!organizationId) return reply.code(403).send({ error: 'No org context' });
    const { step } = request.params as { step: string };
    const state = await onboarding.skipStep(organizationId, step as never);
    return reply.send({ state });
  });
}
