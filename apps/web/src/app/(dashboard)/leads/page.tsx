import { auth } from '@clerk/nextjs/server';
import { Suspense } from 'react';
import { PageHeader, LoadingPage, EmptyState, Button } from '@aaos/ui';
import { TrendingUp } from 'lucide-react';
import { getClientAccounts } from '@/lib/api';
import { LeadsClientSelector } from '@/components/leads-client-selector';

export default async function LeadsPage() {
  const { orgId } = await auth();
  if (!orgId) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Select a client to view and manage their lead pipeline."
      />
      <Suspense fallback={<LoadingPage />}>
        <LeadsClientContent orgId={orgId} />
      </Suspense>
    </div>
  );
}

async function LeadsClientContent({ orgId }: { orgId: string }) {
  const { data: clients } = await getClientAccounts(orgId);

  if (!clients || clients.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No clients yet"
        description="Add a client first to start managing their leads."
        action={{ label: 'Add Client', href: '/clients' }}
      />
    );
  }

  return <LeadsClientSelector clients={clients} />;
}
