import { type FastifyInstance, type FastifyRequest } from 'fastify';
import { z } from 'zod';
import { db } from '@aaos/db';
import { authenticate } from '../middleware/auth';

export async function templatesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // GET /templates
  app.get('/templates', async (request, reply) => {
    const { organizationId } = request.authContext;
    if (!organizationId) return reply.code(403).send({ error: 'No org context' });

    const templates = await db.template.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ templates });
  });

  // POST /templates
  app.post('/templates', async (request, reply) => {
    const { organizationId, userId } = request.authContext;
    if (!organizationId) return reply.code(403).send({ error: 'No org context' });

    const body = CreateSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: 'Bad Request', details: body.error.flatten() });

    const template = await db.template.create({
      data: { ...body.data, organizationId } as never,
    });
    return reply.code(201).send({ template });
  });

  // PATCH /templates/:id
  app.patch('/templates/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = UpdateSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: 'Bad Request', details: body.error.flatten() });

    const template = await db.template.update({ where: { id }, data: body.data as never });
    return reply.send({ template });
  });

  // DELETE /templates/:id
  app.delete('/templates/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await db.template.delete({ where: { id } });
    return reply.code(204).send();
  });
}

const CreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum([
    'MISSED_CALL_TEXTBACK', 'LEAD_FOLLOWUP', 'APPOINTMENT_REMINDER',
    'REVIEW_REQUEST', 'REACTIVATION', 'FAQ_ASSISTANT', 'INTAKE_QUALIFICATION',
    'ESTIMATE_FOLLOWUP', 'WELCOME_SEQUENCE', 'NURTURE_SEQUENCE', 'CUSTOM',
  ]),
  triggerType: z.enum([
    'NEW_LEAD', 'FORM_SUBMITTED', 'MISSED_CALL', 'INBOUND_SMS', 'NO_RESPONSE',
    'APPOINTMENT_REMINDER', 'STATUS_CHANGED', 'TAG_ADDED', 'MANUAL', 'SCHEDULED', 'WEBHOOK',
  ]),
  steps: z.array(z.record(z.unknown())).default([]),
  prompts: z.record(z.unknown()).optional(),
  variables: z.record(z.unknown()).optional(),
});

const UpdateSchema = CreateSchema.partial();
