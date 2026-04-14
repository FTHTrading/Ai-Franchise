import * as React from 'react';
import { Badge } from './badge';

type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'BOOKED' | 'WON' | 'LOST' | 'UNSUBSCRIBED';

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  BOOKED: 'Booked',
  WON: 'Won',
  LOST: 'Lost',
  UNSUBSCRIBED: 'Unsubscribed',
};

const STATUS_VARIANTS: Record<LeadStatus, 'new' | 'contacted' | 'qualified' | 'booked' | 'won' | 'lost' | 'outline'> = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  BOOKED: 'booked',
  WON: 'won',
  LOST: 'lost',
  UNSUBSCRIBED: 'outline',
};

interface LeadStatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

export function LeadStatusBadge({ status, className }: LeadStatusBadgeProps) {
  return (
    <Badge className={className} variant={STATUS_VARIANTS[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
