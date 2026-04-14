import type { SendSmsResult } from './types';

// ─────────────────────────────────────────────
// TelnyxService — SMS sending, phone number management, webhook verification
// ─────────────────────────────────────────────

export interface TelnyxConfig {
  apiKey: string;
  webhookSecret?: string;
  defaultFromNumber?: string;
}

export interface SendSmsParams {
  to: string;
  body: string;
  from?: string;
  mediaUrls?: string[];
  webhookUrl?: string;
  clientState?: string;   // arbitrary string passed back in webhooks
}

export class TelnyxService {
  private apiKey: string;
  private webhookSecret?: string;
  private defaultFrom?: string;
  private baseUrl = 'https://api.telnyx.com/v2';

  constructor(config: TelnyxConfig) {
    this.apiKey = config.apiKey;
    this.webhookSecret = config.webhookSecret;
    this.defaultFrom = config.defaultFromNumber;
  }

  // ─── SMS ────────────────────────────────────

  async sendSms(params: SendSmsParams): Promise<SendSmsResult> {
    const from = params.from ?? this.defaultFrom;
    if (!from) {
      throw new Error('No from number specified for SMS');
    }

    const body: Record<string, unknown> = {
      from,
      to: params.to,
      text: params.body,
    };

    if (params.mediaUrls?.length) {
      body.media_urls = params.mediaUrls;
    }
    if (params.webhookUrl) {
      body.webhook_url = params.webhookUrl;
    }
    if (params.clientState) {
      body.client_state = Buffer.from(params.clientState).toString('base64');
    }

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({})) as { errors?: Array<{ detail: string }> };
        const detail = err.errors?.[0]?.detail ?? `HTTP ${response.status}`;
        return { success: false, error: detail };
      }

      const data = await response.json() as { data: { id: string } };
      return { success: true, externalId: data.data.id };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  // ─── Phone numbers ──────────────────────────

  async listPhoneNumbers(): Promise<Array<{ id: string; number: string; status: string }>> {
    const response = await fetch(`${this.baseUrl}/phone_numbers`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });

    if (!response.ok) {
      throw new Error(`Telnyx list numbers failed: ${response.status}`);
    }

    const data = await response.json() as { data: Array<{ id: string; phone_number: string; status: string }> };
    return data.data.map((n) => ({
      id: n.id,
      number: n.phone_number,
      status: n.status,
    }));
  }

  // ─── Webhook verification ───────────────────
  // Telnyx uses ed25519 signature on the payload

  async verifyWebhook(payload: string, signature: string, timestamp: string): Promise<boolean> {
    if (!this.webhookSecret) return true; // skip in dev

    try {
      const crypto = await import('crypto');
      const data = `${timestamp}|${payload}`;
      const hmac = crypto.createHmac('sha256', this.webhookSecret);
      hmac.update(data);
      const expected = hmac.digest('hex');
      return crypto.timingSafeEqual(
        Buffer.from(expected, 'hex'),
        Buffer.from(signature, 'hex'),
      );
    } catch {
      return false;
    }
  }

  parseClientState(encoded?: string): string | null {
    if (!encoded) return null;
    try {
      return Buffer.from(encoded, 'base64').toString('utf-8');
    } catch {
      return null;
    }
  }
}
