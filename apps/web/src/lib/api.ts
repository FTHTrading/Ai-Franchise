import { auth } from '@clerk/nextjs/server';
import type {
  AgencyMetrics,
  ClientAccount,
  Conversation,
  Lead,
  WorkflowInstance,
  BillingAccount,
  PaginatedResponse,
} from '@aaos/types';

const API_BASE = process.env.API_URL ?? 'http://localhost:3001';

async function buildHeaders(): Promise<HeadersInit> {
  const { userId, orgId, sessionClaims } = await auth();
  const ctx = { userId, orgId, sessionClaims };
  const encoded = Buffer.from(JSON.stringify(ctx)).toString('base64');
  return {
    'Content-Type': 'application/json',
    'x-auth-context': encoded,
  };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}/api/v1${path}`;
  const headers = await buildHeaders();
  const res = await fetch(url, {
    ...init,
    headers: { ...headers, ...(init?.headers ?? {}) },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ── Agency metrics ──────────────────────────────────────────────────────────

export async function getAgencyMetrics(
  orgId: string,
  options: { from?: Date; to?: Date } = {},
): Promise<AgencyMetrics> {
  const params = new URLSearchParams();
  if (options.from) params.set('from', options.from.toISOString());
  if (options.to) params.set('to', options.to.toISOString());
  const qs = params.toString() ? `?${params}` : '';
  return apiFetch<AgencyMetrics>(`/analytics/agency${qs}`);
}

// ── Client accounts ──────────────────────────────────────────────────────────

export interface ClientAccountsQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export async function getClientAccounts(
  _orgId: string,
  options: ClientAccountsQuery = {},
): Promise<PaginatedResponse<ClientAccount>> {
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.limit) params.set('limit', String(options.limit));
  if (options.search) params.set('search', options.search);
  const qs = params.toString() ? `?${params}` : '';
  return apiFetch<PaginatedResponse<ClientAccount>>(`/client-accounts${qs}`);
}

export async function getClientAccount(id: string): Promise<ClientAccount> {
  return apiFetch<ClientAccount>(`/client-accounts/${id}`);
}

// ── Leads ────────────────────────────────────────────────────────────────────

export interface LeadsQuery {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export async function getLeads(
  clientAccountId: string,
  options: LeadsQuery = {},
): Promise<PaginatedResponse<Lead>> {
  const params = new URLSearchParams({ clientAccountId });
  if (options.page) params.set('page', String(options.page));
  if (options.limit) params.set('limit', String(options.limit));
  if (options.status) params.set('status', options.status);
  if (options.search) params.set('search', options.search);
  return apiFetch<PaginatedResponse<Lead>>(`/leads?${params}`);
}

export async function getLead(id: string): Promise<Lead> {
  return apiFetch<Lead>(`/leads/${id}`);
}

// ── Conversations ────────────────────────────────────────────────────────────

export async function getConversations(
  _orgId: string,
  options: { clientAccountId?: string } = {},
): Promise<{ conversations: Conversation[]; total: number }> {
  const params = new URLSearchParams();
  if (options.clientAccountId) params.set('clientAccountId', options.clientAccountId);
  const qs = params.toString() ? `?${params}` : '';
  return apiFetch<{ conversations: Conversation[]; total: number }>(`/conversations${qs}`);
}

export async function getConversation(id: string): Promise<Conversation> {
  return apiFetch<Conversation>(`/conversations/${id}`);
}

// ── Workflows ────────────────────────────────────────────────────────────────

export async function getWorkflows(
  _orgId: string,
): Promise<{ workflows: WorkflowInstance[] }> {
  return apiFetch<{ workflows: WorkflowInstance[] }>('/workflows');
}

export async function getWorkflowTemplates(): Promise<{ templates: unknown[] }> {
  return apiFetch<{ templates: unknown[] }>('/workflows/templates');
}

// ── Billing ──────────────────────────────────────────────────────────────────

export async function getBillingInfo(
  _orgId: string,
): Promise<{ account: BillingAccount; subscription: unknown }> {
  return apiFetch<{ account: BillingAccount; subscription: unknown }>('/billing');
}

export async function createCheckoutSession(
  priceId: string,
): Promise<{ url: string }> {
  return apiFetch<{ url: string }>('/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({ priceId }),
  });
}

export async function createPortalSession(): Promise<{ url: string }> {
  return apiFetch<{ url: string }>('/billing/portal', { method: 'POST' });
}

// ── Onboarding ───────────────────────────────────────────────────────────────

export async function getOnboardingState(
  _orgId: string,
): Promise<{ state: unknown }> {
  return apiFetch<{ state: unknown }>('/onboarding');
}
