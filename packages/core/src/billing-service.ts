import type { PrismaClient } from '@aaos/db';
import type { StripeService } from '@aaos/integrations';

// ─────────────────────────────────────────────
// BillingService — subscription management + Stripe sync
// ─────────────────────────────────────────────

export class BillingService {
  constructor(
    private db: PrismaClient,
    private stripe: StripeService,
  ) {}

  async getOrCreateBillingAccount(organizationId: string, params: {
    email: string;
    name: string;
  }) {
    let billing = await this.db.billingAccount.findUnique({ where: { organizationId } });

    if (billing) return billing;

    const customer = await this.stripe.createCustomer({
      email: params.email,
      name: params.name,
      organizationId,
    });

    billing = await this.db.billingAccount.create({
      data: {
        organizationId,
        stripeCustomerId: customer.id,
        email: params.email,
        name: params.name,
      },
    });

    return billing;
  }

  async createCheckoutSession(organizationId: string, params: {
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    setupFeeAmount?: number;
    trialDays?: number;
  }) {
    const billing = await this.db.billingAccount.findUnique({ where: { organizationId } });
    if (!billing) throw new Error('No billing account found. Create one first.');

    return this.stripe.createCheckoutSession({
      customerId: billing.stripeCustomerId,
      priceId: params.priceId,
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
      setupFeeAmount: params.setupFeeAmount,
      trialDays: params.trialDays,
      clientReferenceId: organizationId,
      metadata: { organizationId },
    });
  }

  async syncStripeSubscription(stripeSubscriptionId: string, organizationId: string, status: string, tier: string, mrr: number) {
    const existing = await this.db.subscription.findUnique({ where: { organizationId } });

    if (existing) {
      return this.db.subscription.update({
        where: { organizationId },
        data: {
          stripeSubscriptionId,
          status: status as never,
          tier: tier as never,
          mrr,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }

    return this.db.subscription.create({
      data: {
        organizationId,
        stripeSubscriptionId,
        status: status as never,
        tier: tier as never,
        mrr,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  async getBillingPortalUrl(organizationId: string, returnUrl: string) {
    const billing = await this.db.billingAccount.findUnique({ where: { organizationId } });
    if (!billing) throw new Error('No billing account found');
    return this.stripe.createBillingPortalSession(billing.stripeCustomerId, returnUrl);
  }

  async getSubscription(organizationId: string) {
    return this.db.subscription.findUnique({ where: { organizationId } });
  }

  async recordUsage(organizationId: string, type: string, quantity: number, metadata?: Record<string, unknown>) {
    return this.db.usageLog.create({
      data: {
        organizationId,
        type,
        quantity,
        metadata: metadata ?? {},
      },
    });
  }

  async getUsageSummary(organizationId: string) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const logs = await this.db.usageLog.groupBy({
      by: ['type'],
      where: { organizationId, createdAt: { gte: since } },
      _sum: { quantity: true },
    });

    const summary: Record<string, number> = {};
    for (const log of logs) {
      summary[log.type] = log._sum.quantity ?? 0;
    }
    return summary;
  }
}
