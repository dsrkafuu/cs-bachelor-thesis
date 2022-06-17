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
  const page = Number(getPayload(req, 'page')) || 1;
  const pagesize = Number(getPayload(req, 'pagesize')) || 5;
  const sort = getPayload(req, 'sort', (v) => v === 'pv' || v === 'uv');
  const isExport = getPayload(req, 'export');

  const $match = {
    _site: new Types.ObjectId(id),
    _created: { $gte: new Date(from), $lte: new Date(to) },
  } as any;
  const aggregates = [
    { $match },
    {
      $group: {
        _id: '$referrer',
        pv: { $sum: 1 }, // get page views of each pathname
        sessions: { $addToSet: '$_session' }, // get all unqiue sessions array
      },
    },
    {
      $project: {
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

  // get each pages total pv & uv
  const getPVUVTimes = async () => {
    const aggs = [
      ...aggregates,
      {
        $project: {
          _id: 0,
          ref: '$_id',
          pv: 1,
          uv: 1,
        },
      },
      { $sort: sort === 'uv' ? { uv: -1 } : { pv: -1 } },
    ] as any;
    if (!isExport) {
      aggs.push({ $skip: (page - 1) * pagesize });
      aggs.push({ $limit: pagesize });
    }
    const res = await ViewModel.aggregate(aggs);
    return res;
  };

  const [total, pvuv] = await Promise.all([getTotal(), getPVUVTimes()]);
  if (isExport) {
    res.status(200).send(pvuv);
  } else {
    res.status(200).send({ total, data: pvuv });
  }
}

export default methods({
  get,
});
