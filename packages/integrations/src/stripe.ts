import Stripe from 'stripe';

// ─────────────────────────────────────────────
// StripeService — subscriptions, setup fees, webhooks
// ─────────────────────────────────────────────

export interface CreateSubscriptionParams {
  customerId: string;
  priceId: string;
  trialDays?: number;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutSessionParams {
  customerId?: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  setupFeeAmount?: number;   // in cents
  trialDays?: number;
  metadata?: Record<string, string>;
  clientReferenceId?: string;
}

export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  apiVersion?: '2024-04-10';
}

export class StripeService {
  private client: Stripe;
  private webhookSecret: string;

  constructor(config: StripeConfig) {
    this.client = new Stripe(config.secretKey, {
      apiVersion: '2024-04-10',
      typescript: true,
    });
    this.webhookSecret = config.webhookSecret;
  }

  // ─── Customer ───────────────────────────────

  async createCustomer(params: {
    email: string;
    name: string;
    organizationId: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Customer> {
    return this.client.customers.create({
      email: params.email,
      name: params.name,
      metadata: {
        organizationId: params.organizationId,
        ...params.metadata,
      },
    });
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer | null> {
    try {
      const customer = await this.client.customers.retrieve(customerId);
      if (customer.deleted) return null;
      return customer as Stripe.Customer;
    } catch {
      return null;
    }
  }

  // ─── Checkout ───────────────────────────────

  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price: params.priceId, quantity: 1 },
    ];

    // Add one-time setup fee if specified
    if (params.setupFeeAmount && params.setupFeeAmount > 0) {
      lineItems.unshift({
        price_data: {
          currency: 'usd',
          unit_amount: params.setupFeeAmount,
          product_data: { name: 'Setup Fee' },
        },
        quantity: 1,
      });
    }

    return this.client.checkout.sessions.create({
      mode: 'subscription',
      customer: params.customerId,
      line_items: lineItems,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      subscription_data: {
        trial_period_days: params.trialDays,
        metadata: params.metadata ?? {},
      },
      metadata: params.metadata ?? {},
      client_reference_id: params.clientReferenceId,
    });
  }

  // ─── Billing portal ─────────────────────────

  async createBillingPortalSession(customerId: string, returnUrl: string): Promise<string> {
    const session = await this.client.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return session.url;
  }

  // ─── Subscriptions ──────────────────────────

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    try {
      return await this.client.subscriptions.retrieve(subscriptionId);
    } catch {
      return null;
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.client.subscriptions.cancel(subscriptionId);
  }

  async getUpcomingInvoice(subscriptionId: string): Promise<Stripe.UpcomingInvoice | null> {
    try {
      return await this.client.invoices.retrieveUpcoming({
        subscription: subscriptionId,
      });
    } catch {
      return null;
    }
  }

  async listInvoices(customerId: string, limit = 10): Promise<Stripe.Invoice[]> {
    const result = await this.client.invoices.list({ customer: customerId, limit });
    return result.data;
  }

  // ─── Webhook verification ───────────────────

  constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
    return this.client.webhooks.constructEvent(payload, signature, this.webhookSecret);
  }

  // ─── Usage records (metered billing) ────────

  async recordUsage(subscriptionItemId: string, quantity: number): Promise<void> {
    await this.client.subscriptionItems.createUsageRecord(subscriptionItemId, {
      quantity,
      timestamp: Math.floor(Date.now() / 1000),
      action: 'increment',
    });
  }
}
