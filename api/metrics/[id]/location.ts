import { Types } from 'mongoose';
import { SessionModel, ViewModel } from '../../../db/models';
import methods from '../../../lib/methods';
import { withAuth, withDatabase } from '../../../lib/middleware';
import { getPayload } from '../../../lib/utils';
import dayjs from '../../../lib/dayjs';

async function get(req: CoreRequest, res: CoreResponse) {
  await withDatabase();
  await withAuth(req);

  const id = getPayload(req, 'id', (id) => id?.length === 24);
  let from = Number(getPayload(req, 'from'));
  let to = Number(getPayload(req, 'to'));
  const tz = getPayload(req, 'tz');
  if (tz) {
    const offset = dayjs(from, tz).utcOffset() * 60000;
    from -= offset;
    to -= offset;
  }

  const $match = {
    _site: new Types.ObjectId(id),
    _created: { $gte: new Date(from), $lte: new Date(to) },
  };

  const getLocationPV = async () => {
    const data = await ViewModel.aggregate([
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
      {
        $group: {
          _id: '$session.location',
          value: { $sum: 1 },
        },
      },
      { $sort: { value: -1 } },
    ]);
    return data;
  };

  const getLocationUV = async () => {
    const data = await SessionModel.aggregate([
      { $match },
      // group by location
      {
        $group: {
          _id: '$location',
          value: { $sum: 1 },
        },
      },
      { $sort: { value: -1 } },
    ]);
    return data;
  };

  const [pv, uv] = await Promise.all([getLocationPV(), getLocationUV()]);
  const uvMap = uv.reduce((acc, cur) => {
    acc[cur._id] = cur.value;
    return acc;
  }, {});
  const data = pv.map((item) => {
    const uv = uvMap[item._id] || 0;
    return { c: item._id, pv: item.value, uv };
  });
  res.status(200).send(data);
}

export default methods({
  get,
});
