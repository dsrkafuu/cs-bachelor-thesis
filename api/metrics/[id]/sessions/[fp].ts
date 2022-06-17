import { SessionModel } from '../../../../db/models';
import methods from '../../../../lib/methods';
import { withAuth, withDatabase } from '../../../../lib/middleware';
import { getPayload } from '../../../../lib/utils';

async function get(req: CoreRequest, res: CoreResponse) {
  await withDatabase();
  await withAuth(req);

  const fp = getPayload(req, 'fp', (fp) => fp?.length === 32);

  const session = await SessionModel.findOne({ _fp: fp }).lean();
  res.status(200).send(session || {});
}

export default methods({
  get,
});
