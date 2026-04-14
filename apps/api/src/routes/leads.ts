import { type FastifyInstance, type FastifyRequest } from 'fastify';
import { z } from 'zod';
import { type AuthContext } from '@aaos/types';
import { LeadService } from '@aaos/core';
import { db } from '@aaos/db';
import { authenticate } from '../middleware/auth';

type AuthReq = FastifyRequest & { authContext: AuthContext };

export async function leadsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  const leads = new LeadService(db);

  // GET /leads?clientAccountId=&status=&stage=&search=&page=&limit=
  app.get('/leads', async (request: AuthReq, reply) => {
    const q = request.query as Record<string, string>;
    const result = await leads.list({
      clientAccountId: q.clientAccountId,
      status: q.status as never,
      pipelineStage: q.stage,
      assignedToId: q.assignedToId,
      search: q.search,
      page: q.page ? parseInt(q.page) : 1,
      limit: q.limit ? parseInt(q.limit) : 25,
    });
    return reply.send(result);
  });

  // GET /leads/:id
  app.get('/leads/:id', async (request: AuthReq, reply) => {
    const { id } = request.params as { id: string };
    const lead = await leads.getById(id);
    if (!lead) return reply.code(404).send({ error: 'Not found' });
    return reply.send({ lead });
  });

  // POST /leads
  app.post('/leads', async (request: AuthReq, reply) => {
    const body = CreateLeadSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: 'Bad Request', details: body.error.flatten() });

    const lead = await leads.create({ ...body.data, createdById: request.authContext.userId });
    return reply.code(201).send({ lead });
  });

  // PATCH /leads/:id/stage
  app.patch('/leads/:id/stage', async (request: AuthReq, reply) => {
    const { id } = request.params as { id: string };
    const body = StageUpdateSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: 'Bad Request', details: body.error.flatten() });

    const lead = await leads.updateStage(id, body.data.stage, request.authContext.userId);
    return reply.send({ lead });
  });

  // POST /leads/:id/notes
  app.post('/leads/:id/notes', async (request: AuthReq, reply) => {
    const { id } = request.params as { id: string };
    const body = NoteSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: 'Bad Request', details: body.error.flatten() });

    const note = await leads.addNote(id, request.authContext.userId, body.data.content);
    return reply.code(201).send({ note });
  });

  // POST /leads/:id/tags
  app.post('/leads/:id/tags', async (request: AuthReq, reply) => {
    const { id } = request.params as { id: string };
    const { tag } = request.body as { tag: string };
    const result = await leads.addTag(id, tag);
    return reply.send({ tag: result });
  });

  // DELETE /leads/:id/tags/:tag
  app.delete('/leads/:id/tags/:tag', async (request: AuthReq, reply) => {
    const { id, tag } = request.params as { id: string; tag: string };
    await leads.removeTag(id, tag);
    return reply.code(204).send();
  });

  // DELETE /leads/:id
  app.delete('/leads/:id', async (request: AuthReq, reply) => {
    const { id } = request.params as { id: string };
    await leads.softDelete(id);
    return reply.code(204).send();
  });
}

const CreateLeadSchema = z.object({
  clientAccountId: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  source: z.string().optional(),
  pipelineStage: z.string().optional(),
  assignedToId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.unknown()).optional(),
});

const StageUpdateSchema = z.object({ stage: z.string() });
const NoteSchema = z.object({ content: z.string().min(1) });
