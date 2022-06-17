import { Types } from 'mongoose';
import { VitalModel } from '../../../../db/models';
import methods from '../../../../lib/methods';
import { withAuth, withDatabase } from '../../../../lib/middleware';
import { getPayload } from '../../../../lib/utils';
import dayjs from '../../../../lib/dayjs';
import { arrayElemAtPercentile } from '../../../../db/macros';
import { getNES } from '../../../../lib/vitals';

async function get(req: CoreRequest, res: CoreResponse) {
  await withDatabase();
  await withAuth(req);

  const id = getPayload(req, 'id', (id) => id?.length === 24);
  const to = dayjs();
  const from = to.subtract(14, 'day');
  const mode = getPayload(req, 'mode', (v) =>
    ['p75', 'p90', 'p95', 'p99', 'avg'].includes(v)
  );

  const diff = dayjs(to).diff(dayjs(from), 'day');
  let interval: number;
  if (diff >= 1) {
    interval = 1000 * 60 * 60 * 24; // daily
  } else {
    interval = 1000 * 60 * 60; // hourly
  }

  // filters
  const pathname = getPayload(req, 'pathname');

  const getData = async (key: string) => {
    const $match = {
      _site: new Types.ObjectId(id),
      _created: { $gte: from.toDate(), $lte: to.toDate() },
      $and: [
        { [key]: { $exists: true } },
        { [key]: { $ne: null } },
        { [key]: { $ne: 0 } },
      ],
    } as any;
    pathname && ($match.pathname = { $regex: `^${pathname}`, $options: 'i' });
    const data = await VitalModel.aggregate([
      { $match },
      // sort by value for percentile calculation
      { $sort: { [key]: 1 } },
      // every day/hour counter
      {
        $group: {
          _id: {
            $toDate: {
              $subtract: [
                { $toLong: '$_created' },
                { $mod: [{ $toLong: '$_created' }, interval] },
              ],
            },
          },
          min: { $min: `$${key}` },
          max: { $max: `$${key}` },
          avg: { $avg: `$${key}` },
          array: { $push: `$${key}` },
        },
      },
      {
        $set: {
          p75: arrayElemAtPercentile('$array', 75),
          p90: arrayElemAtPercentile('$array', 90),
          p95: arrayElemAtPercentile('$array', 95),
          p99: arrayElemAtPercentile('$array', 99),
        },
      },
      { $sort: { _id: 1 } },
      { $project: { array: 0 } },
    ]);
    return data;
  };

  const [fcp, lcp, cls, fid, ttfb] = await Promise.all([
    getData('fcp'),
    getData('lcp'),
    getData('cls'),
    getData('fid'),
    getData('ttfb'),
  ]);
  let fcpIdx = 0;
  let lcpIdx = 0;
  let clsIdx = 0;
  let fidIdx = 0;
  let ttfbIdx = 0;
  let cur = dayjs(from);
  const end = dayjs(to);
  const data = [];
  const format = diff >= 1 ? 'MM-DD' : 'HH:mm';
  while (cur.isBefore(end)) {
    const item = {} as any;
    const curStr = cur.format(format);
    if (fcp[fcpIdx] && dayjs(fcp[fcpIdx]._id).format(format) === curStr) {
      item.fcp = fcp[fcpIdx][mode];
      fcpIdx++;
    } else {
      item.fcp = -1;
    }
    if (lcp[lcpIdx] && dayjs(lcp[lcpIdx]._id).format(format) === curStr) {
      item.lcp = lcp[lcpIdx][mode];
      lcpIdx++;
    } else {
      item.lcp = -1;
    }
    if (cls[clsIdx] && dayjs(cls[clsIdx]._id).format(format) === curStr) {
      item.cls = cls[clsIdx][mode];
      clsIdx++;
    } else {
      item.cls = -1;
    }
    if (fid[fidIdx] && dayjs(fid[fidIdx]._id).format(format) === curStr) {
      item.fid = fid[fidIdx][mode];
      fidIdx++;
    } else {
      item.fid = -1;
    }
    if (ttfb[ttfbIdx] && dayjs(ttfb[ttfbIdx]._id).format(format) === curStr) {
      item.ttfb = ttfb[ttfbIdx][mode];
      ttfbIdx++;
    } else {
      item.ttfb = -1;
    }
    item.date = cur.format(format);
    item.nes = getNES(item.fcp, item.lcp, item.cls, item.fid);
    data.push(item);
    cur = cur.add(1, diff >= 1 ? 'day' : 'hour');
  }
  res.status(200).send(data);
}

export default methods({
  get,
});
