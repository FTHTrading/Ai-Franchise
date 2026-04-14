import { type FastifyInstance, type FastifyRequest } from 'fastify';
import { z } from 'zod';
import { type AuthContext } from '@aaos/types';
import { db } from '@aaos/db';
import { authenticate } from '../middleware/auth';

type AuthReq = FastifyRequest & { authContext: AuthContext };

export async function templatesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // GET /templates
  app.get('/templates', async (request: AuthReq, reply) => {
    const { organizationId } = request.authContext;
    if (!organizationId) return reply.code(403).send({ error: 'No org context' });

    const templates = await db.template.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ templates });
  });

  // POST /templates
  app.post('/templates', async (request: AuthReq, reply) => {
    const { organizationId, userId } = request.authContext;
    if (!organizationId) return reply.code(403).send({ error: 'No org context' });

    const body = CreateSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: 'Bad Request', details: body.error.flatten() });

    const template = await db.template.create({
      data: { ...body.data, organizationId, createdById: userId },
    });
    return reply.code(201).send({ template });
  });

  // PATCH /templates/:id
  app.patch('/templates/:id', async (request: AuthReq, reply) => {
    const { id } = request.params as { id: string };
    const body = UpdateSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: 'Bad Request', details: body.error.flatten() });

    const template = await db.template.update({ where: { id }, data: body.data });
    return reply.send({ template });
  });

  // DELETE /templates/:id
  app.delete('/templates/:id', async (request: AuthReq, reply) => {
    const { id } = request.params as { id: string };
    await db.template.delete({ where: { id } });
    return reply.code(204).send();
  });
}

const CreateSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['SMS', 'EMAIL', 'WORKFLOW', 'AI_PROMPT']),
  subject: z.string().optional(),
  body: z.string().min(1),
  variables: z.array(z.string()).optional(),
});

const UpdateSchema = CreateSchema.partial();
