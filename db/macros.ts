/**
 * sort an array of one field
 */
export function sortArray(srcArrayField: string) {
  return {
    // build new array which is copy of sorted source array
    $reduce: {
      input: srcArrayField,
      initialValue: [], // sorted array starts from empty
      in: {
        $let: {
          vars: {
            // backup $$this and $$value of outer $reduce
            resArray: '$$value',
            curSrcArrayElem: '$$this',
          },
          in: {
            $let: {
              vars: {
                // find target (sorted) index of each element in source array
                resArrayIdx: {
                  $reduce: {
                    input: { $range: [0, { $size: '$$resArray' }] },
                    initialValue: { $size: '$$resArray' }, // find from the end of array
                    // loop through
                    in: {
                      $cond: [
                        {
                          // lower value finded
                          $lt: [
                            '$$curSrcArrayElem',
                            { $arrayElemAt: ['$$resArray', '$$this'] },
                          ],
                        },
                        // lower value not found
                        { $min: ['$$value', '$$this'] },
                        '$$value',
                      ],
                    },
                  },
                },
              },
              in: {
                // build new sorted array by slicing older one & inserting new element between
                $concatArrays: [
                  {
                    // retain the existing first part of the new array
                    $cond: [
                      { $eq: [0, '$$resArrayIdx'] },
                      [],
                      {
                        $slice: ['$$resArray', 0, '$$resArrayIdx'],
                      },
                    ],
                  },
                  ['$$curSrcArrayElem'], // pull in the new positioned element
                  {
                    // retain the existing last part of the new array
                    $cond: [
                      { $gt: [{ $size: '$$resArray' }, 0] },
                      {
                        $slice: [
                          '$$resArray',
                          '$$resArrayIdx',
                          { $size: '$$resArray' },
                        ],
                      },
                      [],
                    ],
                  },
                ],
              },
            },
          },
        },
      },
    },
  };
}

/**
 * (sorted) array of one field then return the element at a percentile
 */
export function arrayElemAtPercentile(
  sortedArrayField: string,
  percentile: number
) {
  return {
    // find the element in array at some percentile position
    $arrayElemAt: [
      sortedArrayField,
      {
        // array starts from 0 so subtract 1
        $subtract: [
          {
            // calculate the percentile index Math.ceil(p / 100 * size)
            $ceil: {
              $multiply: [
                { $divide: [percentile, 100] },
                { $size: sortedArrayField },
              ],
            },
          },
          1,
        ],
      },
    ],
  };
}
