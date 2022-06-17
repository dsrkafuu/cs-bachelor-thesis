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

  const getSearchPV = async (regex: string) => {
    const res = await ViewModel.aggregate([
      { $match: { ...$match, referrer: { $regex: regex, $options: 'i' } } },
      { $count: 'total' },
    ]);
    return (res && res[0] && res[0].total) || 0;
  };
  const getSearchUV = async (regex: string) => {
    const res = await ViewModel.aggregate([
      { $match },
      ...uvAggragates,
      { $match: { referrer: { $regex: regex, $options: 'i' } } },
      { $count: 'total' },
    ]);
    return (res && res[0] && res[0].total) || 0;
  };

  const workers: any[] = [];
  // debug filter
  Object.values({
    google: search.google,
    bing: search.bing,
    baidu: search.baidu,
  }).forEach((item) => {
    workers.push(
      new Promise((resolve, reject) => {
        Promise.all([getSearchPV(item.regex), getSearchUV(item.regex)])
          .then(([pv, uv]) => resolve({ name: item.name, pv, uv }))
          .catch((e) => reject(e));
      })
    );
  });
  const data = await Promise.all(workers);
  res.status(200).send(data);
}

export default methods({
  get,
});
