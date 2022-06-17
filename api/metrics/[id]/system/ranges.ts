import { Types } from 'mongoose';
import { ViewModel, SessionModel } from '../../../../db/models';
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

  const type = getPayload(req, 'type', (v) =>
    ['system', 'browser', 'screen', 'language'].includes(v)
  );

  const $match = {
    _site: new Types.ObjectId(id),
    _created: { $gte: new Date(from), $lte: new Date(to) },
  };

  const getRangedPV = async () => {
    const data = await ViewModel.aggregate([
      { $match },
      // populate session
      {
        $lookup: {
          from: 'sessions',
          localField: '_session',
          foreignField: '_fp',
          as: 'session',
        },
      },
      { $set: { session: { $arrayElemAt: ['$session', 0] } } },
      {
        $group: {
          _id: {
            date: {
              $toDate: {
                $subtract: [
                  { $toLong: '$_created' },
                  { $mod: [{ $toLong: '$_created' }, 1000 * 60 * 60 * 24] },
                ],
              },
            },
            prop: `$session.${type}`,
          },
          value: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1, value: -1 } },
    ]);
    return data;
  };

  const getRangedUV = async () => {
    const data = await SessionModel.aggregate([
      { $match },
      {
        $group: {
          _id: {
            date: {
              $toDate: {
                $subtract: [
                  { $toLong: '$_created' },
                  { $mod: [{ $toLong: '$_created' }, 1000 * 60 * 60 * 24] },
                ],
              },
            },
            prop: `$${type}`,
          },
          value: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1, value: -1 } },
    ]);
    return data;
  };

  const [pv, uv] = await Promise.all([getRangedPV(), getRangedUV()]);
  let pvIdx = 0;
  let uvIdx = 0;
  let cur = dayjs(from);
  const end = dayjs(to);
  const fullData = [];
  const format = 'MM-DD';
  while (cur.isBefore(end)) {
    const curStr = cur.format(format);
    const item = { date: curStr, pvs: [] as any[], uvs: [] as any[] };
    while (pv[pvIdx] && dayjs(pv[pvIdx]._id.date).format(format) === curStr) {
      item.pvs.push({ name: pv[pvIdx]._id.prop, value: pv[pvIdx].value });
      pvIdx++;
    }
    while (uv[uvIdx] && dayjs(uv[uvIdx]._id.date).format(format) === curStr) {
      item.uvs.push({ name: uv[uvIdx]._id.prop, value: uv[uvIdx].value });
      uvIdx++;
    }
    fullData.push(item);
    cur = cur.add(1, 'day');
  }
  res.status(200).send(fullData);
}

export default methods({
  get,
});
