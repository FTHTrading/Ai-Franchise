import { type FastifyInstance } from 'fastify';
import { StripeService } from '@aaos/integrations';
import { TelnyxService } from '@aaos/integrations';
import { BillingService, ConversationService } from '@aaos/core';
import { db } from '@aaos/db';
import { getServerEnv } from '@aaos/config';

export async function webhooksRoutes(app: FastifyInstance) {
  const env = getServerEnv();
  const stripe = new StripeService({ secretKey: env.STRIPE_SECRET_KEY, webhookSecret: env.STRIPE_WEBHOOK_SECRET });
  const telnyx = new TelnyxService({ apiKey: env.TELNYX_API_KEY, webhookSecret: env.TELNYX_WEBHOOK_SECRET ?? '' });
  const billing = new BillingService(db, stripe);
  const convos = new ConversationService(db);

  // Stripe webhook
  app.post('/webhooks/stripe', {
    config: { rawBody: true },
    handler: async (request, reply) => {
      const sig = request.headers['stripe-signature'];
      if (!sig || typeof sig !== 'string') {
        return reply.code(400).send({ error: 'Missing signature' });
      }

      let event;
      try {
        event = stripe.constructWebhookEvent(request.body as Buffer, sig);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        app.log.warn({ err }, 'Stripe webhook signature verification failed');
        return reply.code(400).send({ error: `Webhook Error: ${msg}` });
      }

      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const sub = event.data.object as { customer: string; id: string; status: string; };
          const billingAccount = await db.billingAccount.findFirst({
            where: { stripeId: sub.customer },
          });
          if (billingAccount) {
            await billing.syncStripeSubscription(
              sub.id,
              billingAccount.organizationId,
              sub.status,
              'GROWTH',
              0,
            );
          }
          break;
        }
        default:
          app.log.info({ type: event.type }, 'Unhandled Stripe event');
      }

      return reply.send({ received: true });
    },
  });

  // Telnyx inbound SMS webhook
  app.post('/webhooks/telnyx', async (request, reply) => {
    const sig = request.headers['telnyx-signature-ed25519'] as string;
    const ts = request.headers['telnyx-timestamp'] as string;
    const rawBody = JSON.stringify(request.body);

    const isValid = telnyx.verifyWebhook(rawBody, sig, ts);
    if (!isValid) {
      app.log.warn('Telnyx webhook signature invalid');
      return reply.code(400).send({ error: 'Invalid signature' });
    }

    const payload = request.body as TelnyxWebhookPayload;
    const eventType = payload.data?.event_type;

    if (eventType === 'message.received') {
      const msg = payload.data.payload;
      const from = msg.from?.phone_number;
      const to = msg.to?.[0]?.phone_number;
      const body = msg.text;

      if (from && to && body) {
        const channel = await db.communicationChannel.findFirst({
          where: { identifier: to, channel: 'SMS' },
        });

        if (channel) {
          if (!channel.clientAccountId) {
            app.log.warn('Inbound SMS to channel without clientAccountId — skipping');
            return reply.send({ received: true });
          }

          let lead = await db.lead.findFirst({
            where: { phone: from, clientAccountId: channel.clientAccountId },
          });

          if (!lead) {
            lead = await db.lead.create({
              data: {
                organizationId: channel.organizationId,
                clientAccountId: channel.clientAccountId,
                phone: from,
                firstName: 'Unknown',
                source: 'SMS_INBOUND',
                status: 'NEW',
                stage: 'New Lead',
              },
            });
          }

          const convo = await convos.getOrCreateConversation({
            organizationId: channel.organizationId,
            clientAccountId: channel.clientAccountId,
            leadId: lead.id,
            channel: 'SMS',
            channelId: channel.id,
          });
          await convos.addMessage({
            conversationId: convo.id,
            body,
            channel: 'SMS',
            direction: 'INBOUND',
            externalId: msg.id,
          });
        }
      }
    }

    return reply.send({ received: true });
  });
}

interface TelnyxWebhookPayload {
  data: {
    event_type: string;
    payload: {
      id: string;
      text: string;
      from?: { phone_number: string };
      to?: Array<{ phone_number: string }>;
    };
  };
}
