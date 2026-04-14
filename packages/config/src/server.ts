import { z } from 'zod';

// Server-side environment variables (never sent to browser)
const serverEnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Auth (Clerk)
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().optional(),

  // Payments (Stripe)
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  STRIPE_STARTER_PRICE_ID: z.string().optional(),
  STRIPE_GROWTH_PRICE_ID: z.string().optional(),
  STRIPE_PRO_PRICE_ID: z.string().optional(),

  // SMS (Telnyx)
  TELNYX_API_KEY: z.string().min(1),
  TELNYX_WEBHOOK_SECRET: z.string().optional(),
  TELNYX_APP_PORT: z.string().optional(),

  // Email (Resend)
  RESEND_API_KEY: z.string().startsWith('re_'),
  RESEND_WEBHOOK_SECRET: z.string().optional(),

  // AI
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Storage
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().optional(), // for R2/MinIO

  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_URL: z.string().url().default('http://localhost:3001'),
  WEB_URL: z.string().url().default('http://localhost:3000'),
  ENCRYPTION_KEY: z.string().min(32),

  // Feature flags
  FEATURE_BOOKING: z.coerce.boolean().default(true),
  FEATURE_AI_REPLIES: z.coerce.boolean().default(true),
  RATE_LIMIT_RPM: z.coerce.number().default(100),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let _serverEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (_serverEnv) return _serverEnv;

  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`[AAOS] Invalid server environment variables:\n${missing}`);
  }

  _serverEnv = parsed.data;
  return _serverEnv;
}

export { serverEnvSchema };
