import * as React from 'react';
import { type LeadStatus } from '@aaos/types';
import { Badge } from './badge';

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  BOOKED: 'Booked',
  WON: 'Won',
  LOST: 'Lost',
  UNRESPONSIVE: 'Unresponsive',
};

const STATUS_VARIANTS: Record<LeadStatus, 'new' | 'contacted' | 'qualified' | 'booked' | 'won' | 'lost' | 'outline'> = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  BOOKED: 'booked',
  WON: 'won',
  LOST: 'lost',
  UNRESPONSIVE: 'outline',
};

interface LeadStatusBadgeProps {
  status: LeadStatus;
}

export function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  return <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>;
}
