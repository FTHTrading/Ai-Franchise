import { type FastifyInstance, type FastifyRequest } from 'fastify';
import { z } from 'zod';
import { db } from '@aaos/db';
import { hasPermission } from '@aaos/auth';
import { type AuthContext } from '@aaos/types';
import { authenticate } from '../middleware/auth';

type AuthReq = FastifyRequest & { authContext: AuthContext };

export async function organizationsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // GET /organizations/:slug
  app.get('/organizations/:slug', async (request: AuthReq, reply) => {
    const { slug } = request.params as { slug: string };
    const org = await db.organization.findUnique({
      where: { slug },
      include: { brandSettings: true, subscription: true },
    });
    if (!org) return reply.code(404).send({ error: 'Not found' });

    // Verify caller is a member
    const membership = await db.organizationMembership.findUnique({
      where: { organizationId_userId: { organizationId: org.id, userId: request.authContext.userId } },
    });
    if (!membership) return reply.code(403).send({ error: 'Forbidden' });

    return reply.send({ organization: org });
  });

  // POST /organizations
  app.post('/organizations', async (request: AuthReq, reply) => {
    const body = CreateOrgSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: 'Bad Request', details: body.error.flatten() });

    const { name, slug, niche } = body.data;

    // Check slug uniqueness
    const existing = await db.organization.findUnique({ where: { slug } });
    if (existing) return reply.code(409).send({ error: 'Slug already taken' });

    const org = await db.organization.create({
      data: {
        name,
        slug,
        niche: niche ?? null,
        members: {
          create: { userId: request.authContext.userId, role: 'ORGANIZATION_OWNER' },
        },
        brandSettings: { create: {} },
        onboardingState: { create: {} },
      },
      include: { brandSettings: true },
    });

    return reply.code(201).send({ organization: org });
  });

  // PATCH /organizations/:id
  app.patch('/organizations/:id', async (request: AuthReq, reply) => {
    const { id } = request.params as { id: string };
    const body = UpdateOrgSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: 'Bad Request', details: body.error.flatten() });

    if (!hasPermission(request.authContext.role, 'settings:manage')) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const org = await db.organization.update({
      where: { id },
      data: body.data,
    });
    return reply.send({ organization: org });
  });

  // GET /organizations/:id/members
  app.get('/organizations/:id/members', async (request: AuthReq, reply) => {
    const { id } = request.params as { id: string };
    const members = await db.organizationMembership.findMany({
      where: { organizationId: id },
      include: { user: true },
    });
    return reply.send({ members });
  });

  // POST /organizations/:id/members/invite
  app.post('/organizations/:id/members/invite', async (request: AuthReq, reply) => {
    const { id } = request.params as { id: string };
    if (!hasPermission(request.authContext.role, 'team:invite')) {
      return reply.code(403).send({ error: 'Forbidden' });
    }
    const body = InviteSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: 'Bad Request', details: body.error.flatten() });

    // In a full implementation, send Clerk invitation here via clerkClient.invitations.createInvitation
    // For now, return 202 Accepted indicating the invite is queued
    return reply.code(202).send({ message: 'Invitation queued', email: body.data.email });
  });
}

const CreateOrgSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  niche: z.string().optional(),
});

const UpdateOrgSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  website: z.string().url().optional(),
  phone: z.string().optional(),
  timezone: z.string().optional(),
});

const InviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ORGANIZATION_ADMIN', 'OPERATOR']),
});
