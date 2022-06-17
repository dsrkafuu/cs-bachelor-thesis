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
  const tz = getPayload(req, 'tz', (v) => !!v);
  const offset = dayjs(to, tz).utcOffset() * 60000;
  to -= offset;

  const today = dayjs(to);
  const page = Number(getPayload(req, 'page'));
  const pagesize = Number(getPayload(req, 'pagesize'));

  // filters
  let from = Number(getPayload(req, 'from'));
  from -= offset;
  const fp = getPayload(req, 'fp');
  const location = getPayload(req, 'location');
  const ip = getPayload(req, 'ip');
  const platform = getPayload(req, 'platform');
  const pathname = getPayload(req, 'pathname');
  const isExport = getPayload(req, 'export');

  const $match = {
    _site: new Types.ObjectId(id),
    _created: {
      $gte: today.startOf('day').toDate(),
      $lte: today.endOf('day').toDate(),
    },
  } as any;
  if (from) {
    $match._created = {
      $gte: dayjs(from).toDate(),
      $lte: today.toDate(),
    };
  }
  if (fp && fp.length === 32) {
    $match._session = fp;
  }
  location && ($match.location = location);
  ip && ($match.ip = ip);
  platform && ($match.platform = platform);
  pathname && ($match.pathname = { $regex: `^${pathname}`, $options: 'i' });

  // get total count
  const getTotal = async () => {
    const res = await ViewModel.aggregate([{ $match }, { $count: 'total' }]);
    if (res && res[0] && res[0].total) {
      return res[0].total;
    } else {
      return 0;
    }
  };

  // get logs
  const getData = async () => {
    const aggs = [
      // populate session
      {
        $lookup: {
          from: 'sessions',
          localField: '_session',
          foreignField: '_fp',
          as: 'session',
        },
      },
      // replace root as session (session[0] unwinded) + root
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [{ $arrayElemAt: ['$session', 0] }, '$$ROOT'],
          },
        },
      },
      // apply filters
      { $match },
      {
        $project: {
          _id: 0,
          pathname: 1,
          referrer: 1,
          _created: 1,
          _fp: 1,
          ip: 1,
          browser: 1,
          platform: 1,
          location: 1,
        },
      },
      { $sort: { _created: -1 } },
    ] as any[];
    if (!isExport) {
      aggs.push({ $skip: (page - 1) * pagesize });
      aggs.push({ $limit: pagesize });
    }

    const logs = (await ViewModel.aggregate(aggs)) as Array<{
      _fp: string;
      ip: string;
      browser: string;
      platform: string;
      location: string;
      _created: string;
      pathname: string;
      status?: string;
    }>;

    // append status
    const lasts = new Map<string, boolean>();
    const tenMinsAgo = to - 10 * 60000;
    let tenMinsIdx = -1;
    for (let i = 0; i < logs.length; i++) {
      // not in recent 10 mins, all inactive
      if (new Date(logs[i]._created).valueOf() < tenMinsAgo) {
        tenMinsIdx = i;
        break;
      }
      // in recent 10 mins, check if active
      if (!lasts.has(logs[i]._fp)) {
        lasts.set(logs[i]._fp, true);
        logs[i].status = 'active';
      } else {
        logs[i].status = 'terminated';
      }
    }
    if (tenMinsIdx > -1) {
      for (let i = tenMinsIdx; i < logs.length; i++) {
        logs[i].status = 'inactive';
      }
    }
    return logs;
  };

  const [total, data] = await Promise.all([getTotal(), getData()]);
  if (isExport) {
    res.status(200).send(data);
  } else {
    res.status(200).send({ total, data });
  }
}

export default methods({
  get,
});
