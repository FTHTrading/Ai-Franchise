import { type FastifyInstance, type FastifyRequest } from 'fastify';
import { z } from 'zod';
import { db } from '@aaos/db';
import { hasPermission } from '@aaos/auth';
import { authenticate } from '../middleware/auth';

export async function clientAccountsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // GET /client-accounts — list all client accounts for the org
  app.get('/client-accounts', async (request, reply) => {
    const { organizationId } = request.authContext;
    if (!organizationId) return reply.code(403).send({ error: 'No org context' });

    const { page = '1', limit = '20', search } = request.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {
      organizationId,
      deletedAt: null,
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    };

    const [accounts, total] = await Promise.all([
      db.clientAccount.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' } }),
      db.clientAccount.count({ where }),
    ]);

    return reply.send({ data: accounts, total, page: parseInt(page), limit: parseInt(limit) });
  });

  // GET /client-accounts/:id
  app.get('/client-accounts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { organizationId } = request.authContext;

    const account = await db.clientAccount.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { brandSettings: true, billingRecord: true },
    });
    if (!account) return reply.code(404).send({ error: 'Not found' });
    return reply.send({ account });
  });

  // POST /client-accounts
  app.post('/client-accounts', async (request, reply) => {
    const { organizationId, role } = request.authContext;
    if (!organizationId) return reply.code(403).send({ error: 'No org context' });
    if (!hasPermission(role, 'clients:write')) return reply.code(403).send({ error: 'Forbidden' });

    const body = CreateClientSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: 'Bad Request', details: body.error.flatten() });

    const slug = body.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const account = await db.clientAccount.create({
      data: { ...body.data, organizationId, slug },
    });
    return reply.code(201).send({ account });
  });

  // PATCH /client-accounts/:id
  app.patch('/client-accounts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { organizationId, role } = request.authContext;
    if (!hasPermission(role, 'clients:write')) return reply.code(403).send({ error: 'Forbidden' });

    const body = UpdateClientSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: 'Bad Request', details: body.error.flatten() });

    const account = await db.clientAccount.updateMany({
      where: { id, organizationId },
      data: body.data,
    });
    if (account.count === 0) return reply.code(404).send({ error: 'Not found' });
    return reply.send({ success: true });
  });

  // DELETE /client-accounts/:id — soft delete
  app.delete('/client-accounts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { organizationId, role } = request.authContext;
    if (!hasPermission(role, 'clients:delete')) return reply.code(403).send({ error: 'Forbidden' });

    await db.clientAccount.updateMany({
      where: { id, organizationId },
      data: { deletedAt: new Date() },
    });
    return reply.code(204).send();
  });
}

const CreateClientSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().url().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

const UpdateClientSchema = CreateClientSchema.partial();
