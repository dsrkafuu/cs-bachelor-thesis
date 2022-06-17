import { LogModel } from '../../db/models';
import logger from '../../lib/logger';
import methods from '../../lib/methods';
import { withAuth, withDatabase } from '../../lib/middleware';
import { getPayload } from '../../lib/utils';
import { ResError } from '../../lib/error';

/**
 * get all logs
 */
async function get(req: CoreRequest, res: CoreResponse) {
  await withDatabase();
  const { payload } = await withAuth(req);
  if (payload.r !== 'admin') {
    logger.error('user', 'permission denied', { auth: payload });
    throw new ResError(403, 'permission denied');
  }

  const page = Number(getPayload(req, 'page')) || 1;
  const pagesize = Number(getPayload(req, 'pagesize')) || 10;
  const from = Number(getPayload(req, 'from'));
  const to = Number(getPayload(req, 'to'));
  const pid = Number(getPayload(req, 'pid'));
  const level = getPayload(req, 'level');
  const type = getPayload(req, 'type');
  const msg = getPayload(req, 'msg');
  const pld = getPayload(req, 'payload');

  const match = {} as any;
  if (from && to) {
    match.time = { $gte: from, $lte: to };
  }
  if (pid) {
    match.pid = pid;
  }
  if (level) {
    match.level = level;
  }
  if (type) {
    match.type = type;
  }
  if (msg) {
    match.msg = { $regex: msg, $options: 'i' };
  }
  if (pld) {
    match.payload = { $regex: pld, $options: 'i' };
  }

  const getTotal = async () => {
    const counts = await LogModel.countDocuments(match);
    return counts;
  };

  const getData = async () => {
    const logs = await LogModel.find(match)
      .sort({ time: -1 })
      .skip((page - 1) * pagesize)
      .limit(pagesize)
      .lean();
    return logs;
  };

  const [total, data] = await Promise.all([getTotal(), getData()]);
  res.status(200).send({ total, data });
}

export default methods({
  get,
});
