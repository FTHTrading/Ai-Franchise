import { type FastifyInstance, type FastifyRequest } from 'fastify';
import { db } from '@aaos/db';
import { authenticate } from '../middleware/auth';

export async function usersRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // PATCH /users/me — update own profile
  app.patch('/users/me', async (request, reply) => {
    const { userId } = request.authContext;
    const body = request.body as { firstName?: string; lastName?: string; avatarUrl?: string };

    const user = await db.user.update({
      where: { id: userId },
      data: {
        firstName: body.firstName,
        lastName: body.lastName ?? null,
        avatarUrl: body.avatarUrl ?? null,
      },
    });
    return reply.send({ user });
  });
}
