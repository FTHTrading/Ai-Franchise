import { type FastifyInstance, type FastifyRequest } from 'fastify';
import { AnalyticsService } from '@aaos/core';
import { db } from '@aaos/db';
import { authenticate } from '../middleware/auth';

export async function analyticsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  const analytics = new AnalyticsService(db);

  // GET /analytics/agency
  app.get('/analytics/agency', async (request, reply) => {
    const { organizationId } = request.authContext;
    if (!organizationId) return reply.code(403).send({ error: 'No org context' });

    const metrics = await analytics.getAgencyMetrics(organizationId);
    return reply.send({ metrics });
  });

  // GET /analytics/clients/:clientAccountId
  app.get('/analytics/clients/:clientAccountId', async (request, reply) => {
    const { clientAccountId } = request.params as { clientAccountId: string };

    const metrics = await analytics.getClientMetrics(request.authContext.organizationId!, clientAccountId);
    return reply.send({ metrics });
  });
}
