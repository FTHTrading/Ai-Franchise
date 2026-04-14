import { type FastifyInstance, type FastifyRequest } from 'fastify';
import { z } from 'zod';
import { ConversationService } from '@aaos/core';
import { db } from '@aaos/db';
import { authenticate } from '../middleware/auth';

export async function conversationsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  const convos = new ConversationService(db);

  // GET /conversations - unified inbox
  app.get('/conversations', async (request, reply) => {
    const { organizationId } = request.authContext;
    if (!organizationId) return reply.code(403).send({ error: 'No org context' });

    const q = request.query as Record<string, string>;
    const conversations = await convos.listOpenConversations(
      organizationId!,
      q.clientAccountId!,
      q.limit ? parseInt(q.limit) : 50
    );
    return reply.send({ conversations });
  });

  // GET /conversations/:id
  app.get('/conversations/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const convo = await convos.getConversationWithMessages(id, request.authContext.organizationId!);
    if (!convo) return reply.code(404).send({ error: 'Not found' });
    return reply.send({ conversation: convo });
  });

  // POST /conversations/:id/messages — agent sends outbound message
  app.post('/conversations/:id/messages', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = AddMessageSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: 'Bad Request', details: body.error.flatten() });

    const message = await convos.addMessage({
      conversationId: id,
      ...body.data,
      direction: 'OUTBOUND',
      senderId: request.authContext.userId,
    });
    return reply.code(201).send({ message });
  });

  // PATCH /conversations/:id/read
  app.patch('/conversations/:id/read', async (request, reply) => {
    const { id } = request.params as { id: string };
    const convo = await convos.markRead(id);
    return reply.send({ conversation: convo });
  });

  // PATCH /conversations/:id/resolve
  app.patch('/conversations/:id/resolve', async (request, reply) => {
    const { id } = request.params as { id: string };
    const convo = await convos.resolveConversation(id);
    return reply.send({ conversation: convo });
  });

  // PATCH /conversations/:id/ai — toggle AI reply
  app.patch('/conversations/:id/ai', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { enabled } = request.body as { enabled: boolean };
    const convo = enabled
      ? await db.conversation.update({ where: { id }, data: { aiEnabled: true } })
      : await convos.disableAI(id);
    return reply.send({ conversation: convo });
  });
}

const AddMessageSchema = z.object({
  body: z.string().min(1).max(1600),
  channel: z.enum(['SMS', 'EMAIL', 'VOICE', 'CHAT']),
});
