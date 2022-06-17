import methods from '../../lib/methods';
import { withAuth } from '../../lib/middleware';
import { setAuthCookie } from '../../lib/utils';

/**
 * verify a JWE token and parse it
 */
async function get(req: CoreRequest, res: CoreResponse) {
  const { token, payload } = await withAuth(req);
  // make session live longer
  setAuthCookie(res, token, payload.rm);
  res.status(200).send(payload);
}

export default methods({
  get,
});
