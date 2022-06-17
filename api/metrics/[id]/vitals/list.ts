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
  const page = Number(getPayload(req, 'page')) || 1;
  const pagesize = Number(getPayload(req, 'pagesize')) || 5;

  const getData = async (key: string) => {
    const data = await VitalModel.aggregate([
      {
        $match: {
          _site: new Types.ObjectId(id),
          _created: { $gte: new Date(from), $lte: new Date(to) },
          $and: [
            { [key]: { $exists: true } },
            { [key]: { $ne: null } },
            { [key]: { $ne: 0 } },
          ],
        },
      },
      // sort by value for percentile calculation
      { $sort: { [key]: 1 } },
      {
        $group: {
          _id: '$pathname',
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
      { $project: { array: 0 } },
    ]);
    return data;
  };

  const data = await Promise.all([
    getData('fcp'),
    getData('lcp'),
    getData('cls'),
    getData('fid'),
    getData('ttfb'),
  ]);
  const pathScoreMap = new Map<string, number[]>();
  const pathCountMap = new Map<string, number>();
  data.forEach((dataset, idx) => {
    dataset.forEach((item) => {
      const path = item._id;
      const score = item[mode];
      if (!pathScoreMap.has(path)) {
        pathScoreMap.set(path, new Array(idx).fill(0));
      }
      (pathScoreMap.get(path) as number[]).push(score);
      const count = item.count || 0;
      if (!pathCountMap.has(path)) {
        pathCountMap.set(path, 0);
      }
      pathCountMap.set(path, pathCountMap.get(path) + count);
    });
  });
  let nesData = [];
  for (const [path, scores] of pathScoreMap) {
    nesData.push({
      path,
      nes: getNES(scores[0], scores[1], scores[2], scores[3]),
      fcp: scores[0],
      lcp: scores[1],
      cls: scores[2],
      fid: scores[3],
      ttfb: scores[4],
      count: pathCountMap.get(path) || 0,
    });
  }
  nesData.sort((a, b) => b.nes - a.nes);
  nesData = nesData.filter((item) => item.nes > 0);

  // pagination
  const total = nesData.length;
  const start = (page - 1) * pagesize;
  const end = start + pagesize;
  nesData = nesData.slice(start, end);
  res.status(200).send({ total, data: nesData });
}

export default methods({
  get,
});
