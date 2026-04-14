import { type FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '@aaos/db';

export async function authRoutes(app: FastifyInstance) {
  // Called by the Next.js middleware after Clerk verifies the session.
  // Syncs the Clerk user into our DB on first sign-in.
  app.post('/auth/sync', async (request, reply) => {
    const body = SyncSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: 'Bad Request', details: body.error.flatten() });

    const { clerkId, email, firstName, lastName, imageUrl } = body.data;

    const user = await db.user.upsert({
      where: { clerkId },
      create: { clerkId, email, firstName, lastName: lastName ?? null, avatarUrl: imageUrl ?? null },
      update: { email, firstName, lastName: lastName ?? null, avatarUrl: imageUrl ?? null },
    });

    return reply.send({ user });
  });

  // Returns the current user profile with org membership
  app.get('/auth/me', async (request, reply) => {
    const ctxHeader = request.headers['x-auth-context'];
    if (!ctxHeader || typeof ctxHeader !== 'string') {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    try {
      const ctx = JSON.parse(Buffer.from(ctxHeader as string, 'base64').toString('utf8'));
      const user = await db.user.findUnique({
        where: { clerkId: ctx.clerkId },
        include: {
          organizationMemberships: {
            where: { organizationId: ctx.organizationId ?? undefined },
            include: { organization: true },
          },
        },
      });
      if (!user) return reply.code(404).send({ error: 'User not found' });
      return reply.send({ user });
    } catch {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });
}

const SyncSchema = z.object({
  clerkId: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string().optional(),
  imageUrl: z.string().url().optional(),
});
