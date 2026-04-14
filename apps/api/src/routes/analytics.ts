import { type FastifyInstance, type FastifyRequest } from 'fastify';
import { type AuthContext } from '@aaos/types';
import { AnalyticsService } from '@aaos/core';
import { db } from '@aaos/db';
import { authenticate } from '../middleware/auth';

type AuthReq = FastifyRequest & { authContext: AuthContext };

export async function analyticsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  const analytics = new AnalyticsService(db);

  // GET /analytics/agency
  app.get('/analytics/agency', async (request: AuthReq, reply) => {
    const { organizationId } = request.authContext;
    if (!organizationId) return reply.code(403).send({ error: 'No org context' });

    const q = request.query as Record<string, string>;
    const metrics = await analytics.getAgencyMetrics(organizationId, {
      from: q.from ? new Date(q.from) : undefined,
      to: q.to ? new Date(q.to) : undefined,
    });
    return reply.send({ metrics });
  });

  // GET /analytics/clients/:clientAccountId
  app.get('/analytics/clients/:clientAccountId', async (request: AuthReq, reply) => {
    const { clientAccountId } = request.params as { clientAccountId: string };

    const q = request.query as Record<string, string>;
    const metrics = await analytics.getClientMetrics(clientAccountId, {
      from: q.from ? new Date(q.from) : undefined,
      to: q.to ? new Date(q.to) : undefined,
    });
    return reply.send({ metrics });
  });
}
