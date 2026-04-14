import type { AuthContext } from '@aaos/types';

declare module 'fastify' {
  interface FastifyRequest {
    authContext: AuthContext;
  }
}
