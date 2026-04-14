import { type FastifyInstance, type FastifyRequest } from 'fastify';
import { z } from 'zod';
import { BillingService } from '@aaos/core';
import { StripeService } from '@aaos/integrations';
import { db } from '@aaos/db';
import { getServerEnv } from '@aaos/config';
import { authenticate } from '../middleware/auth';

export async function billingRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  const env = getServerEnv();
  const stripe = new StripeService({ secretKey: env.STRIPE_SECRET_KEY, webhookSecret: env.STRIPE_WEBHOOK_SECRET });
  const billing = new BillingService(db, stripe);

  // GET /billing — get billing account + subscription
  app.get('/billing', async (request, reply) => {
    const { organizationId } = request.authContext;
    if (!organizationId) return reply.code(403).send({ error: 'No org context' });

    const account = await billing.getOrCreateBillingAccount(organizationId, {
      email: '',
      name: organizationId,
    });
    const subscription = await billing.getSubscription(organizationId);
    return reply.send({ account, subscription });
  });

  // POST /billing/checkout — create Stripe checkout session
  app.post('/billing/checkout', async (request, reply) => {
    const { organizationId } = request.authContext;
    if (!organizationId) return reply.code(403).send({ error: 'No org context' });

    const body = CheckoutSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: 'Bad Request', details: body.error.flatten() });

    const session = await billing.createCheckoutSession(
      organizationId,
      {
        priceId: body.data.priceId,
        successUrl: body.data.successUrl,
        cancelUrl: body.data.cancelUrl,
      }
    );
    return reply.send({ url: session.url });
  });

  // POST /billing/portal — get Stripe billing portal URL
  app.post('/billing/portal', async (request, reply) => {
    const { organizationId } = request.authContext;
    if (!organizationId) return reply.code(403).send({ error: 'No org context' });

    const body = PortalSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: 'Bad Request', details: body.error.flatten() });

    const url = await billing.getBillingPortalUrl(organizationId, body.data.returnUrl);
    return reply.send({ url });
  });
}

const CheckoutSchema = z.object({
  priceId: z.string(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

const PortalSchema = z.object({ returnUrl: z.string().url() });
