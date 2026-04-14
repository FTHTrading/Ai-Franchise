import { auth } from '@clerk/nextjs/server';
import { Suspense } from 'react';
import {
  PageHeader,
  LoadingPage,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
  formatCurrency,
} from '@aaos/ui';
import { CreditCard, ExternalLink } from 'lucide-react';
import { getBillingInfo, createPortalSession } from '@/lib/api';
import { redirect } from 'next/navigation';

export default async function BillingPage() {
  const { orgId } = await auth();
  if (!orgId) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Manage your subscription and payment details."
      />
      <Suspense fallback={<LoadingPage />}>
        <BillingContent orgId={orgId} />
      </Suspense>
    </div>
  );
}

async function BillingContent({ orgId }: { orgId: string }) {
  let billingData: Awaited<ReturnType<typeof getBillingInfo>> | null = null;
  try {
    billingData = await getBillingInfo(orgId);
  } catch {
    // No billing account yet
  }

  const account = billingData?.account;
  const subscription = billingData?.subscription as Record<string, unknown> | null;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your active subscription details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg capitalize">
                    {String(account?.plan ?? 'Starter')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Renews on{' '}
                    {subscription.currentPeriodEnd
                      ? new Date(subscription.currentPeriodEnd as string).toLocaleDateString()
                      : '—'}
                  </p>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
              <ManageSubscriptionButton orgId={orgId} />
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You&apos;re on the free plan. Upgrade to unlock automation, AI
                follow-up, and unlimited clients.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {PLANS.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment info */}
      {account && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Manage your payment methods through the Stripe customer portal.
            </p>
            <ManageSubscriptionButton orgId={orgId} className="mt-3" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

async function ManageSubscriptionButton({
  orgId,
  className,
}: {
  orgId: string;
  className?: string;
}) {
  return (
    <form
      action={async () => {
        'use server';
        const { url } = await createPortalSession();
        redirect(url);
      }}
    >
      <Button type="submit" variant="outline" className={className}>
        <ExternalLink className="h-4 w-4" />
        Manage Subscription
      </Button>
    </form>
  );
}

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 297,
    features: ['5 clients', '500 AI messages', '3 workflows'],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 597,
    features: ['25 clients', '5,000 AI messages', 'Unlimited workflows'],
  },
  {
    id: 'scale',
    name: 'Scale',
    price: 997,
    features: ['Unlimited clients', 'Unlimited messages', 'White-label'],
  },
];

function PlanCard({
  plan,
}: {
  plan: { id: string; name: string; price: number; features: string[] };
}) {
  return (
    <Card className="relative">
      {plan.id === 'growth' && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
          <Badge>Popular</Badge>
        </div>
      )}
      <CardContent className="p-4 space-y-3">
        <div>
          <p className="font-semibold">{plan.name}</p>
          <p className="text-2xl font-bold">
            {formatCurrency(plan.price)}
            <span className="text-sm font-normal text-muted-foreground">/mo</span>
          </p>
        </div>
        <ul className="space-y-1">
          {plan.features.map((f) => (
            <li key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="text-green-500">✓</span> {f}
            </li>
          ))}
        </ul>
        <Button size="sm" className="w-full" variant={plan.id === 'growth' ? 'default' : 'outline'}>
          Choose Plan
        </Button>
      </CardContent>
    </Card>
  );
}
