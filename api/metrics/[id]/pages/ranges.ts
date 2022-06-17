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

  const paths = getPayload(req, 'paths');
  const pathnames = typeof paths === 'string' ? paths.split(',') : [];

  const getPathRanges = async (pathname: string) => {
    const data = await ViewModel.aggregate([
      // all views of this pathname
      {
        $match: {
          _site: new Types.ObjectId(id),
          _created: { $gte: new Date(from), $lte: new Date(to) },
          pathname,
        },
      },
      // every day counter
      {
        $group: {
          _id: {
            $toDate: {
              $subtract: [
                { $toLong: '$_created' },
                { $mod: [{ $toLong: '$_created' }, 1000 * 60 * 60 * 24] },
              ],
            },
          },
          pv: { $sum: 1 },
          sessions: { $addToSet: '$_session' }, // all distinct sessions
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          pv: 1,
          uv: { $size: '$sessions' },
        },
      },
      { $sort: { date: 1 } },
    ]);

    let idx = 0;
    let cur = dayjs(from);
    const end = dayjs(to);
    const fullData = [];
    const format = 'MM-DD';
    while (cur.isBefore(end)) {
      const item = {} as any;
      const curStr = cur.format(format);
      if (data[idx] && dayjs(data[idx].date).format(format) === curStr) {
        item.pv = data[idx].pv;
        item.uv = data[idx].uv;
        idx++;
      } else {
        item.pv = 0;
        item.uv = 0;
      }
      item.date = cur.format(format);
      fullData.push(item);
      cur = cur.add(1, 'day');
    }
    return fullData;
  };

  const workers = pathnames.map((pathname) =>
    getPathRanges(pathname).then((data) => ({
      path: pathname,
      ranges: data,
    }))
  );
  const data = await Promise.all(workers);

  res.status(200).send(data);
}

export default methods({
  get,
});
