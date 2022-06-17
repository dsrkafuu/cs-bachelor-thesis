import { checkPassword, createJWT } from '../../lib/crypto';
import { ResError } from '../../lib/error';
import { withDatabase } from '../../lib/middleware';
import methods from '../../lib/methods';
import { setAuthCookie } from '../../lib/utils';
import { UserModel } from '../../db/models';
import logger from '../../lib/logger';

/**
 * handle login request and return a JWE token
 */
async function post(req: CoreRequest, res: CoreResponse) {
  await withDatabase();

  const { username, password, remember } = req.body || {};
  if (!username || !password) {
    logger.warn('auth', 'missing username or password');
    throw new ResError(400, 'invalid login request');
  }

  const user = await UserModel.findOne({ username }).lean();
  if (!user || !(await checkPassword(password, user.password))) {
    logger.warn('auth', 'wrong username or password', { username });
    throw new ResError(401, 'wrong username or password');
  }

  logger.info('auth', 'login success', {
    _id: user._id,
    username,
  });
  const jwt = await createJWT('JWE', {
    id: user._id.toString(),
    u: user.username,
    r: user.role,
    rm: !!remember, // remember
  });
  setAuthCookie(res, jwt, remember);
  res.status(204).send(null);
}

export default methods({
  post,
});
