import process from 'process';
import cors from 'cors';
import isbot from 'isbot';
import { connect } from '../db/connect';
import { parseJWT } from './crypto';
import { ResError } from './error';

/**
 * promisify legacy express/connect middleware
 */
function promisifyLegacyMiddleware(
  middleware: (
    req: IncomingMessage,
    res: ServerResponse,
    next: (err?: Error) => void
  ) => void
) {
  return (req: CoreRequest, res: CoreResponse) => {
    return new Promise<void>((resolve, reject) => {
      middleware(req, res, (e) => {
        if (e instanceof Error) {
          reject(e);
        }
        resolve();
      });
    });
  };
}

export async function withDatabase() {
  try {
    return await connect();
  } catch {
    throw new ResError(500, 'server database error');
  }
}

export async function withCORS(req: CoreRequest, res: CoreResponse) {
  await promisifyLegacyMiddleware(
    cors({
      origin: true,
      credentials: true,
      maxAge: 86400,
    })
  )(req, res);
}

export function withBotCheck(req: CoreRequest) {
  const userAgent = req.headers['user-agent'];
  if (
    !userAgent ||
    (process.env.NODE_ENV === 'production' && isbot(userAgent))
  ) {
    throw new ResError(403, 'forbidden');
  }
  return userAgent;
}

export interface AuthPayload {
  id: string;
  u: string;
  r: string;
  rm: boolean;
}
export async function withAuth(req: CoreRequest) {
  const token = req.cookies.auth_token;
  if (!token) {
    throw new ResError(401, 'unauthorized');
  }
  const payload = await parseJWT('JWE', token);
  if (!payload) {
    throw new ResError(401, 'authorization token expired');
  }
  return {
    token,
    payload: payload as unknown as AuthPayload,
  };
}
