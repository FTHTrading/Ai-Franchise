import { auth } from '@clerk/nextjs/server';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  EmptyState,
} from '@aaos/ui';
import { TrendingUp, Calendar, MessageSquare, CheckCircle } from 'lucide-react';

const API_BASE = process.env.API_URL ?? 'http://localhost:3001';

async function buildHeaders(userId: string) {
  const ctx = { userId, orgId: null, sessionClaims: null };
  return {
    'Content-Type': 'application/json',
    'x-auth-context': Buffer.from(JSON.stringify(ctx)).toString('base64'),
  };
}

async function getClientPortalData(userId: string) {
  try {
    const headers = await buildHeaders(userId);
    const [leadsRes, apptRes] = await Promise.all([
      fetch(`${API_BASE}/api/v1/leads?limit=50`, { headers, next: { revalidate: 0 } }),
      fetch(`${API_BASE}/api/v1/appointments?limit=10`, { headers, next: { revalidate: 0 } }),
    ]);
    const leads = leadsRes.ok ? ((await leadsRes.json()) as { data: Record<string, unknown>[] }).data : [];
    const appointments = apptRes.ok ? ((await apptRes.json()) as { appointments: Record<string, unknown>[] }).appointments : [];
    return { leads, appointments };
  } catch {
    return { leads: [], appointments: [] };
  }
}

export default async function PortalPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const { leads, appointments } = await getClientPortalData(userId);

  const stats = [
    { label: 'Total Leads', value: leads.length, icon: TrendingUp },
    {
      label: 'New Leads',
      value: leads.filter((l) => l.status === 'NEW').length,
      icon: TrendingUp,
    },
    { label: 'Booked', value: leads.filter((l) => l.status === 'BOOKED').length, icon: Calendar },
    { label: 'Won', value: leads.filter((l) => l.status === 'WON').length, icon: CheckCircle },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your Dashboard</h1>
        <p className="text-muted-foreground">Here&apos;s an overview of your leads and upcoming appointments.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upcoming Appointments */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Upcoming Appointments</h2>
        {appointments.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No appointments yet"
            description="Your booked appointments will appear here."
          />
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => (
              <Card key={String(appt.id)}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">{String(appt.title ?? 'Appointment')}</p>
                    <p className="text-sm text-muted-foreground">
                      {appt.scheduledAt ? new Date(String(appt.scheduledAt)).toLocaleString() : '—'}
                    </p>
                  </div>
                  <Badge variant="outline">{String(appt.status ?? 'SCHEDULED')}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent leads */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Leads</h2>
        {leads.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No leads yet"
            description="Leads assigned to your account will appear here."
          />
        ) : (
          <div className="space-y-2">
            {leads.slice(0, 10).map((lead) => (
              <Card key={String(lead.id)}>
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-sm">
                      {String(lead.firstName ?? '')} {String(lead.lastName ?? '')}
                    </p>
                    <p className="text-xs text-muted-foreground">{String(lead.phone ?? lead.email ?? '—')}</p>
                  </div>
                  <Badge>{String(lead.status)}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
