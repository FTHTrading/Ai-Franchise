import { type FastifyInstance, type FastifyRequest } from 'fastify';
import { z } from 'zod';
import { type AuthContext } from '@aaos/types';
import { db } from '@aaos/db';
import { authenticate } from '../middleware/auth';

type AuthReq = FastifyRequest & { authContext: AuthContext };

export async function appointmentsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // GET /appointments?clientAccountId=&from=&to=
  app.get('/appointments', async (request: AuthReq, reply) => {
    const q = request.query as Record<string, string>;
    const where = {
      ...(q.clientAccountId ? { clientAccountId: q.clientAccountId } : {}),
      ...(q.from || q.to
        ? { scheduledAt: { gte: q.from ? new Date(q.from) : undefined, lte: q.to ? new Date(q.to) : undefined } }
        : {}),
    };
    const appointments = await db.appointment.findMany({
      where,
      include: { lead: true },
      orderBy: { scheduledAt: 'asc' },
    });
    return reply.send({ appointments });
  });

  // POST /appointments
  app.post('/appointments', async (request: AuthReq, reply) => {
    const body = CreateSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: 'Bad Request', details: body.error.flatten() });

    const appointment = await db.appointment.create({
      data: { ...body.data, status: 'SCHEDULED' },
      include: { lead: true },
    });
    return reply.code(201).send({ appointment });
  });

  // PATCH /appointments/:id
  app.patch('/appointments/:id', async (request: AuthReq, reply) => {
    const { id } = request.params as { id: string };
    const body = UpdateSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: 'Bad Request', details: body.error.flatten() });

    const appointment = await db.appointment.update({ where: { id }, data: body.data, include: { lead: true } });
    return reply.send({ appointment });
  });
}

const CreateSchema = z.object({
  leadId: z.string(),
  clientAccountId: z.string(),
  title: z.string().min(1),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().positive().default(60),
  notes: z.string().optional(),
});

const UpdateSchema = z.object({
  scheduledAt: z.string().datetime().optional(),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  notes: z.string().optional(),
});
