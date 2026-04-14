import { type FastifyInstance, type FastifyRequest } from 'fastify';
import { z } from 'zod';
import { db } from '@aaos/db';
import { authenticate } from '../middleware/auth';

export async function appointmentsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // GET /appointments?clientAccountId=&from=&to=
  app.get('/appointments', async (request, reply) => {
    const q = request.query as Record<string, string>;
    const where = {
      ...(q.clientAccountId ? { clientAccountId: q.clientAccountId } : {}),
      ...(q.from || q.to
        ? { startAt: { gte: q.from ? new Date(q.from) : undefined, lte: q.to ? new Date(q.to) : undefined } }
        : {}),
    };
    const appointments = await db.appointment.findMany({
      where,
      include: { lead: true },
      orderBy: { startAt: 'asc' },
    });
    return reply.send({ appointments });
  });

  // POST /appointments
  app.post('/appointments', async (request, reply) => {
    const { organizationId } = request.authContext;
    if (!organizationId) return reply.code(403).send({ error: 'No org context' });
    const body = CreateSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: 'Bad Request', details: body.error.flatten() });

    const startAt = new Date(body.data.startAt);
    const endAt = new Date(startAt.getTime() + (body.data.durationMinutes ?? 60) * 60000);

    const appointment = await db.appointment.create({
      data: {
        organizationId,
        leadId: body.data.leadId,
        clientAccountId: body.data.clientAccountId,
        title: body.data.title,
        startAt,
        endAt,
        notes: body.data.notes,
        status: 'SCHEDULED',
      },
      include: { lead: true },
    });
    return reply.code(201).send({ appointment });
  });

  // PATCH /appointments/:id
  app.patch('/appointments/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = UpdateSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: 'Bad Request', details: body.error.flatten() });

    const updateData: Record<string, unknown> = {};
    if (body.data.status) updateData.status = body.data.status;
    if (body.data.notes) updateData.notes = body.data.notes;
    if (body.data.startAt) {
      updateData.startAt = new Date(body.data.startAt);
      updateData.endAt = new Date(new Date(body.data.startAt).getTime() + 60 * 60000);
    }

    const appointment = await db.appointment.update({ where: { id }, data: updateData, include: { lead: true } });
    return reply.send({ appointment });
  });
}

const CreateSchema = z.object({
  leadId: z.string(),
  clientAccountId: z.string(),
  title: z.string().min(1),
  startAt: z.string().datetime(),
  durationMinutes: z.number().int().positive().default(60),
  notes: z.string().optional(),
});

const UpdateSchema = z.object({
  startAt: z.string().datetime().optional(),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  notes: z.string().optional(),
});
