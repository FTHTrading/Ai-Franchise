import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { PageHeader, MetricCard, StatChart, LoadingPage } from '@aaos/ui';
import { Users, TrendingUp, MessageSquare, Calendar, Workflow } from 'lucide-react';
import { getAgencyMetrics } from '@/lib/api';

export default async function DashboardPage() {
  const { orgId } = await auth();
  if (!orgId) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Your agency performance at a glance"
      />
      <Suspense fallback={<LoadingPage />}>
        <DashboardMetrics orgId={orgId} />
      </Suspense>
    </div>
  );
}

async function DashboardMetrics({ orgId }: { orgId: string }) {
  const metrics = await getAgencyMetrics(orgId);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Monthly Revenue"
          value={metrics.mrr}
          format="currency"
          icon={TrendingUp}
          trend={metrics.mrrGrowth}
        />
        <MetricCard
          title="Active Clients"
          value={metrics.activeClients}
          icon={Users}
        />
        <MetricCard
          title="New Leads (30d)"
          value={metrics.newLeadsThisPeriod}
          icon={TrendingUp}
        />
        <MetricCard
          title="Booked Appointments"
          value={metrics.bookedAppointments}
          icon={Calendar}
        />
        <MetricCard
          title="Messages Sent"
          value={metrics.messageVolume}
          icon={MessageSquare}
        />
        <MetricCard
          title="Workflow Runs"
          value={metrics.workflowExecutions}
          icon={Workflow}
        />
        <MetricCard
          title="Conversion Rate"
          value={metrics.conversionRate}
          format="percent"
          icon={TrendingUp}
        />
        <MetricCard
          title="Total Leads"
          value={metrics.totalLeads}
          icon={Users}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatChart
          title="Lead Volume (30d)"
          data={[]}
          type="bar"
          description="New leads captured by day"
        />
        <StatChart
          title="Revenue Trend"
          data={[]}
          type="area"
          format="currency"
          description="MRR over time"
        />
      </div>
    </>
  );
}
