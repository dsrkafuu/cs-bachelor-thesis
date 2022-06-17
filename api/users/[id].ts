import {
  ErrorModel,
  SiteModel,
  UserModel,
  ViewModel,
  VitalModel,
} from '../../db/models';
import { checkPassword, hashPassword } from '../../lib/crypto';
import { ResError } from '../../lib/error';
import logger from '../../lib/logger';
import methods from '../../lib/methods';
import { withAuth, withDatabase } from '../../lib/middleware';
import {
  getPayload,
  validateObjectID,
  validateUsername,
} from '../../lib/utils';

/**
 * modify a user
 */
async function put(req: CoreRequest, res: CoreResponse) {
  await withDatabase();
  const { payload } = await withAuth(req);

  const id = getPayload(req, 'id', validateObjectID, 'invalid user id', 'user');
  const username = getPayload(
    req,
    'username',
    validateUsername,
    'invalid username',
    'user'
  );
  const origpass = getPayload(req, 'origpass');
  const password = getPayload(req, 'password');
  const role = getPayload(
    req,
    'role',
    (v) => ['admin', 'user'].includes(v),
    'invalid role',
    'user'
  );

  const user = await UserModel.findOne({ _id: id });
  if (!user) {
    logger.error('user', 'user not found', { auth: payload, _id: id });
    throw new ResError(404, 'user not found');
  }

  // if not admin, validate origin password
  if (password && payload.r !== 'admin') {
    const valid = await checkPassword(origpass, user.password);
    if (!valid) {
      logger.error('user', 'invalid origin password', {
        auth: payload,
        _id: user._id,
        username: user.username,
      });
      throw new ResError(403, 'permission denied');
    }
  }
  if (password) {
    user.password = await hashPassword(password);
  }
  // only change role if user is admin
  if (payload.r === 'admin') {
    user.role = role;
  }
  await user.save();
  logger.info('user', 'user updated', {
    auth: payload,
    _id: id,
    username,
  });
  res.status(200).send({ _id: id, username, role, root: false });
}

/**
 * delete a user
 */
async function del(req: CoreRequest, res: CoreResponse) {
  await withDatabase();
  const { payload } = await withAuth(req);
  if (payload.r !== 'admin') {
    logger.error('user', 'permission denied', { auth: payload });
    throw new ResError(403, 'permission denied');
  }

  const id = getPayload(req, 'id', validateObjectID, 'invalid user id', 'user');
  await UserModel.findOneAndDelete({ _id: id }).lean();
  logger.warn('user', 'user deleted', { auth: payload, _id: id });

  await Promise.all([
    await SiteModel.deleteMany({ _user: id }),
    await ViewModel.deleteMany({ _user: id }).lean(),
    await VitalModel.deleteMany({ _user: id }).lean(),
    await ErrorModel.deleteMany({ _user: id }).lean(),
  ]);
  logger.warn('site', 'user data deleted', { auth: payload, _id: id });

  res.status(204).send(null);
}

export default methods({
  put,
  del,
});
