import { Queue, Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '@aaos/config';

// ── Redis connection ──────────────────────────────────────────────────────

export const redis = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

// ── Queue names ───────────────────────────────────────────────────────────

export const QUEUES = {
  WORKFLOW: 'workflow',
  AI_REPLY: 'ai-reply',
  LEAD_SCORE: 'lead-score',
  APPOINTMENT_REMINDER: 'appointment-reminder',
  EMAIL_SEND: 'email-send',
} as const;

// ── Queue instances ───────────────────────────────────────────────────────

export const workflowQueue = new Queue(QUEUES.WORKFLOW, { connection: redis });
export const aiReplyQueue = new Queue(QUEUES.AI_REPLY, { connection: redis });
export const leadScoreQueue = new Queue(QUEUES.LEAD_SCORE, { connection: redis });
export const appointmentReminderQueue = new Queue(QUEUES.APPOINTMENT_REMINDER, { connection: redis });
export const emailQueue = new Queue(QUEUES.EMAIL_SEND, { connection: redis });

// ── Job payload types ─────────────────────────────────────────────────────

export interface WorkflowJobPayload {
  workflowInstanceId: string;
  leadId: string;
  organizationId: string;
  triggerEvent: string;
  triggerData?: Record<string, unknown>;
}

export interface AiReplyJobPayload {
  conversationId: string;
  lastMessageContent: string;
  leadId: string;
  organizationId: string;
}

export interface LeadScoreJobPayload {
  leadId: string;
  organizationId: string;
}

export interface AppointmentReminderJobPayload {
  appointmentId: string;
  leadId: string;
  organizationId: string;
  reminderType: '24h' | '1h';
}

export interface EmailJobPayload {
  to: string;
  subject: string;
  html: string;
  from?: string;
  organizationId: string;
}
