import { Types } from 'mongoose';
import { ErrorModel, ViewModel, VitalModel } from '../../../db/models';
import methods from '../../../lib/methods';
import { withAuth, withDatabase } from '../../../lib/middleware';
import { getPayload } from '../../../lib/utils';
import dayjs from '../../../lib/dayjs';

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

  const diff = dayjs(to).diff(dayjs(from), 'day');
  let interval: number;
  if (diff >= 1) {
    interval = 1000 * 60 * 60 * 24; // daily
  } else {
    interval = 1000 * 60 * 60; // hourly
  }

  const $match = {
    _site: new Types.ObjectId(id),
    _created: { $gte: new Date(from), $lte: new Date(to) },
  };
  // every day/hour counter
  const grouper = {
    $toDate: {
      $subtract: [
        { $toLong: '$_created' },
        { $mod: [{ $toLong: '$_created' }, interval] },
      ],
    },
  };

  const getPVUVTrend = async () => {
    const data = await ViewModel.aggregate([
      { $match },
      // every day/hour counter
      {
        $group: {
          _id: grouper,
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
    return data;
  };

  const getErrorsTrend = async () => {
    const data = await ErrorModel.aggregate([
      { $match },
      // every day/hour counter
      {
        $group: {
          _id: grouper,
          errors: { $sum: 1 }, // total errors
          errorsArr: { $addToSet: '$message' }, // all distinct errors
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          es: '$errors',
          des: { $size: '$errorsArr' },
        },
      },
      { $sort: { date: 1 } },
    ]);
    return data;
  };

  const getVitalsTrend = async () => {
    const data = await VitalModel.aggregate([
      { $match },
      // every day/hour counter
      {
        $group: {
          _id: grouper,
          vt: { $sum: 1 }, // total vitals
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          vt: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);
    return data;
  };

  const [pvuv, errors, vitals] = await Promise.all([
    getPVUVTrend(),
    getErrorsTrend(),
    getVitalsTrend(),
  ]);
  let pvuvIdx = 0;
  let errorsIdx = 0;
  let vitalsIdx = 0;
  let cur = dayjs(from);
  const end = dayjs(to);
  const data = [];
  const format = diff >= 1 ? 'MM-DD' : 'HH:mm';
  while (cur.isBefore(end)) {
    const item = {} as any;
    const curStr = cur.format(format);
    if (pvuv[pvuvIdx] && dayjs(pvuv[pvuvIdx].date).format(format) === curStr) {
      item.pv = pvuv[pvuvIdx].pv;
      item.uv = pvuv[pvuvIdx].uv;
      pvuvIdx++;
    } else {
      item.pv = 0;
      item.uv = 0;
    }
    if (
      errors[errorsIdx] &&
      dayjs(errors[errorsIdx].date).format(format) === curStr
    ) {
      item.es = errors[errorsIdx].es;
      item.des = errors[errorsIdx].des;
      errorsIdx++;
    } else {
      item.es = 0;
      item.des = 0;
    }
    if (
      vitals[vitalsIdx] &&
      dayjs(vitals[vitalsIdx].date).format(format) === curStr
    ) {
      item.vt = vitals[vitalsIdx].vt;
      vitalsIdx++;
    } else {
      item.vt = 0;
    }
    item.date = cur.format(format);
    data.push(item);
    cur = cur.add(1, diff >= 1 ? 'day' : 'hour');
  }
  res.status(200).send(data);
}

export default methods({
  get,
});
