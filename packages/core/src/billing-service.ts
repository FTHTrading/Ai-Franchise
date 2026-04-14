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
        stripeId: customer.id,
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
    if (!billing.stripeId) throw new Error('Billing account has no Stripe ID');

    return this.stripe.createCheckoutSession({
      customerId: billing.stripeId,
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
          stripeSubId: stripeSubscriptionId,
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
        stripeSubId: stripeSubscriptionId,
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
    if (!billing.stripeId) throw new Error('Billing account has no Stripe ID');
    return this.stripe.createBillingPortalSession(billing.stripeId, returnUrl);
  }

  async getSubscription(organizationId: string) {
    return this.db.subscription.findUnique({ where: { organizationId } });
  }

  async recordUsage(organizationId: string, type: string, quantity: number, metadata?: Record<string, unknown>) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return this.db.usageLog.create({
      data: {
        organizationId,
        category: type,
        quantity,
        periodStart,
        periodEnd,
        metadata: (metadata ?? {}) as never,
      },
    });
  }

  async getUsageSummary(organizationId: string) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const logs = await this.db.usageLog.groupBy({
      by: ['category'],
      where: { organizationId, createdAt: { gte: since } },
      _sum: { quantity: true },
    });

    const summary: Record<string, number> = {};
    for (const log of logs) {
      summary[log.category] = log._sum.quantity ?? 0;
    }
    return summary;
  }
}
