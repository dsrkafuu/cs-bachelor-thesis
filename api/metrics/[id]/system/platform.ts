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

  const data = await ViewModel.aggregate([
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
        _id: `$session.platform`,
        pv: { $sum: 1 }, // get page views of each pathname
        sessions: { $addToSet: '$_session' }, // get all unqiue sessions array
      },
    },
    {
      $project: {
        _id: 0,
        p: '$_id',
        pv: 1,
        uv: { $size: '$sessions' }, // count unique sessions
      },
    },
  ]);

  res.status(200).send(data);
}

export default methods({
  get,
});
