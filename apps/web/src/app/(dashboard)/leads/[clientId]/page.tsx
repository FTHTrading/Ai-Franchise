import { auth } from '@clerk/nextjs/server';
import { Suspense } from 'react';
import { PageHeader, LoadingPage, EmptyState, Button } from '@aaos/ui';
import { TrendingUp, Plus } from 'lucide-react';
import { getLeads, getClientAccount } from '@/lib/api';
import { LeadsKanban } from '@/components/leads-kanban';
import Link from 'next/link';

export default async function ClientLeadsPage({
  params,
}: {
  params: { clientId: string };
}) {
  const { orgId } = await auth();
  if (!orgId) return null;

  return (
    <div className="space-y-6">
      <Suspense fallback={<LoadingPage />}>
        <LeadsContent clientId={params.clientId} />
      </Suspense>
    </div>
  );
}

async function LeadsContent({ clientId }: { clientId: string }) {
  const [client, leadsResult] = await Promise.all([
    getClientAccount(clientId),
    getLeads(clientId, { limit: 200 }),
  ]);

  return (
    <>
      <PageHeader
        title={`${client.businessName} — Leads`}
        description={`${leadsResult.total} leads in pipeline`}
      >
        <div className="flex gap-2">
          <Link href="/leads">
            <Button variant="outline" size="sm">
              All Clients
            </Button>
          </Link>
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Add Lead
          </Button>
        </div>
      </PageHeader>

      {leadsResult.data.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No leads yet"
          description="Start adding leads for this client to track their pipeline."
        />
      ) : (
        <LeadsKanban leads={leadsResult.data} clientId={clientId} />
      )}
    </>
  );
}
