import {
  ErrorModel,
  SiteModel,
  UserModel,
  ViewModel,
  VitalModel,
} from '../../db/models';
import { hashPassword } from '../../lib/crypto';
import { ResError } from '../../lib/error';
import logger from '../../lib/logger';
import methods from '../../lib/methods';
import { withAuth, withDatabase } from '../../lib/middleware';
import {
  getPayload,
  validatePassword,
  validateUsername,
} from '../../lib/utils';

/**
 * get all users
 */
async function get(req: CoreRequest, res: CoreResponse) {
  await withDatabase();
  const { payload } = await withAuth(req);
  if (payload.r !== 'admin') {
    throw new ResError(403, 'permission denied');
  }

  const users = await UserModel.find({})
    .select('username _created role root')
    .lean();
  res.status(200).send(users);
}

/**
 * create a new user
 */
async function post(req: CoreRequest, res: CoreResponse) {
  await withDatabase();
  const { payload } = await withAuth(req);
  if (payload.r !== 'admin') {
    logger.error('user', 'permission denied', { auth: payload });
    throw new ResError(403, 'permission denied');
  }

  const username = getPayload(
    req,
    'username',
    validateUsername,
    'invalid username',
    'user'
  );
  const password = getPayload(
    req,
    'password',
    validatePassword,
    'invalid password',
    'user'
  );
  const role = getPayload(
    req,
    'role',
    (v) => ['admin', 'user'].includes(v),
    'invalid role',
    'user'
  );

  const user = await UserModel.create({
    username,
    password: await hashPassword(password),
    role,
    root: false,
  });
  logger.info('user', 'user created', {
    auth: payload,
    _id: user._id,
    username,
  });
  res.status(201).send(user);
}

/**
 * delete many users
 */
async function del(req: CoreRequest, res: CoreResponse) {
  await withDatabase();
  const { payload } = await withAuth(req);
  if (payload.r !== 'admin') {
    logger.error('user', 'permission denied', { auth: payload });
    throw new ResError(403, 'permission denied');
  }

  const ids = getPayload(
    req,
    'ids',
    (v) => Array.isArray(v),
    'invalid user ids',
    'user'
  );

  await UserModel.deleteMany({
    _id: { $in: ids },
  }).lean();
  logger.warn('user', 'users deleted', { auth: payload, _ids: ids });

  await Promise.all([
    await SiteModel.deleteMany({ _user: { $in: ids } }),
    await ViewModel.deleteMany({ _user: { $in: ids } }).lean(),
    await VitalModel.deleteMany({ _user: { $in: ids } }).lean(),
    await ErrorModel.deleteMany({ _user: { $in: ids } }).lean(),
  ]);
  logger.warn('site', 'users data deleted', { auth: payload, _ids: ids });

  res.status(204).send(null);
}

export default methods({
  get,
  post,
  del,
});
