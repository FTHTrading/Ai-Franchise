import { type FastifyInstance, type FastifyRequest } from 'fastify';
import { z } from 'zod';
import { type AuthContext } from '@aaos/types';
import { WorkflowService } from '@aaos/core';
import { db } from '@aaos/db';
import { hasPermission } from '@aaos/auth';
import { authenticate } from '../middleware/auth';
import { BUILT_IN_TEMPLATES } from '@aaos/workflows';

type AuthReq = FastifyRequest & { authContext: AuthContext };

export async function workflowsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  const wfService = new WorkflowService(db);

  // GET /workflows — list org workflows
  app.get('/workflows', async (request: AuthReq, reply) => {
    const { organizationId } = request.authContext;
    if (!organizationId) return reply.code(403).send({ error: 'No org context' });

    const q = request.query as Record<string, string>;
    const workflows = await wfService.listForOrganization(organizationId, q.clientAccountId);
    return reply.send({ workflows });
  });

  // GET /workflows/templates — list built-in templates
  app.get('/workflows/templates', async (_request, reply) => {
    return reply.send({ templates: Object.values(BUILT_IN_TEMPLATES) });
  });

  // POST /workflows/install — install a built-in template for a client
  app.post('/workflows/install', async (request: AuthReq, reply) => {
    const { organizationId } = request.authContext;
    if (!organizationId) return reply.code(403).send({ error: 'No org context' });
    if (!hasPermission(request.authContext.role, 'workflows:create')) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    const body = InstallTemplateSchema.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ error: 'Bad Request', details: body.error.flatten() });

    const workflow = await wfService.installTemplate(organizationId, body.data.clientAccountId, body.data.templateKey);
    return reply.code(201).send({ workflow });
  });

  // PATCH /workflows/:id/activate
  app.patch('/workflows/:id/activate', async (request: AuthReq, reply) => {
    const { id } = request.params as { id: string };
    if (!hasPermission(request.authContext.role, 'workflows:publish')) {
      return reply.code(403).send({ error: 'Forbidden' });
    }
    const wf = await wfService.activate(id);
    return reply.send({ workflow: wf });
  });

  // PATCH /workflows/:id/pause
  app.patch('/workflows/:id/pause', async (request: AuthReq, reply) => {
    const { id } = request.params as { id: string };
    const wf = await wfService.pause(id);
    return reply.send({ workflow: wf });
  });

  // DELETE /workflows/:id
  app.delete('/workflows/:id', async (request: AuthReq, reply) => {
    if (!hasPermission(request.authContext.role, 'workflows:delete')) {
      return reply.code(403).send({ error: 'Forbidden' });
    }
    await db.workflow.update({ where: { id: request.params as never }, data: { status: 'ARCHIVED' } });
    return reply.code(204).send();
  });
}

const InstallTemplateSchema = z.object({
  clientAccountId: z.string(),
  templateKey: z.string(),
});
