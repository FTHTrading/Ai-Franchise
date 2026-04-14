import { Worker, type Job } from 'bullmq';
import { redis, QUEUES, type AppointmentReminderJobPayload } from '../queues';
import { db } from '@aaos/db';
import { TelnyxService } from '@aaos/integrations';
import { getServerEnv } from '@aaos/config';

const env = getServerEnv();

export function createAppointmentReminderWorker() {
  return new Worker<AppointmentReminderJobPayload>(
    QUEUES.APPOINTMENT_REMINDER,
    async (job: Job<AppointmentReminderJobPayload>) => {
      const { appointmentId, leadId, organizationId, reminderType } = job.data;

      console.log(
        `[appt-reminder-worker] Sending ${reminderType} reminder for appointment ${appointmentId}`,
      );

      const appt = await db.appointment.findUnique({
        where: { id: appointmentId },
        include: { lead: true },
      });

      if (!appt) {
        console.warn(`[appt-reminder-worker] Appointment ${appointmentId} not found`);
        return;
      }

      if (appt.status === 'CANCELLED' || appt.status === 'NO_SHOW') {
        console.info(`[appt-reminder-worker] Appointment ${appointmentId} is ${appt.status} — skipping reminder`);
        return;
      }

      const lead = appt.lead;
      if (!lead?.phone) {
        console.warn(`[appt-reminder-worker] Lead has no phone for appointment ${appointmentId}`);
        return;
      }

      const timeLabel = reminderType === '24h' ? 'tomorrow' : 'in 1 hour';
      const message =
        `Hi ${lead.firstName}! Just a reminder that you have an appointment ${timeLabel} — ` +
        `${appt.title ?? 'your appointment'} at ${new Date(appt.startAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}. ` +
        `Reply CONFIRM to confirm or CANCEL to cancel.`;

      // Find org's SMS channel
      const channelRecord = await db.communicationChannel.findFirst({
        where: { organizationId, isActive: true, channel: 'SMS' },
      });

      if (!channelRecord?.identifier) {
        console.warn(`[appt-reminder-worker] No active SMS channel for org ${organizationId}`);
        return;
      }

      const telnyx = new TelnyxService({ apiKey: env.TELNYX_API_KEY });
      await telnyx.sendSms({ from: channelRecord.identifier, to: lead.phone, body: message });

      // Find or create conversation and log the message
      let conversation = await db.conversation.findFirst({
        where: { leadId: lead.id, organizationId },
      });

      if (!conversation) {
        conversation = await db.conversation.create({
          data: {
            leadId: lead.id,
            organizationId,
            clientAccountId: lead.clientAccountId,
            channelId: channelRecord.id,
            channel: 'SMS',
          },
        });
      }

      await db.message.create({
        data: {
          conversationId: conversation.id,
          body: message,
          direction: 'OUTBOUND',
          channel: 'SMS',
          isAiGenerated: true,
          status: 'SENT',
        },
      });

      console.log(`[appt-reminder-worker] Sent ${reminderType} reminder for appointment ${appointmentId}`);
    },
    {
      connection: redis,
      concurrency: 10,
    },
  );
}
