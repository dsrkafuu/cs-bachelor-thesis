import { Types } from 'mongoose';
import { ErrorModel } from '../../../../db/models';
import methods from '../../../../lib/methods';
import { withAuth, withDatabase } from '../../../../lib/middleware';
import { getPayload } from '../../../../lib/utils';
import { ResError } from '../../../../lib/error';
import ErrorStackParser from 'error-stack-parser';

async function findErrorMeta(eid: string) {
  const error = await ErrorModel.findById(eid).lean();
  if (!error) {
    throw new ResError(404, 'error meta not found');
  }
  return error;
}

/**
 * get error data from eid/name/message
 */
async function get(req: CoreRequest, res: CoreResponse) {
  await withDatabase();
  await withAuth(req);

  const id = getPayload(req, 'id', (id) => id?.length === 24);
  const eid = getPayload(req, 'eid', (eid) => eid?.length === 24);
  const error = await findErrorMeta(eid);
  const { name, message, stack } = error;

  const $match = {
    _site: new Types.ObjectId(id),
    name,
    message,
  };

  const getData = async () => {
    let data = await ErrorModel.aggregate([
      { $match },
      // get rmessages
      {
        $group: {
          _id: null,
          status: { $first: '$status' },
          first: { $min: '$_created' },
          last: { $max: '$_created' },
          pv: { $sum: 1 },
          type: { $first: '$type' },
          rmessages: { $addToSet: '$rmessage' },
          sessions: { $addToSet: '$_session' },
        },
      },
      { $set: { uv: { $size: '$sessions' } } },
      {
        $project: {
          _id: 0,
          sessions: 0,
        },
      },
    ]);
    data = data[0];
    if (!data) {
      throw new ResError(404, 'error not found');
    }
    const e = new Error(message);
    e.name = name;
    e.stack = stack;
    const parsed = ErrorStackParser.parse(e);
    const status = (data as any).status || 'unresolved';
    return {
      eid,
      name,
      message,
      stack: parsed,
      ...data,
      status,
    };
  };

  const getSessions = async () => {
    const data = await ErrorModel.aggregate([
      { $match },
      // populate session
      {
        $lookup: {
          from: 'sessions',
          localField: '_session',
          foreignField: '_fp',
          as: 'session',
        },
      },
      { $set: { session: { $arrayElemAt: ['$session', 0] } } },
      // group by session meta
      {
        $group: {
          _id: {
            browser: '$session.browser',
            version: '$session.version',
            system: '$session.system',
            platform: '$session.platform',
            archtecture: '$session.archtecture',
          },
          pv: { $sum: 1 },
          sessions: { $addToSet: '$_session' },
        },
      },
      { $sort: { pv: -1 } },
      {
        $set: {
          uv: { $size: '$sessions' },
          browser: '$_id.browser',
          version: '$_id.version',
          system: '$_id.system',
          platform: '$_id.platform',
          arch: '$_id.archtecture',
        },
      },
      {
        $project: {
          _id: 0,
          sessions: 0,
        },
      },
    ]);
    return data;
  };

  const [data, sessions] = await Promise.all([getData(), getSessions()]);
  (data as any).sessions = sessions;
  res.status(200).send(data);
}

/**
 * change status of error from eid/name/message
 */
async function put(req: CoreRequest, res: CoreResponse) {
  await withDatabase();
  await withAuth(req);

  const id = getPayload(req, 'id', (id) => id?.length === 24);
  const eid = getPayload(req, 'eid', (eid) => eid?.length === 24);
  const status = getPayload(req, 'status', (v) =>
    ['resolved', 'reviewed', 'unresolved'].includes(v)
  );
  const error = await findErrorMeta(eid);
  const { name, message } = error;

  const updated = await ErrorModel.updateMany(
    {
      _site: new Types.ObjectId(id),
      name,
      message,
    },
    { status }
  ).lean();
  res.status(200).send(updated);
}

/**
 * delete error from eid/name/message
 */
async function del(req: CoreRequest, res: CoreResponse) {
  await withDatabase();
  await withAuth(req);

  const id = getPayload(req, 'id', (id) => id?.length === 24);
  const eid = getPayload(req, 'eid', (eid) => eid?.length === 24);
  const error = await findErrorMeta(eid);
  const { name, message } = error;

  const deleted = await ErrorModel.deleteMany({
    _site: new Types.ObjectId(id),
    name,
    message,
  }).lean();
  res.status(200).send(deleted);
}

export default methods({
  get,
  put,
  del,
});
