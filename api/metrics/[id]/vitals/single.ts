import { Types } from 'mongoose';
import { VitalModel } from '../../../../db/models';
import methods from '../../../../lib/methods';
import { withAuth, withDatabase } from '../../../../lib/middleware';
import { getPayload } from '../../../../lib/utils';
import { getNES } from '../../../../lib/vitals';
import { arrayElemAtPercentile } from '../../../../db/macros';

async function get(req: CoreRequest, res: CoreResponse) {
  await withDatabase();
  await withAuth(req);

  const id = getPayload(req, 'id', (id) => id?.length === 24);
  const to = Number(getPayload(req, 'to'));
  const from = Number(getPayload(req, 'from'));
  const mode = getPayload(req, 'mode', (v) =>
    ['p75', 'p90', 'p95', 'p99', 'avg'].includes(v)
  );

  // filters
  const pathname = getPayload(req, 'pathname');

  const getData = async (key: string) => {
    const $match = {
      _site: new Types.ObjectId(id),
      _created: { $gte: new Date(from), $lte: new Date(to) },
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
      {
        $group: {
          _id: null,
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
          count: { $size: '$array' },
        },
      },
      { $project: { _id: 0, array: 0 } },
    ]);
    return (
      (data && data[0]) || {
        min: 0,
        max: 0,
        avg: 0,
        p75: 0,
        p90: 0,
        p95: 0,
        p99: 0,
        count: 0,
      }
    );
  };

  const [fcp, lcp, cls, fid, ttfb] = await Promise.all([
    getData('fcp'),
    getData('lcp'),
    getData('cls'),
    getData('fid'),
    getData('ttfb'),
  ]);
  const nes = getNES(fcp[mode], lcp[mode], cls[mode], fid[mode]);
  res.status(200).send({
    nes,
    fcp: fcp[mode],
    lcp: lcp[mode],
    cls: cls[mode],
    fid: fid[mode],
    ttfb: ttfb[mode],
    count:
      (fcp.count || 0) +
      (lcp.count || 0) +
      (cls.count || 0) +
      (fid.count || 0) +
      (ttfb.count || 0),
  });
}

export default methods({
  get,
});
