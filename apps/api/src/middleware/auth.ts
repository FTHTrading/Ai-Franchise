import { type FastifyRequest, type FastifyReply } from 'fastify';
import { type AuthContext } from '@aaos/types';

/**
 * Extracts the Bearer token from the Authorization header.
 * Actual Clerk JWT verification should be done with @clerk/fastify or the Clerk Backend SDK.
 * Here we decode the sub claim to build the AuthContext; the caller must have already
 * verified the token (e.g. via Clerk middleware in production).
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.code(401).send({ error: 'Unauthorized', message: 'Missing Bearer token' });
  }

  try {
    // In production, use Clerk SDK to verify the JWT:
    // const { payload } = await clerkClient.verifyToken(token)
    // For now we trust the forwarded auth context header set by the Next.js middleware.
    const ctxHeader = request.headers['x-auth-context'];
    if (!ctxHeader || typeof ctxHeader !== 'string') {
      return reply.code(401).send({ error: 'Unauthorized', message: 'No auth context' });
    }
    const ctx = JSON.parse(Buffer.from(ctxHeader, 'base64').toString('utf8')) as AuthContext;
    (request as FastifyRequest & { authContext: AuthContext }).authContext = ctx;
  } catch {
    return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid auth context' });
  }
}

export function requireOrg(request: FastifyRequest & { authContext?: AuthContext }, reply: FastifyReply): void {
  const ctx = request.authContext;
  if (!ctx?.organizationId) {
    reply.code(403).send({ error: 'Forbidden', message: 'No organization context' });
  }
}
