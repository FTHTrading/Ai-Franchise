export { getServerEnv } from './server';
export { getClientEnv } from './client';
export type { ServerEnv } from './server';
export type { ClientEnv } from './client';

// Pipeline stage defaults
export const DEFAULT_PIPELINE_STAGES = [
  { id: 'new', name: 'New', color: '#6366f1', order: 0 },
  { id: 'contacted', name: 'Contacted', color: '#8b5cf6', order: 1 },
  { id: 'qualified', name: 'Qualified', color: '#06b6d4', order: 2 },
  { id: 'booked', name: 'Booked', color: '#10b981', order: 3 },
  { id: 'won', name: 'Won', color: '#22c55e', order: 4, isTerminal: true },
  { id: 'lost', name: 'Lost', color: '#ef4444', order: 5, isTerminal: true },
] as const;

// Supported niches
export const SUPPORTED_NICHES = [
  'med_spa',
  'law_firm',
  'roofing',
  'dental',
  'real_estate',
  'hvac',
  'plumbing',
  'auto_repair',
  'insurance',
  'financial_services',
  'fitness',
  'chiropractic',
  'landscaping',
  'home_services',
  'general',
] as const;

export type Niche = (typeof SUPPORTED_NICHES)[number];

// Pricing plans config
export const PRICING_PLANS = [
  {
    id: 'starter',
    name: 'Starter' as const,
    monthlyPrice: 297,
    annualPrice: 2970,
    features: [
      'Up to 3 client accounts',
      '500 SMS/month',
      '2,000 emails/month',
      '1,000 AI queries/month',
      '5 team members',
      '10 workflows',
      'Basic analytics',
      'Email support',
    ],
    limits: {
      leads: 1000,
      smsPerMonth: 500,
      emailsPerMonth: 2000,
      aiQueriesPerMonth: 1000,
      teamMembers: 5,
      clientAccounts: 3,
      workflows: 10,
    },
  },
  {
    id: 'growth',
    name: 'Growth' as const,
    monthlyPrice: 697,
    annualPrice: 6970,
    features: [
      'Up to 10 client accounts',
      '2,500 SMS/month',
      '10,000 emails/month',
      '5,000 AI queries/month',
      '15 team members',
      'Unlimited workflows',
      'Advanced analytics',
      'White-label branding',
      'Priority support',
    ],
    limits: {
      leads: 10000,
      smsPerMonth: 2500,
      emailsPerMonth: 10000,
      aiQueriesPerMonth: 5000,
      teamMembers: 15,
      clientAccounts: 10,
      workflows: -1, // unlimited
    },
  },
  {
    id: 'professional',
    name: 'Professional' as const,
    monthlyPrice: 1497,
    annualPrice: 14970,
    features: [
      'Unlimited client accounts',
      '10,000 SMS/month',
      'Unlimited emails',
      'Unlimited AI queries',
      'Unlimited team members',
      'Unlimited workflows',
      'Custom domain',
      'API access',
      'Dedicated onboarding',
      'SLA support',
    ],
    limits: {
      leads: -1,
      smsPerMonth: 10000,
      emailsPerMonth: -1,
      aiQueriesPerMonth: -1,
      teamMembers: -1,
      clientAccounts: -1,
      workflows: -1,
    },
  },
] as const;
