import 'dotenv/config';
import process from 'process';
import { Types } from 'mongoose';
import fs from 'fs';
import path from 'path';
import { VitalModel } from '../../db/models';
import { arrayElemAtPercentile, sortArray } from '../../db/macros';
import { withDatabase } from '../../lib/middleware';
import dayjs from '../../lib/dayjs';

await withDatabase();
// 2022-04-08 14:30:00 GMT+8
const to = dayjs(1649399400000);

async function macro() {
  const aggregates = [
    {
      $match: {
        _site: new Types.ObjectId('6239c1e5a8cc0d830a00f543'),
        _created: { $lte: to.toDate() },
      },
    },
    // get data array
    {
      $group: {
        _id: null,
        // max: { $max: '$fcp' },
        // min: { $min: '$fcp' },
        // avg: { $avg: '$fcp' },
        array: { $push: '$fcp' },
      },
    },
    // sort and get percentile using macro
    {
      $set: {
        sortedArray: sortArray('$array'),
      },
    },
    {
      $project: {
        p75: arrayElemAtPercentile('$sortedArray', 75),
      },
    },
  ];

  const explain = await VitalModel.aggregate(aggregates).explain();
  const data = await VitalModel.aggregate(aggregates);

  fs.writeFileSync(
    path.resolve(__dirname, 'macro.json'),
    JSON.stringify({ data, explain }, null, 2)
  );
}

async function group() {
  const aggregates = [
    {
      $match: {
        _site: new Types.ObjectId('6239c1e5a8cc0d830a00f543'),
        _created: { $lte: to.toDate() },
        fcp: { $exists: true },
      },
    },
    // directly sort array
    { $sort: { fcp: 1 } },
    {
      $group: {
        _id: null,
        array: { $push: '$fcp' },
      },
    },
    // get 75 percentile
    {
      $project: {
        p75: arrayElemAtPercentile('$array', 75),
      },
    },
  ];

  const explain = await VitalModel.aggregate(aggregates as any).explain();
  const data = await VitalModel.aggregate(aggregates as any);

  fs.writeFileSync(
    path.resolve(__dirname, 'group.json'),
    JSON.stringify({ data, explain }, null, 2)
  );
}

macro()
  .then(() => group())
  .then(() => process.exit(0));
