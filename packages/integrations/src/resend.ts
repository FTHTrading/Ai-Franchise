import { Resend } from 'resend';
import type { SendEmailResult } from './types';

// ─────────────────────────────────────────────
// ResendService — transactional email sending
// ─────────────────────────────────────────────

export interface ResendConfig {
  apiKey: string;
  defaultFrom?: string;   // e.g. "Agency Name <noreply@domain.com>"
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: Buffer | string }>;
  tags?: Array<{ name: string; value: string }>;
}

export class ResendService {
  private client: Resend;
  private defaultFrom: string;

  constructor(config: ResendConfig) {
    this.client = new Resend(config.apiKey);
    this.defaultFrom = config.defaultFrom ?? 'AAOS <noreply@aaos.app>';
  }

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    try {
      const result = await this.client.emails.send({
        from: params.from ?? this.defaultFrom,
        to: Array.isArray(params.to) ? params.to : [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
        reply_to: params.replyTo,
        tags: params.tags,
      });

      if (result.error) {
        return { success: false, error: result.error.message };
      }

      return { success: true, externalId: result.data?.id };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  // ─── Template-based emails ──────────────────

  async sendLeadNotification(params: {
    to: string;
    agencyName: string;
    leadName: string;
    leadPhone?: string;
    leadEmail?: string;
    source: string;
    dashboardUrl: string;
  }): Promise<SendEmailResult> {
    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <h2 style="color: #6366f1;">New Lead — ${params.leadName}</h2>
  <p>A new lead just came in for <strong>${params.agencyName}</strong>:</p>
  <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
    <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Name</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${params.leadName}</td></tr>
    ${params.leadPhone ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Phone</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${params.leadPhone}</td></tr>` : ''}
    ${params.leadEmail ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">Email</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${params.leadEmail}</td></tr>` : ''}
    <tr><td style="padding: 8px; font-weight: 600;">Source</td><td style="padding: 8px;">${params.source}</td></tr>
  </table>
  <a href="${params.dashboardUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 8px;">View Lead →</a>
  <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">AAOS · AI Automation Agency OS</p>
</body>
</html>`;

    return this.sendEmail({
      to: params.to,
      subject: `New lead: ${params.leadName}`,
      html,
    });
  }

  async sendWelcomeEmail(params: {
    to: string;
    firstName: string;
    organizationName: string;
    loginUrl: string;
  }): Promise<SendEmailResult> {
    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <h1 style="color: #6366f1;">Welcome to ${params.organizationName}</h1>
  <p>Hi ${params.firstName},</p>
  <p>Your account is ready. You can log in and start managing your leads, conversations, and automations right away.</p>
  <a href="${params.loginUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">Log In →</a>
  <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">Powered by ${params.organizationName}</p>
</body>
</html>`;

    return this.sendEmail({
      to: params.to,
      subject: `Welcome to ${params.organizationName}`,
      html,
    });
  }

  async sendAppointmentConfirmation(params: {
    to: string;
    leadName: string;
    businessName: string;
    appointmentDate: string;
    appointmentTime: string;
    location: string;
    cancelUrl?: string;
  }): Promise<SendEmailResult> {
    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <h2 style="color: #10b981;">Appointment Confirmed ✓</h2>
  <p>Hi ${params.leadName},</p>
  <p>Your appointment with <strong>${params.businessName}</strong> is confirmed.</p>
  <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0;">
    <p style="margin: 4px 0;"><strong>Date:</strong> ${params.appointmentDate}</p>
    <p style="margin: 4px 0;"><strong>Time:</strong> ${params.appointmentTime}</p>
    <p style="margin: 4px 0;"><strong>Location:</strong> ${params.location}</p>
  </div>
  ${params.cancelUrl ? `<p><a href="${params.cancelUrl}" style="color: #ef4444;">Need to cancel or reschedule?</a></p>` : ''}
  <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">Powered by ${params.businessName}</p>
</body>
</html>`;

    return this.sendEmail({
      to: params.to,
      subject: `Appointment confirmed — ${params.appointmentDate} at ${params.appointmentTime}`,
      html,
    });
  }
}
