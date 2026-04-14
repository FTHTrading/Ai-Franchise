import type { WorkflowDefinition } from '@aaos/types';

// ─────────────────────────────────────────────
// Built-in workflow templates — installed into any client account
// ─────────────────────────────────────────────

export type WorkflowTemplateKey =
  | 'missed_call_textback'
  | 'new_lead_followup'
  | 'appointment_reminder_24h'
  | 'no_response_3day'
  | 'reactivation_30day'
  | 'intake_qualification'
  | 'review_request'
  | 'estimate_followup';

export interface WorkflowTemplate {
  key: WorkflowTemplateKey;
  title: string;
  description: string;
  category: string;
  niche?: string;
  estimatedROI?: string;
  definition: WorkflowDefinition;
  promptTemplateKey?: string;
  variableDefaults: Record<string, string>;
}

export const WORKFLOW_TEMPLATES: Record<WorkflowTemplateKey, WorkflowTemplate> = {
  missed_call_textback: {
    key: 'missed_call_textback',
    title: 'Missed Call Text-Back',
    description: 'Instantly texts a lead when you miss their call. Proven to recover 40-60% of missed calls.',
    category: 'MISSED_CALL_TEXTBACK',
    estimatedROI: 'Recovers 40-60% of missed calls',
    definition: {
      trigger: { type: 'MISSED_CALL', deduplicationKey: 'leadId-missedcall' },
      steps: [
        {
          id: 'step-1',
          type: 'WAIT_DELAY',
          label: 'Wait 30 seconds',
          config: {},
          delayMs: 30_000,
          onSuccess: 'step-2',
        },
        {
          id: 'step-2',
          type: 'GENERATE_AI_MESSAGE',
          label: 'Generate missed call text',
          config: { templateKey: 'missed_call_followup' },
          onSuccess: 'step-3',
          onFailure: 'step-3-fallback',
        },
        {
          id: 'step-3',
          type: 'SEND_SMS',
          label: 'Send text-back SMS',
          config: { useGeneratedMessage: true },
          onSuccess: 'step-4',
        },
        {
          id: 'step-3-fallback',
          type: 'SEND_SMS',
          label: 'Send fallback SMS',
          config: { message: 'Hi! We just missed your call. How can we help you today?' },
          onSuccess: 'step-4',
        },
        {
          id: 'step-4',
          type: 'UPDATE_STAGE',
          label: 'Mark as Contacted',
          config: { stage: 'Contacted' },
          onSuccess: 'step-5',
        },
        {
          id: 'step-5',
          type: 'NOTIFY_OPERATOR',
          label: 'Notify operator',
          config: { message: 'Missed call text-back sent to {{leadName}}' },
        },
      ],
    },
    variableDefaults: {},
  },

  new_lead_followup: {
    key: 'new_lead_followup',
    title: 'New Lead Follow-Up',
    description: 'AI-powered first response and follow-up sequence for new leads from any source.',
    category: 'LEAD_FOLLOWUP',
    estimatedROI: '3-5x faster first response',
    definition: {
      trigger: { type: 'NEW_LEAD' },
      steps: [
        {
          id: 'step-1',
          type: 'GENERATE_AI_MESSAGE',
          label: 'Generate first response',
          config: { templateKey: 'first_response' },
          onSuccess: 'step-2',
          onFailure: 'step-2-fallback',
        },
        {
          id: 'step-2',
          type: 'SEND_SMS',
          label: 'Send first SMS',
          config: { useGeneratedMessage: true },
          onSuccess: 'step-3',
        },
        {
          id: 'step-2-fallback',
          type: 'SEND_SMS',
          label: 'Send fallback SMS',
          config: { message: 'Hi {{leadName}}, thanks for reaching out! How can we help you?' },
          onSuccess: 'step-3',
        },
        {
          id: 'step-3',
          type: 'UPDATE_STAGE',
          label: 'Move to Contacted',
          config: { stage: 'Contacted' },
          onSuccess: 'step-4',
        },
        {
          id: 'step-4',
          type: 'CREATE_TASK',
          label: 'Create follow-up task for operator',
          config: {
            title: 'Follow up with {{leadName}}',
            priority: 'HIGH',
            dueInHours: 4,
          },
        },
      ],
    },
    variableDefaults: {},
  },

  appointment_reminder_24h: {
    key: 'appointment_reminder_24h',
    title: 'Appointment Reminder (24h)',
    description: 'Automatically reminds leads 24 hours before their appointment. Reduces no-shows by up to 50%.',
    category: 'APPOINTMENT_REMINDER',
    estimatedROI: 'Reduces no-shows by 40-50%',
    definition: {
      trigger: { type: 'APPOINTMENT_REMINDER', delay: -86_400_000 },
      steps: [
        {
          id: 'step-1',
          type: 'GENERATE_AI_MESSAGE',
          label: 'Generate reminder message',
          config: { templateKey: 'appointment_reminder' },
          onSuccess: 'step-2',
          onFailure: 'step-2-fallback',
        },
        {
          id: 'step-2',
          type: 'SEND_SMS',
          label: 'Send SMS reminder',
          config: { useGeneratedMessage: true },
          onSuccess: 'step-3',
        },
        {
          id: 'step-2-fallback',
          type: 'SEND_SMS',
          label: 'Send fallback reminder',
          config: {
            message: 'Reminder: You have an appointment tomorrow at {{appointmentTime}}. Reply CONFIRM to confirm or CANCEL to cancel.',
          },
          onSuccess: 'step-3',
        },
        {
          id: 'step-3',
          type: 'SEND_EMAIL',
          label: 'Send email confirmation',
          config: { templateKey: 'appointment_confirmation_email' },
        },
      ],
    },
    variableDefaults: {},
  },

  no_response_3day: {
    key: 'no_response_3day',
    title: 'No Response Follow-Up (3-Day)',
    description: 'Automatically follows up with leads who haven\'t responded after 3 days.',
    category: 'LEAD_FOLLOWUP',
    estimatedROI: 'Recovers 15-25% of cold leads',
    definition: {
      trigger: {
        type: 'NO_RESPONSE',
        delay: 259_200_000,
        deduplicationKey: 'leadId-noresponse-3d',
      },
      steps: [
        {
          id: 'step-1',
          type: 'GENERATE_AI_MESSAGE',
          label: 'Generate follow-up message',
          config: { templateKey: 'qualification', followUpRound: 1 },
          onSuccess: 'step-2',
          onFailure: 'step-2-fallback',
        },
        {
          id: 'step-2',
          type: 'SEND_SMS',
          label: 'Send follow-up SMS',
          config: { useGeneratedMessage: true },
          onSuccess: 'step-3',
        },
        {
          id: 'step-2-fallback',
          type: 'SEND_SMS',
          label: 'Send fallback follow-up',
          config: { message: 'Hi {{leadName}}, just checking in. Still interested in learning more?' },
          onSuccess: 'step-3',
        },
        {
          id: 'step-3',
          type: 'NOTIFY_OPERATOR',
          label: 'Flag for human review',
          config: { message: '{{leadName}} has not responded in 3 days. Manual follow-up may be needed.' },
        },
      ],
    },
    variableDefaults: {},
  },

  reactivation_30day: {
    key: 'reactivation_30day',
    title: '30-Day Reactivation',
    description: 'Re-engages leads that went cold after 30 days of no activity.',
    category: 'REACTIVATION',
    estimatedROI: 'Converts 5-15% of cold leads',
    definition: {
      trigger: {
        type: 'NO_RESPONSE',
        delay: 2_592_000_000,
        deduplicationKey: 'leadId-reactivation-30d',
        filters: { stages: ['Contacted', 'Qualified'] },
      },
      steps: [
        {
          id: 'step-1',
          type: 'GENERATE_AI_MESSAGE',
          label: 'Generate reactivation message',
          config: { templateKey: 'reactivation' },
          onSuccess: 'step-2',
          onFailure: 'step-2-fallback',
        },
        {
          id: 'step-2',
          type: 'SEND_SMS',
          label: 'Send reactivation SMS',
          config: { useGeneratedMessage: true },
          onSuccess: 'step-3',
        },
        {
          id: 'step-2-fallback',
          type: 'SEND_SMS',
          label: 'Fallback reactivation',
          config: { message: 'Hey {{leadName}}! We have some availability coming up. Would you still like to connect?' },
          onSuccess: 'step-3',
        },
        {
          id: 'step-3',
          type: 'ADD_TAG',
          label: 'Tag as reactivation attempt',
          config: { tag: 'reactivation-attempt' },
          onSuccess: 'step-4',
        },
        {
          id: 'step-4',
          type: 'NOTIFY_OPERATOR',
          label: 'Notify operator of reactivation',
          config: { message: 'Reactivation message sent to {{leadName}} (30-day cold lead)' },
        },
      ],
    },
    variableDefaults: {},
  },

  intake_qualification: {
    key: 'intake_qualification',
    title: 'Intake Qualification',
    description: 'Runs a short SMS qualification sequence to determine if a new lead is a good fit.',
    category: 'INTAKE_QUALIFICATION',
    definition: {
      trigger: { type: 'NEW_LEAD', filters: { requireQualification: true } },
      steps: [
        {
          id: 'step-1',
          type: 'GENERATE_AI_MESSAGE',
          label: 'Ask first qualification question',
          config: { templateKey: 'qualification', questionIndex: 0 },
          onSuccess: 'step-2',
        },
        {
          id: 'step-2',
          type: 'SEND_SMS',
          label: 'Send qualification SMS',
          config: { useGeneratedMessage: true },
          onSuccess: 'step-3',
        },
        {
          id: 'step-3',
          type: 'UPDATE_STAGE',
          label: 'Move to Qualification',
          config: { stage: 'Contacted' },
          onSuccess: 'step-4',
        },
        {
          id: 'step-4',
          type: 'CREATE_TASK',
          label: 'Review qualification responses',
          config: {
            title: 'Review qualification for {{leadName}}',
            priority: 'MEDIUM',
            dueInHours: 24,
          },
        },
      ],
    },
    variableDefaults: {},
  },

  review_request: {
    key: 'review_request',
    title: 'Review Request',
    description: 'Automatically asks satisfied customers to leave a Google review after service completion.',
    category: 'REVIEW_REQUEST',
    estimatedROI: '3-5x more reviews per month',
    definition: {
      trigger: {
        type: 'STATUS_CHANGED',
        filters: { toStage: 'Won' },
        delay: 86_400_000,
      },
      steps: [
        {
          id: 'step-1',
          type: 'GENERATE_AI_MESSAGE',
          label: 'Generate review request',
          config: { templateKey: 'review_request' },
          onSuccess: 'step-2',
          onFailure: 'step-2-fallback',
        },
        {
          id: 'step-2',
          type: 'SEND_SMS',
          label: 'Send review request SMS',
          config: { useGeneratedMessage: true },
          onSuccess: 'step-3',
        },
        {
          id: 'step-2-fallback',
          type: 'SEND_SMS',
          label: 'Fallback review request',
          config: { message: 'Thanks for choosing us, {{leadName}}! Would you mind leaving us a quick review? It really helps: {{reviewLink}}' },
          onSuccess: 'step-3',
        },
        {
          id: 'step-3',
          type: 'ADD_TAG',
          label: 'Tag as review requested',
          config: { tag: 'review-requested' },
        },
      ],
    },
    variableDefaults: { reviewLink: 'https://g.page/r/your-business/review' },
  },

  estimate_followup: {
    key: 'estimate_followup',
    title: 'Estimate Follow-Up',
    description: 'Follows up after sending an estimate — recovers deals that go quiet after quoting.',
    category: 'ESTIMATE_FOLLOWUP',
    estimatedROI: 'Closes 20-35% more estimates',
    definition: {
      trigger: {
        type: 'STATUS_CHANGED',
        filters: { toStage: 'Qualified' },
        delay: 172_800_000,
        deduplicationKey: 'leadId-estimate-followup',
      },
      steps: [
        {
          id: 'step-1',
          type: 'SEND_SMS',
          label: 'Send estimate follow-up',
          config: {
            message: 'Hi {{leadName}}, just following up on the estimate we sent. Any questions I can answer for you?',
          },
          onSuccess: 'step-2',
        },
        {
          id: 'step-2',
          type: 'WAIT_DELAY',
          label: 'Wait 3 days',
          config: {},
          delayMs: 259_200_000,
          onSuccess: 'step-3',
        },
        {
          id: 'step-3',
          type: 'NOTIFY_OPERATOR',
          label: 'Flag for personal follow-up',
          config: { message: '{{leadName}} has not responded to estimate follow-up. Consider a personal call.' },
        },
      ],
    },
    variableDefaults: {},
  },
};
