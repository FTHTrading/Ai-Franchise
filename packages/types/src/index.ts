// ─────────────────────────────────────────────
// AAOS Shared Types
// ─────────────────────────────────────────────

export type ID = string;

// ─── Auth / RBAC ───────────────────────────

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ORGANIZATION_OWNER'
  | 'ORGANIZATION_ADMIN'
  | 'OPERATOR'
  | 'CLIENT_ADMIN'
  | 'CLIENT_USER';

export interface AuthContext {
  userId: string;
  organizationId?: string;
  clientAccountId?: string;
  role: UserRole;
  permissions: Permission[];
}

export type Permission =
  | 'team:invite'
  | 'leads:read'
  | 'leads:write'
  | 'leads:delete'
  | 'conversations:read'
  | 'conversations:write'
  | 'workflows:read'
  | 'workflows:write'
  | 'workflows:create'
  | 'workflows:delete'
  | 'workflows:publish'
  | 'clients:read'
  | 'clients:write'
  | 'clients:delete'
  | 'billing:read'
  | 'billing:write'
  | 'analytics:read'
  | 'settings:read'
  | 'settings:write'
  | 'templates:read'
  | 'templates:write'
  | 'admin:all';

// ─── Lead ──────────────────────────────────

export const LeadStatus = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  QUALIFIED: 'QUALIFIED',
  BOOKED: 'BOOKED',
  WON: 'WON',
  LOST: 'LOST',
  UNSUBSCRIBED: 'UNSUBSCRIBED',
} as const;

export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];
export type LeadSource =
  | 'WEBSITE_FORM'
  | 'LANDING_PAGE'
  | 'MANUAL'
  | 'IMPORT'
  | 'REFERRAL'
  | 'GOOGLE_ADS'
  | 'FACEBOOK_ADS'
  | 'MISSED_CALL'
  | 'SMS_INBOUND'
  | 'OTHER';

export interface Lead {
  id: ID;
  organizationId: ID;
  clientAccountId: ID;
  assignedUserId?: ID;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  status: LeadStatus;
  source: LeadSource;
  stage: string;
  value?: number;
  optedOut: boolean;
  lastContactAt?: Date;
  nextFollowUpAt?: Date;
  customFields: Record<string, unknown>;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientAccount {
  id: ID;
  organizationId: ID;
  name: string;
  slug: string;
  businessType?: string;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadCreateInput {
  clientAccountId: ID;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  source?: LeadSource;
  sourceDetail?: string;
  value?: number;
  customFields?: Record<string, unknown>;
}

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  order: number;
  isTerminal?: boolean;
}

// ─── Conversation / Message ────────────────

export type MessageChannel = 'SMS' | 'EMAIL' | 'CHAT' | 'VOICE';
export type MessageDirection = 'INBOUND' | 'OUTBOUND';
export type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'READ' | 'OPTED_OUT';

export interface Message {
  id: ID;
  conversationId: ID;
  direction: MessageDirection;
  channel: MessageChannel;
  status: MessageStatus;
  body: string;
  subject?: string;
  mediaUrls?: string[];
  isAiGenerated: boolean;
  createdAt: Date;
}

// ─── Workflow ──────────────────────────────

export const WorkflowStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type WorkflowStatus = (typeof WorkflowStatus)[keyof typeof WorkflowStatus];

export type WorkflowTriggerType =
  | 'NEW_LEAD'
  | 'FORM_SUBMITTED'
  | 'MISSED_CALL'
  | 'INBOUND_SMS'
  | 'NO_RESPONSE'
  | 'APPOINTMENT_REMINDER'
  | 'STATUS_CHANGED'
  | 'TAG_ADDED'
  | 'MANUAL'
  | 'SCHEDULED'
  | 'WEBHOOK';

export type WorkflowActionType =
  | 'SEND_SMS'
  | 'SEND_EMAIL'
  | 'GENERATE_AI_MESSAGE'
  | 'ASSIGN_LEAD'
  | 'UPDATE_STAGE'
  | 'ADD_TAG'
  | 'REMOVE_TAG'
  | 'CREATE_TASK'
  | 'CALL_WEBHOOK'
  | 'WAIT_DELAY'
  | 'NOTIFY_OPERATOR'
  | 'BOOK_APPOINTMENT'
  | 'UPDATE_FIELD'
  | 'BRANCH_CONDITION';

export interface WorkflowStep {
  id: string;
  type: WorkflowActionType;
  label: string;
  config: Record<string, unknown>;
  onSuccess?: string;   // next step id
  onFailure?: string;   // fallback step id
  retries?: number;
  delayMs?: number;
}

export interface WorkflowTriggerConfig {
  type: WorkflowTriggerType;
  filters?: Record<string, unknown>;
  delay?: number;         // ms delay after trigger before execution
  deduplicationKey?: string;
}

export interface WorkflowDefinition {
  trigger: WorkflowTriggerConfig;
  steps: WorkflowStep[];
  settings?: {
    maxExecutions?: number;
    cooldownMs?: number;
    activeHours?: { start: string; end: string; timezone: string };
    stopOnOptOut?: boolean;
  };
}

export interface WorkflowInstance {
  id: ID;
  organizationId: ID;
  clientAccountId?: ID;
  templateId?: ID;
  name: string;
  description?: string;
  status: WorkflowStatus;
  triggerType: WorkflowTriggerType;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  id: ID;
  organizationId: ID;
  clientAccountId: ID;
  leadId?: ID;
  channelId?: ID;
  channel: MessageChannel;
  isOpen: boolean;
  isRead: boolean;
  lastMessageAt?: Date;
  aiEnabled: boolean;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  lead?: Pick<Lead, 'id' | 'firstName' | 'lastName' | 'phone' | 'email' | 'status'>;
  messages?: Message[];
}

// ─── AI ────────────────────────────────────

export type AIProvider = 'openai' | 'anthropic' | 'local';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  text: string;
  provider: AIProvider;
  model: string;
  tokensUsed?: number;
  confidence?: number;
  escalate?: boolean;  // true if AI wants human to take over
}

export interface PromptTemplate {
  id: string;
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: string[];
  maxTokens?: number;
  temperature?: number;
}

// ─── Billing ───────────────────────────────

export type SubscriptionTier = 'STARTER' | 'GROWTH' | 'PROFESSIONAL' | 'ENTERPRISE';
export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'UNPAID' | 'PAUSED';

export interface BillingAccount {
  id: ID;
  organizationId: ID;
  stripeId?: string;
  email?: string;
  name?: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PricingPlan {
  id: string;
  name: SubscriptionTier;
  stripePriceId: string;
  monthlyPrice: number;
  annualPrice?: number;
  features: string[];
  limits: {
    leads: number;
    smsPerMonth: number;
    emailsPerMonth: number;
    aiQueriesPerMonth: number;
    teamMembers: number;
    clientAccounts: number;
    workflows: number;
  };
}

// ─── Analytics ─────────────────────────────

export interface AgencyMetrics {
  mrr: number;
  activeClients: number;
  totalLeads: number;
  newLeadsThisPeriod: number;
  conversionRate: number;
  bookedAppointments: number;
  messageVolume: number;
  workflowExecutions: number;
  failedExecutions: number;
}

export interface ClientMetrics {
  newLeads: number;
  bookedAppointments: number;
  activeConversations: number;
  avgResponseTime: number;
  leadsByStage: Record<string, number>;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  entityId?: string;
  entityType?: string;
  timestamp: Date;
}

// ─── Pagination / Responses ────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    correlationId?: string;
    timestamp: string;
  };
}

// ─── Onboarding ────────────────────────────

export type OnboardingStep =
  | 'brand'
  | 'channel'
  | 'template'
  | 'client'
  | 'team'
  | 'complete';

export interface OnboardingState {
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  isComplete: boolean;
}

// ─── Template Library ──────────────────────

export type TemplateCategory =
  | 'MISSED_CALL_TEXTBACK'
  | 'LEAD_FOLLOWUP'
  | 'APPOINTMENT_REMINDER'
  | 'REACTIVATION'
  | 'FAQ_ASSISTANT'
  | 'INTAKE_QUALIFICATION'
  | 'ESTIMATE_FOLLOWUP'
  | 'REVIEW_REQUEST'
  | 'WELCOME_SEQUENCE'
  | 'NURTURE_SEQUENCE'
  | 'CUSTOM';

export interface TemplateVariable {
  key: string;
  label: string;
  defaultValue?: string;
  required: boolean;
  description?: string;
}

// ─── Re-exports for convenience ────────────

export type Maybe<T> = T | null | undefined;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
