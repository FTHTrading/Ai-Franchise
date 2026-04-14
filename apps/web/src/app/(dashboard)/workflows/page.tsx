import { auth } from '@clerk/nextjs/server';
import { Suspense } from 'react';
import { PageHeader, Button, LoadingPage, EmptyState } from '@aaos/ui';
import { Plus, Workflow } from 'lucide-react';
import { getWorkflows } from '@/lib/api';
import { WorkflowsGrid } from '@/components/workflows-grid';

export default async function WorkflowsPage() {
  const { orgId } = await auth();
  if (!orgId) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Automations" description="Manage your AI workflow automations">
        <Button>
          <Plus className="h-4 w-4" />
          Install Template
        </Button>
      </PageHeader>
      <Suspense fallback={<LoadingPage />}>
        <WorkflowContent orgId={orgId} />
      </Suspense>
    </div>
  );
}

async function WorkflowContent({ orgId }: { orgId: string }) {
  const { workflows } = await getWorkflows(orgId);

  if (workflows.length === 0) {
    return (
      <EmptyState
        icon={Workflow}
        title="No automations yet"
        description="Install a built-in template to start automating lead follow-up."
        action={{ label: 'Browse Templates', onClick: () => {} }}
      />
    );
  }

  return <WorkflowsGrid workflows={workflows} />;
}
