import { Types } from 'mongoose';
import { ViewModel } from '../../../../db/models';
import methods from '../../../../lib/methods';
import { withAuth, withDatabase } from '../../../../lib/middleware';
import { getPayload } from '../../../../lib/utils';
import dayjs from '../../../../lib/dayjs';

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

  // filters
  const type = getPayload(req, 'type', (v) =>
    ['system', 'browser', 'screen', 'language'].includes(v)
  );
  const page = Number(getPayload(req, 'page')) || 1;
  const pagesize = Number(getPayload(req, 'pagesize')) || 5;
  const sort = getPayload(req, 'sort', (v) => v === 'pv' || v === 'uv');

  const aggregates = [
    {
      $match: {
        _site: new Types.ObjectId(id),
        _created: { $gte: new Date(from), $lte: new Date(to) },
      },
    },
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
        _id: `$session.${type}`,
        pv: { $sum: 1 }, // get page views of each pathname
        sessions: { $addToSet: '$_session' }, // get all unqiue sessions array
      },
    },
    {
      $project: {
        _id: 0,
        name: '$_id',
        pv: 1,
        uv: { $size: '$sessions' }, // count unique sessions
      },
    },
  ];

  // get total count
  const getTotal = async () => {
    const res = await ViewModel.aggregate([...aggregates, { $count: 'total' }]);
    if (res && res[0] && res[0].total) {
      return res[0].total;
    } else {
      return 0;
    }
  };

  const getData = async () => {
    const data = await ViewModel.aggregate([
      ...aggregates,
      // pagination
      { $sort: sort === 'uv' ? { uv: -1 } : { pv: -1 } },
      { $skip: (page - 1) * pagesize },
      { $limit: pagesize },
    ]);
    return data;
  };

  const [total, data] = await Promise.all([getTotal(), getData()]);
  res.status(200).send({ total, data });
}

export default methods({
  get,
});
