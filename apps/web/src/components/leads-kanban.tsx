'use client';

import type { Lead, LeadStatus } from '@aaos/types';
import { LeadStatusBadge, Card, CardContent } from '@aaos/ui';
import { Phone, Mail } from 'lucide-react';

const COLUMNS: { status: LeadStatus; label: string }[] = [
  { status: 'NEW', label: 'New' },
  { status: 'CONTACTED', label: 'Contacted' },
  { status: 'QUALIFIED', label: 'Qualified' },
  { status: 'BOOKED', label: 'Booked' },
  { status: 'WON', label: 'Won' },
  { status: 'LOST', label: 'Lost' },
];

function LeadCard({ lead }: { lead: Lead }) {
  const leadScore = typeof lead.customFields?.leadScore === 'number' ? lead.customFields.leadScore : null;

  return (
    <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-sm leading-tight">
            {lead.firstName} {lead.lastName}
          </p>
          <LeadStatusBadge status={lead.status} className="text-[10px]" />
        </div>
        <div className="space-y-1">
          {lead.phone && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              {lead.phone}
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              {lead.email}
            </div>
          )}
        </div>
        {leadScore !== null && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Score:</span>
            <span>{leadScore}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function LeadsKanban({
  leads,
}: {
  leads: Lead[];
  clientId: string;
}) {
  const byStatus = COLUMNS.reduce<Record<string, Lead[]>>((acc, col) => {
    acc[col.status] = leads.filter((l) => l.status === col.status);
    return acc;
  }, {});

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const colLeads = byStatus[col.status] ?? [];
        return (
          <div
            key={col.status}
            className="flex-shrink-0 w-64"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <LeadStatusBadge status={col.status} />
                <span className="text-xs text-muted-foreground font-medium">
                  {colLeads.length}
                </span>
              </div>
            </div>
            <div className="space-y-2 min-h-[100px] rounded-lg bg-muted/30 p-2">
              {colLeads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} />
              ))}
              {colLeads.length === 0 && (
                <div className="flex items-center justify-center h-16 text-xs text-muted-foreground">
                  No leads
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
