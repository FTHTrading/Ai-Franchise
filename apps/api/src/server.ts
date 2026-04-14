import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';
import rateLimit from '@fastify/rate-limit';
import { getServerEnv } from '@aaos/config';

import { authRoutes } from './routes/auth';
import { organizationsRoutes } from './routes/organizations';
import { clientAccountsRoutes } from './routes/client-accounts';
import { leadsRoutes } from './routes/leads';
import { conversationsRoutes } from './routes/conversations';
import { workflowsRoutes } from './routes/workflows';
import { templatesRoutes } from './routes/templates';
import { billingRoutes } from './routes/billing';
import { onboardingRoutes } from './routes/onboarding';
import { analyticsRoutes } from './routes/analytics';
import { webhooksRoutes } from './routes/webhooks';
import { appointmentsRoutes } from './routes/appointments';
import { usersRoutes } from './routes/users';

export async function buildApp() {
  const env = getServerEnv();

  const app = Fastify({
    logger: true,
    trustProxy: true,
  });

  // Core plugins
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: env.NODE_ENV === 'production' ? [env.API_URL] : true,
    credentials: true,
  });
  await app.register(sensible);
  await app.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({ statusCode: 429, error: 'Too Many Requests', message: 'Rate limit exceeded' }),
  });

  // Health check (no auth)
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Routes
  const v1 = { prefix: '/api/v1' };
  await app.register(authRoutes, v1);
  await app.register(organizationsRoutes, v1);
  await app.register(clientAccountsRoutes, v1);
  await app.register(usersRoutes, v1);
  await app.register(leadsRoutes, v1);
  await app.register(conversationsRoutes, v1);
  await app.register(workflowsRoutes, v1);
  await app.register(templatesRoutes, v1);
  await app.register(billingRoutes, v1);
  await app.register(onboardingRoutes, v1);
  await app.register(analyticsRoutes, v1);
  await app.register(appointmentsRoutes, v1);
  await app.register(webhooksRoutes, v1);

  return app;
}

async function start() {
  const env = getServerEnv();
  const app = await buildApp();

  try {
    await app.listen({ port: 3001, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
