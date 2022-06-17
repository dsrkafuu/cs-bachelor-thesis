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
  let to = Number(getPayload(req, 'to'));
  const tz = getPayload(req, 'tz');
  if (tz) {
    const offset = dayjs(to, tz).utcOffset() * 60000;
    to -= offset;
  }
  const now = dayjs(to);

  const getDistinctSessions = async (minutes: number) => {
    const res = await ViewModel.aggregate([
      {
        $match: {
          _site: new Types.ObjectId(id),
          _created: {
            $gte: now.subtract(minutes, 'minute').toDate(),
            $lte: now.toDate(),
          },
        },
      },
      { $group: { _id: '$_session' } },
      { $count: 'total' },
    ]);
    return (res && res[0] ? res[0].total : 0) || 0;
  };

  // per hour sessions (distinct) in 1 day
  const getPerHourCount = async () => {
    const res = await ViewModel.aggregate([
      {
        $match: {
          _site: new Types.ObjectId(id),
          _created: {
            $gte: now.subtract(1, 'day').toDate(),
            $lte: now.toDate(),
          },
        },
      },
      // every hour counter
      {
        $group: {
          _id: {
            $toDate: {
              $subtract: [
                { $toLong: '$_created' },
                { $mod: [{ $toLong: '$_created' }, 1000 * 60 * 60] },
              ],
            },
          },
          sessions: { $addToSet: '$_session' }, // all distinct sessions
        },
      },
      // distinct sessions num
      {
        $project: {
          _id: 1,
          sessions: { $size: '$sessions' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    if (res && res.length) {
      const data = [];
      let idx = res.length - 1;
      for (let i = 0; i < 24; i++) {
        const time = dayjs(now).startOf('hour').subtract(i, 'hour');
        const item = res[idx];
        if (item && dayjs(item._id).valueOf() === time.valueOf()) {
          data.push(item.sessions);
          idx--;
        } else {
          data.push(0);
        }
      }
      return data;
    } else {
      return new Array(24).fill(0);
    }
  };

  const [tenMins, oneHour, halfDay, perHour] = await Promise.all([
    getDistinctSessions(10),
    getDistinctSessions(60),
    getDistinctSessions(60 * 12),
    getPerHourCount(),
  ]);
  res.status(200).send({
    tenMins,
    oneHour,
    halfDay,
    perHour,
  });
}

export default methods({
  get,
});
