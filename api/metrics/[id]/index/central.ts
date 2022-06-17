import { Types } from 'mongoose';
import { ViewModel } from '../../../../db/models';
import methods from '../../../../lib/methods';
import { withAuth, withDatabase } from '../../../../lib/middleware';
import { getPayload } from '../../../../lib/utils';
import dayjs, { Dayjs } from '../../../../lib/dayjs';

async function get(req: CoreRequest, res: CoreResponse) {
  await withDatabase();
  await withAuth(req);

  const id = getPayload(req, 'id', (id) => id?.length === 24);
  let to = Number(getPayload(req, 'to'));
  const tz = getPayload(req, 'tz', (v) => !!v);
  const offset = dayjs(to, tz).utcOffset() * 60000;
  to -= offset;
  const day = dayjs(to);

  const getHourSession = async () => {
    const res = await ViewModel.aggregate([
      {
        $match: {
          _site: new Types.ObjectId(id),
          _created: {
            $gte: day.startOf('day').toDate(),
            $lte: day.endOf('day').toDate(),
          },
        },
      },
      { $group: { _id: '$_session' } },
      { $count: 'total' },
    ]);
    return Math.ceil(((res && res[0] ? res[0].total : 0) || 0) / 24);
  };

  const getPVUV = async (range: [Dayjs, Dayjs]) => {
    const res = await ViewModel.aggregate([
      {
        $match: {
          _site: new Types.ObjectId(id),
          _created: {
            $gte: range[0].toDate(),
            $lte: range[1].toDate(),
          },
        },
      },
      {
        $group: {
          _id: null,
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
    ]);
    return (res && res[0] ? res[0] : { pv: 0, uv: 0 }) || { pv: 0, uv: 0 };
  };

  const getTotalPVUV = async () => {
    const [pv, uv] = [
      await ViewModel.countDocuments({ _site: new Types.ObjectId(id) }),
      await ViewModel.aggregate([
        {
          $match: {
            _site: new Types.ObjectId(id),
          },
        },
        {
          $group: {
            _id: null,
            sessions: { $addToSet: '$_session' }, // get all unqiue sessions array
          },
        },
        {
          $project: {
            uv: { $size: '$sessions' }, // count unique sessions
          },
        },
      ]),
    ];
    return { pv, uv: (uv && uv[0] ? uv[0].uv : 0) || 0 };
  };

  const [ds, today, lastday, month, lastmonth, total] = await Promise.all([
    getHourSession(),
    getPVUV([day.startOf('day'), day.endOf('day')]),
    getPVUV([
      day.subtract(1, 'day').startOf('day'),
      day.subtract(1, 'day').endOf('day'),
    ]),
    getPVUV([day.startOf('month'), day.endOf('month')]),
    getPVUV([
      day.subtract(1, 'month').startOf('month'),
      day.subtract(1, 'month').endOf('month'),
    ]),
    getTotalPVUV(),
  ]);
  res.status(200).send({ ds, today, lastday, month, lastmonth, total });
}

export default methods({
  get,
});
