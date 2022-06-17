import { Types } from 'mongoose';
import { ViewModel } from '../../../../db/models';
import methods from '../../../../lib/methods';
import { withAuth, withDatabase } from '../../../../lib/middleware';
import { getPayload } from '../../../../lib/utils';
import dayjs from '../../../../lib/dayjs';
import search from '../../../../lib/search';

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
  const pathname = getPayload(req, 'pathname');

  const $match = {
    _site: new Types.ObjectId(id),
    _created: { $gte: new Date(from), $lte: new Date(to) },
  } as any;
  pathname && ($match.pathname = { $regex: `^${pathname}`, $options: 'i' });
  const everyDayGroup = {
    $toDate: {
      $subtract: [
        { $toLong: '$_created' },
        { $mod: [{ $toLong: '$_created' }, 1000 * 60 * 60 * 24] },
      ],
    },
  };

  const getRangedTotalPVUV = async () => {
    const res = await ViewModel.aggregate([
      { $match },
      {
        $group: {
          _id: everyDayGroup, // every day counter
          pv: { $sum: 1 },
          sessions: { $addToSet: '$_session' }, // all distinct sessions
        },
      },
      {
        $project: {
          _id: 1,
          pv: 1,
          uv: { $size: '$sessions' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return res;
  };

  // in uv count, needs to get first view of each session
  // then match again use referrer to get uv datas
  const uvAggragates = [
    // get all views group by session
    {
      $group: {
        _id: '$_session',
        views: { $push: '$$ROOT' },
      },
    },
    { $sort: { 'views.created': 1 } },
    // replace root use first view of one session
    { $replaceRoot: { newRoot: { $arrayElemAt: ['$views', 0] } } },
  ] as any[];

  const getRangedDirectPV = async () => {
    const res = await ViewModel.aggregate([
      { $match: { ...$match, referrer: null } },
      // every day counter
      { $group: { _id: everyDayGroup, total: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    return res;
  };
  const getRangedDirectUV = async () => {
    const res = await ViewModel.aggregate([
      { $match },
      ...uvAggragates,
      { $match: { referrer: null } },
      // every day counter
      { $group: { _id: everyDayGroup, total: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    return res;
  };

  const searchMatch = {
    $or: Object.values(search).map((item) => ({
      referrer: { $regex: item.regex, $options: 'i' },
    })),
  };
  const getRangedSearchPV = async () => {
    const res = await ViewModel.aggregate([
      { $match: { ...$match, ...searchMatch } },
      // every day counter
      { $group: { _id: everyDayGroup, total: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    return res;
  };
  const getRangedSearchUV = async () => {
    const res = await ViewModel.aggregate([
      { $match },
      ...uvAggragates,
      { $match: searchMatch },
      // every day counter
      { $group: { _id: everyDayGroup, total: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    return res;
  };

  const [totalPVUV, directPV, directUV, searchPV, searchUV] = await Promise.all(
    [
      getRangedTotalPVUV(),
      getRangedDirectPV(),
      getRangedDirectUV(),
      getRangedSearchPV(),
      getRangedSearchUV(),
    ]
  );

  let totalPVUVIdx = 0;
  let directPVIdx = 0;
  let directUVIdx = 0;
  let searchPVIdx = 0;
  let searchUVIdx = 0;
  let cur = dayjs(from);
  const end = dayjs(to);
  const data = [];
  const format = 'MM-DD';
  while (cur.isBefore(end)) {
    const curStr = cur.format(format);
    const item = {
      date: curStr,
      total: { pv: 0, uv: 0 },
      dir: { pv: 0, uv: 0 },
      sch: { pv: 0, uv: 0 },
      ref: { pv: 0, uv: 0 },
    };
    if (
      totalPVUV[totalPVUVIdx] &&
      dayjs(totalPVUV[totalPVUVIdx]._id).format(format) === curStr
    ) {
      item.total.pv = totalPVUV[totalPVUVIdx].pv;
      item.total.uv = totalPVUV[totalPVUVIdx].uv;
      totalPVUVIdx++;
    } else {
      item.total.pv = 0;
      item.total.uv = 0;
    }
    if (
      directPV[directPVIdx] &&
      dayjs(directPV[directPVIdx]._id).format(format) === curStr
    ) {
      item.dir.pv = directPV[directPVIdx].total;
      directPVIdx++;
    } else {
      item.dir.pv = 0;
    }
    if (
      directUV[directUVIdx] &&
      dayjs(directUV[directUVIdx]._id).format(format) === curStr
    ) {
      item.dir.uv = directUV[directUVIdx].total;
      directUVIdx++;
    } else {
      item.dir.uv = 0;
    }
    if (
      searchPV[searchPVIdx] &&
      dayjs(searchPV[searchPVIdx]._id).format(format) === curStr
    ) {
      item.sch.pv = searchPV[searchPVIdx].total;
      searchPVIdx++;
    } else {
      item.sch.pv = 0;
    }
    if (
      searchUV[searchUVIdx] &&
      dayjs(searchUV[searchUVIdx]._id).format(format) === curStr
    ) {
      item.sch.uv = searchUV[searchUVIdx].total;
      searchUVIdx++;
    } else {
      item.sch.uv = 0;
    }
    item.ref.pv = item.total.pv - item.dir.pv - item.sch.pv;
    item.ref.uv = item.total.uv - item.dir.uv - item.sch.uv;
    delete (item as any).total;
    data.push(item);
    cur = cur.add(1, 'day');
  }
  res.status(200).send(data);
}

export default methods({
  get,
});
