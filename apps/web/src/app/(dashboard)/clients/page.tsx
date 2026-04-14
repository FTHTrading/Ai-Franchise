import { Suspense } from 'react';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { PageHeader, Button, LoadingPage, EmptyState } from '@aaos/ui';
import { Plus, Building2 } from 'lucide-react';
import { getClientAccounts } from '@/lib/api';
import { ClientAccountsTable } from '@/components/client-accounts-table';

export default async function ClientsPage() {
  const { orgId } = await auth();
  if (!orgId) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Clients" description="Manage your client accounts">
        <Button asChild>
          <Link href="/clients/new">
            <Plus className="h-4 w-4" />
            Add Client
          </Link>
        </Button>
      </PageHeader>
      <Suspense fallback={<LoadingPage />}>
        <ClientList orgId={orgId} />
      </Suspense>
    </div>
  );
}

async function ClientList({ orgId }: { orgId: string }) {
  const result = await getClientAccounts(orgId);

  if (result.data.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No clients yet"
        description="Add your first client to get started with lead automation."
        action={{ label: 'Add Client', onClick: () => {} }}
      />
    );
  }

  return <ClientAccountsTable accounts={result.data} />;
}
