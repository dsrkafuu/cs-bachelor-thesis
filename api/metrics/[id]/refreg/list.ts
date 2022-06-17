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
  const getTotalPVUV = async () => {
    const res = await ViewModel.aggregate([
      { $match },
      {
        $group: {
          _id: null,
          pv: { $sum: 1 }, // get page views of each match
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
    return (res && res[0]) || { pv: 0, uv: 0 };
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

  const getDirectPV = async () => {
    const res = await ViewModel.aggregate([
      { $match: { ...$match, referrer: null } },
      { $count: 'total' },
    ]);
    return (res && res[0] && res[0].total) || 0;
  };
  const getDirectUV = async () => {
    const res = await ViewModel.aggregate([
      { $match },
      ...uvAggragates,
      { $match: { referrer: null } },
      { $count: 'total' },
    ]);
    return (res && res[0] && res[0].total) || 0;
  };

  const searchMatch = {
    $or: Object.values(search).map((item) => ({
      referrer: { $regex: item.regex, $options: 'i' },
    })),
  };
  const getSearchPV = async () => {
    const res = await ViewModel.aggregate([
      { $match: { ...$match, ...searchMatch } },
      { $count: 'total' },
    ]);
    return (res && res[0] && res[0].total) || 0;
  };
  const getSearchUV = async () => {
    const res = await ViewModel.aggregate([
      { $match },
      ...uvAggragates,
      { $match: searchMatch },
      { $count: 'total' },
    ]);
    return (res && res[0] && res[0].total) || 0;
  };

  const [totalPVUV, directPV, directUV, searchPV, searchUV] = await Promise.all(
    [getTotalPVUV(), getDirectPV(), getDirectUV(), getSearchPV(), getSearchUV()]
  );
  const composed = {
    dir: { pv: directPV, uv: directUV },
    sch: { pv: searchPV, uv: searchUV },
    ref: {
      pv: totalPVUV.pv - directPV - searchPV,
      uv: totalPVUV.uv - directUV - searchUV,
    },
  };
  res.status(200).send(composed);
}

export default methods({
  get,
});
