import { Types } from 'mongoose';
import { ErrorModel } from '../../../../db/models';
import methods from '../../../../lib/methods';
import { withAuth, withDatabase } from '../../../../lib/middleware';
import { getPayload } from '../../../../lib/utils';

async function get(req: CoreRequest, res: CoreResponse) {
  await withDatabase();
  await withAuth(req);

  const id = getPayload(req, 'id', (id) => id?.length === 24);

  // filters
  const status = getPayload(req, 'status', (v) =>
    ['resolved', 'reviewed', 'unresolved'].includes(v)
  );
  const page = Number(getPayload(req, 'page')) || 1;
  const pagesize = Number(getPayload(req, 'pagesize')) || 10;
  const type = getPayload(req, 'type');
  const name = getPayload(req, 'name');
  const message = getPayload(req, 'message');

  const $match = {
    _site: new Types.ObjectId(id),
  } as any;
  if (status === 'unresolved') {
    $match.$or = [
      { status: { $exists: false } },
      { status: null },
      { status: 'unresolved' },
    ];
  } else {
    $match.status = status;
  }
  type && ($match.type = type);
  name && ($match.name = { $regex: `^${name}`, $options: 'i' });
  message && ($match.message = { $regex: `^${message}`, $options: 'i' });

  const aggregates = [
    { $match },
    // group by error & message,
    // add first created and last created date
    {
      $group: {
        _id: {
          name: '$name',
          message: '$message',
        },
        type: { $first: '$type' },
        eid: { $min: '$_id' },
        first: { $min: '$_created' },
        last: { $max: '$_created' },
        pv: { $sum: 1 },
        sessions: { $addToSet: '$_session' },
      },
    },
  ];

  // get total count
  const getTotal = async () => {
    const res = await ErrorModel.aggregate([
      ...aggregates,
      { $count: 'total' },
    ]);
    if (res && res[0] && res[0].total) {
      return res[0].total;
    } else {
      return 0;
    }
  };

  const getData = async () => {
    const data = await ErrorModel.aggregate([
      ...aggregates,
      {
        $project: {
          _id: 0,
          eid: 1,
          type: 1,
          name: '$_id.name',
          message: '$_id.message',
          first: 1,
          last: 1,
          pv: 1,
          uv: { $size: '$sessions' },
        },
      },
      // sort by last appearance
      { $sort: { last: -1 } },
      // pagination
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
